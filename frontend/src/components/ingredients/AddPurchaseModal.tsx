import React, { useState, useRef, useEffect, useCallback } from 'react';
import { styled } from '@linaria/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllIngredients, batchAddPurchaseApi, BatchPurchaseInputItem } from '../../api/ingredients';
import { Ingredient } from '../../types/ingredient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PurchaseItem {
  /** Stable local id for this item throughout the flow */
  localId: string;
  /** Set if this corresponds to an existing ingredient */
  ingredientId?: string;
  /** Display name */
  name: string;
  /** Aliases (only for new ingredients) */
  aliases?: string[];
  /** Whether this is a newly created ingredient (vs existing) */
  isNew: boolean;
  /** Quantity entered in step 2 (grams) */
  quantityToAdd: number;
}

interface AddPurchaseModalProps {
  onClose: () => void;
}

type Step = 'select' | 'quantities' | 'receipt';

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalBox = styled.div`
  background: var(--surface-color);
  border-radius: var(--border-radius-lg);
  padding: var(--space-xl);
  min-width: 480px;
  max-width: 640px;
  width: 92%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
`;

const ModalTitle = styled.h3`
  margin: 0 0 var(--space-xs);
`;

const StepIndicator = styled.div`
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
  margin-bottom: var(--space-lg);
`;

const StepContent = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: var(--border-width) solid var(--border-color-light);
  flex-wrap: wrap;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  cursor: pointer;
  white-space: nowrap;
  min-height: 36px;

  background: ${({ variant }) =>
    variant === 'primary'
      ? 'var(--primary-color)'
      : variant === 'danger'
        ? 'var(--danger-color)'
        : 'var(--surface-color)'};
  color: ${({ variant }) =>
    variant === 'primary'
      ? 'var(--text-on-primary)'
      : variant === 'danger'
        ? 'white'
        : 'var(--text-color)'};
  border: ${({ variant }) =>
    variant === 'secondary' || !variant
      ? 'var(--border-width) solid var(--border-color)'
      : 'none'};

  &:hover {
    background: ${({ variant }) =>
      variant === 'primary'
        ? 'var(--primary-color-dark)'
        : variant === 'danger'
          ? 'var(--danger-color-dark)'
          : 'var(--surface-color-light)'};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  margin-bottom: var(--space-md);
`;

const ResultsList = styled.div`
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  max-height: 180px;
  overflow-y: auto;
  margin-bottom: var(--space-md);
`;

const ResultItem = styled.div`
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  font-size: var(--font-size-sm);
  border-bottom: var(--border-width) solid var(--border-color-light);
  transition: background-color 0.1s;

  &:last-child { border-bottom: none; }
  &:hover { background-color: var(--surface-color-light); }

  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SelectedItemsList = styled.div`
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: var(--space-md);
`;

const SelectedItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xs) var(--space-md);
  font-size: var(--font-size-sm);
  border-bottom: var(--border-width) solid var(--border-color-light);

  &:last-child { border-bottom: none; }
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: var(--danger-color);
  cursor: pointer;
  font-size: var(--font-size-sm);
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);

  &:hover { background: var(--danger-color-light); }
`;

const NewIngredientForm = styled.div`
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-top: var(--space-sm);
  padding: var(--space-md);
  background: var(--surface-color-light);
  border-radius: var(--border-radius);
`;

const NewIngredientInput = styled.input`
  flex: 1;
  min-width: 120px;
`;

const AddNewButton = styled(Button)`
  flex-shrink: 0;
`;

const QuantityStepContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-lg) 0;
`;

const QuantityItemName = styled.div`
  font-size: var(--font-size-xl);
  font-weight: 600;
  text-align: center;
`;

const QuantityBadge = styled.span`
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
  background: var(--surface-color-light);
  padding: 2px 10px;
  border-radius: 12px;
`;

const QuantityInput = styled.input`
  font-size: var(--font-size-xl);
  text-align: center;
  width: 160px;
  padding: var(--space-md);
  border: 2px solid var(--primary-color);
  border-radius: var(--border-radius-lg);
  outline: none;

  &:focus {
    box-shadow: 0 0 0 3px var(--focus-ring-color);
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const QuantityNavRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-md);
`;

const ReceiptTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);

  th, td {
    padding: var(--space-xs) var(--space-sm);
    text-align: left;
    border-bottom: var(--border-width) solid var(--border-color-light);
  }
  th {
    font-weight: 600;
    color: var(--text-color-light);
    text-transform: uppercase;
    font-size: var(--font-size-xs);
    letter-spacing: 0.3px;
  }
`;

const ReceiptQtyInput = styled.input`
  width: 80px;
  text-align: right;
  padding: var(--space-xs) var(--space-sm);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-sm);

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: var(--space-xl);
  color: var(--text-color-light);
  font-style: italic;
  font-size: var(--font-size-sm);
`;

const SuccessMessage = styled.div`
  text-align: center;
  padding: var(--space-lg);
  color: var(--success-color, #28a745);
  font-weight: 600;
  font-size: var(--font-size-lg);
`;

const ErrorText = styled.div`
  font-size: var(--font-size-xs);
  color: var(--danger-color);
  margin-top: var(--space-xs);
`;

const ConfirmButton = styled(Button)`
  font-size: var(--font-size-base);
  padding: var(--space-md) var(--space-xl);
`;

// ---------------------------------------------------------------------------
// Local ID generator
// ---------------------------------------------------------------------------

let localIdCounter = 0;
const genId = () => `purchase-item-${++localIdCounter}`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({ onClose }) => {
  const queryClient = useQueryClient();

  // ── Flow state ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('select');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [currentQtyIndex, setCurrentQtyIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // ── Step 1 state ───────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientAliases, setNewIngredientAliases] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Refs for auto-focus
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // ── Search existing ingredients ────────────────────────────────────────
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await getAllIngredients(1, 15, searchTerm.trim());
        setSearchResults(res.data.filter(
          (ing) => !items.some((item) => item.ingredientId === ing._id),
        ));
      } catch {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 250);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchTerm, items]);

  // ── Auto-focus quantity input ──────────────────────────────────────────
  useEffect(() => {
    if (step === 'quantities' && qtyInputRef.current) {
      qtyInputRef.current.focus();
    }
  }, [step, currentQtyIndex]);

  // ── Handlers: Step 1 ──────────────────────────────────────────────────

  const addExistingIngredient = (ing: Ingredient) => {
    if (items.some((i) => i.ingredientId === ing._id)) return;
    setItems((prev) => [
      ...prev,
      {
        localId: genId(),
        ingredientId: ing._id,
        name: ing.name,
        isNew: false,
        quantityToAdd: 0,
      },
    ]);
    setSearchTerm('');
    setSearchResults([]);
  };

  const removeItem = (localId: string) => {
    setItems((prev) => prev.filter((i) => i.localId !== localId));
  };

  const addNewIngredient = () => {
    const name = newIngredientName.trim();
    if (!name) return;

    setItems((prev) => [
      ...prev,
      {
        localId: genId(),
        name,
        aliases: newIngredientAliases
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        isNew: true,
        quantityToAdd: 0,
      },
    ]);
    setNewIngredientName('');
    setNewIngredientAliases('');
  };

  const handleNewIngredientKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addNewIngredient();
    }
  };

  const canProceedToQuantities = items.length > 0;

  // ── Handlers: Step 2 ──────────────────────────────────────────────────

  const handleQtyChange = (value: string) => {
    const qty = parseFloat(value) || 0;
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === currentQtyIndex ? { ...item, quantityToAdd: Math.max(0, qty) } : item,
      ),
    );
  };

  const advanceToNextQty = () => {
    if (currentQtyIndex < items.length - 1) {
      setCurrentQtyIndex((i) => i + 1);
    } else {
      setStep('receipt');
    }
  };

  const goToPrevQty = () => {
    if (currentQtyIndex > 0) {
      setCurrentQtyIndex((i) => i - 1);
    }
  };

  const handleQtyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      advanceToNextQty();
    }
  };

  // ── Handlers: Step 3 ──────────────────────────────────────────────────

  const updateReceiptQty = (localId: string, value: string) => {
    const qty = parseFloat(value) || 0;
    setItems((prev) =>
      prev.map((item) =>
        item.localId === localId ? { ...item, quantityToAdd: Math.max(0, qty) } : item,
      ),
    );
  };

  const goBackToSelect = () => {
    setStep('select');
  };

  // ── Submit ────────────────────────────────────────────────────────────

  const batchMutation = useMutation({
    mutationFn: (purchaseItems: BatchPurchaseInputItem[]) =>
      batchAddPurchaseApi(purchaseItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      setStep('receipt'); // Keep on receipt but show success
      setSubmitted(true);
    },
    onError: (err: Error) => {
      setError(err.message || 'Error en processar la compra.');
    },
  });

  const [submitted, setSubmitted] = useState(false);

  const handleConfirm = useCallback(() => {
    setError(null);

    const payload: BatchPurchaseInputItem[] = items.map((item) => ({
      ...(item.ingredientId ? { ingredientId: item.ingredientId } : { name: item.name, aliases: item.aliases }),
      quantityToAdd: item.quantityToAdd,
    }));

    batchMutation.mutate(payload);
  }, [items, batchMutation]);

  // ── Current item for step 2 ───────────────────────────────────────────
  const currentItem = items[currentQtyIndex];

  // ── Render ────────────────────────────────────────────────────────────

  const renderStepIndicator = (): string => {
    switch (step) {
      case 'select':    return 'Pas 1 de 3 — Selecciona ingredients';
      case 'quantities': return `Pas 2 de 3 — Quantitats (${currentQtyIndex + 1} de ${items.length})`;
      case 'receipt':    return submitted ? 'Compra completada!' : 'Pas 3 de 3 — Revisa i confirma';
    }
  };

  return (
    <ModalOverlay onClick={submitted ? onClose : undefined}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <ModalTitle>🛒 Afegir Compra</ModalTitle>
        <StepIndicator>{renderStepIndicator()}</StepIndicator>

        <StepContent>
          {/* ─── STEP 1: Selection ─── */}
          {step === 'select' && (
            <>
              <SearchInput
                type="search"
                placeholder="Cerca ingredients existents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />

              {searchTerm.trim() && (
                <ResultsList>
                  {isSearching && (
                    <ResultItem><span style={{ fontStyle: 'italic' }}>Cercant...</span></ResultItem>
                  )}
                  {!isSearching && searchResults.length === 0 && (
                    <ResultItem><span style={{ fontStyle: 'italic', color: 'var(--text-color-light)' }}>No s'han trobat ingredients</span></ResultItem>
                  )}
                  {searchResults.map((ing) => (
                    <ResultItem key={ing._id} onClick={() => addExistingIngredient(ing)}>
                      <span>{ing.name}</span>
                      <span style={{ color: 'var(--text-color-light)', fontSize: 'var(--font-size-xs)' }}>
                        Stock: {ing.quantityInStock}g
                      </span>
                    </ResultItem>
                  ))}
                </ResultsList>
              )}

              {items.length > 0 && (
                <>
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, marginBottom: 'var(--space-xs)', color: 'var(--text-color-light)' }}>
                    Seleccionats ({items.length}):
                  </div>
                  <SelectedItemsList>
                    {items.map((item) => (
                      <SelectedItem key={item.localId}>
                        <span>
                          {item.name}
                          {item.isNew && (
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--primary-color)', marginLeft: 4 }}>
                              (nou)
                            </span>
                          )}
                        </span>
                        <RemoveButton onClick={() => removeItem(item.localId)}>✕</RemoveButton>
                      </SelectedItem>
                    ))}
                  </SelectedItemsList>
                </>
              )}

              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, marginTop: 'var(--space-md)', color: 'var(--text-color-light)' }}>
                Afegir ingredient nou:
              </div>
              <NewIngredientForm>
                <NewIngredientInput
                  type="text"
                  placeholder="Nom del ingredient"
                  value={newIngredientName}
                  onChange={(e) => setNewIngredientName(e.target.value)}
                  onKeyDown={handleNewIngredientKeyDown}
                />
                <NewIngredientInput
                  type="text"
                  placeholder="Àlies (opcional, separats per coma)"
                  value={newIngredientAliases}
                  onChange={(e) => setNewIngredientAliases(e.target.value)}
                  style={{ minWidth: 180 }}
                />
                <AddNewButton
                  variant="secondary"
                  onClick={addNewIngredient}
                  disabled={!newIngredientName.trim()}
                >
                  + Afegir
                </AddNewButton>
              </NewIngredientForm>
            </>
          )}

          {/* ─── STEP 2: Quantities ─── */}
          {step === 'quantities' && currentItem && (
            <QuantityStepContainer>
              <QuantityBadge>
                {currentQtyIndex + 1} de {items.length}
              </QuantityBadge>
              <QuantityItemName>{currentItem.name}</QuantityItemName>

              <QuantityInput
                ref={qtyInputRef}
                type="number"
                min={0}
                step={1}
                value={currentItem.quantityToAdd || ''}
                onChange={(e) => handleQtyChange(e.target.value)}
                onKeyDown={handleQtyKeyDown}
                placeholder="grams"
              />
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)' }}>
                Prem <strong>Enter</strong> per continuar
              </div>

              <QuantityNavRow>
                <Button
                  variant="secondary"
                  onClick={goToPrevQty}
                  disabled={currentQtyIndex === 0}
                >
                  ← Anterior
                </Button>
                <Button variant="primary" onClick={advanceToNextQty}>
                  {currentQtyIndex < items.length - 1 ? 'Següent →' : 'Finalitzar →'}
                </Button>
              </QuantityNavRow>
            </QuantityStepContainer>
          )}

          {/* ─── STEP 3: Receipt ─── */}
          {step === 'receipt' && (
            <>
              {submitted ? (
                <SuccessMessage>
                  ✅ Compra afegida correctament!<br />
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 400 }}>
                    {items.length} ingredient{items.length !== 1 ? 's' : ''} actualitzat{items.length !== 1 ? 's' : ''}.
                  </span>
                </SuccessMessage>
              ) : (
                <>
                  <ReceiptTable>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Ingredient</th>
                        <th>Tipus</th>
                        <th>Quantitat (g)</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={item.localId}>
                          <td style={{ color: 'var(--text-color-light)' }}>{idx + 1}</td>
                          <td>{item.name}</td>
                          <td>
                            <span style={{
                              fontSize: 'var(--font-size-xs)',
                              color: item.isNew ? 'var(--primary-color)' : 'var(--text-color-light)',
                            }}>
                              {item.isNew ? 'nou' : 'existent'}
                            </span>
                          </td>
                          <td>
                            <ReceiptQtyInput
                              type="number"
                              min={0}
                              step={1}
                              value={item.quantityToAdd || ''}
                              onChange={(e) => updateReceiptQty(item.localId, e.target.value)}
                            />
                          </td>
                          <td>
                            <RemoveButton onClick={() => removeItem(item.localId)}>✕</RemoveButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </ReceiptTable>

                  {items.length === 0 && (
                    <EmptyState>No hi ha ingredients. Afegeix-ne alguns.</EmptyState>
                  )}

                  {error && <ErrorText>{error}</ErrorText>}
                </>
              )}
            </>
          )}
        </StepContent>

        {/* ─── Footer actions ─── */}
        <ModalActions>
          {step === 'select' && (
            <>
              <Button variant="secondary" onClick={onClose}>Cancel·lar</Button>
              <Button
                variant="primary"
                onClick={() => { setCurrentQtyIndex(0); setStep('quantities'); }}
                disabled={!canProceedToQuantities}
              >
                Següent →
              </Button>
            </>
          )}

          {step === 'quantities' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <Button variant="secondary" onClick={() => setStep('select')}>
                ← Tornar a selecció
              </Button>
            </div>
          )}

          {step === 'receipt' && !submitted && (
            <>
              <Button variant="secondary" onClick={goBackToSelect}>
                + Afegir més
              </Button>
              <ConfirmButton
                variant="primary"
                onClick={handleConfirm}
                disabled={batchMutation.isPending || items.length === 0}
              >
                {batchMutation.isPending ? 'Desant...' : '✅ Confirmar compra'}
              </ConfirmButton>
            </>
          )}

          {step === 'receipt' && submitted && (
            <Button variant="primary" onClick={onClose} style={{ width: '100%' }}>
              Tancar
            </Button>
          )}
        </ModalActions>
      </ModalBox>
    </ModalOverlay>
  );
};

export default AddPurchaseModal;
