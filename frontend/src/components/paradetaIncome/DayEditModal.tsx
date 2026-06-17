import { useState } from 'react';
import { styled } from '@linaria/react';
import { DailyIncomeRecord } from '../../types/paradetaIncome';

// ---------------------------------------------------------------------------
// Styled
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
  min-width: 360px;
  max-width: 480px;
  width: 92%;
  box-shadow: var(--shadow-xl);
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  margin: 0 0 var(--space-sm);
  font-size: var(--font-size-lg);
`;

const ModalSubtitle = styled.div`
  font-size: var(--font-size-sm);
  color: var(--text-color-light);
  margin-bottom: var(--space-lg);
`;

const FieldGroup = styled.div`
  margin-bottom: var(--space-md);
`;

const FieldLabel = styled.label`
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--text-color);
`;

const FieldInput = styled.input`
  width: 100%;
  padding: var(--space-sm);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background: var(--surface-color);
  color: var(--text-color);

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const FieldTextarea = styled.textarea`
  width: 100%;
  padding: var(--space-sm);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background: var(--surface-color);
  color: var(--text-color);
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const ComputedRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xs) 0;
  font-size: var(--font-size-sm);
  border-bottom: var(--border-width) solid var(--border-color-light);

  &:last-child {
    border-bottom: none;
  }
`;

const ComputedLabel = styled.span`
  color: var(--text-color-light);
`;

const ComputedValue = styled.span<{ $highlight?: boolean }>`
  font-weight: ${({ $highlight }) => ($highlight ? '700' : '500')};
  color: ${({ $highlight }) => ($highlight ? 'var(--primary-color-dark)' : 'var(--text-color)')};
  font-size: ${({ $highlight }) => ($highlight ? 'var(--font-size-lg)' : 'var(--font-size-sm)')};
`;

const ComputedSection = styled.div`
  background: var(--surface-color-light);
  border-radius: var(--border-radius);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-md);
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
`;

const ActionButton = styled.button`
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--border-radius);
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;

  &:hover { background-color: var(--primary-color-dark); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const SecondaryButton = styled.button`
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--surface-color);
  color: var(--text-color);
  font-size: var(--font-size-sm);
  cursor: pointer;
  white-space: nowrap;

  &:hover { background-color: var(--surface-color-light); }
`;

const DeleteButton = styled.button`
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width) solid var(--danger-color);
  border-radius: var(--border-radius);
  background: var(--danger-color);
  color: white;
  font-size: var(--font-size-sm);
  cursor: pointer;
  white-space: nowrap;
  margin-right: auto;

  &:hover { background-color: var(--danger-color-dark); }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DayEditModalProps {
  /** The date string (YYYY-MM-DD) being edited */
  date: string;
  /** Existing record, if editing */
  record?: DailyIncomeRecord;
  /** Start cash derived from previous day (or initial override) */
  previousStartCash: number;
  /** Whether this is the first record (no previous day) */
  isFirstRecord: boolean;
  /** All known records for start cash derivation display */
  onSave: (data: {
    date: string;
    cardAmount: number;
    endCash: number;
    cashRetired: number;
    notes?: string;
    startCash?: number;
  }) => void;
  onDelete?: () => void;
  onClose: () => void;
  isPending: boolean;
}

export const DayEditModal: React.FC<DayEditModalProps> = ({
  date,
  record,
  previousStartCash,
  isFirstRecord,
  onSave,
  onDelete,
  onClose,
  isPending,
}) => {
  const [cardAmount, setCardAmount] = useState(() =>
    record ? String(record.cardAmount) : '',
  );
  const [endCash, setEndCash] = useState(() =>
    record ? String(record.endCash) : '',
  );
  const [cashRetired, setCashRetired] = useState(() =>
    record ? String(record.cashRetired) : '',
  );
  const [startCashOverride, setStartCashOverride] = useState(() =>
    isFirstRecord && !record ? String(previousStartCash) : '',
  );
  const [notes, setNotes] = useState(() => record?.notes || '');

  // Evaluate a simple arithmetic expression (e.g. "55.8+612", "450-30")
  // Only allows digits, +, -, *, /, ., (, ), whitespace.
  const evaluateExpr = (s: string): string => {
    const trimmed = s.trim();
    if (!trimmed) return s;
    // If it's already just a plain number, return as-is
    if (/^\d+\.?\d*$/.test(trimmed)) return trimmed;
    // Only allow safe arithmetic characters
    if (!/^[\d+\-*/.()\s]+$/.test(trimmed)) return s;
    try {
      const result = new Function(`return (${trimmed})`)();
      if (typeof result === 'number' && isFinite(result)) {
        return String(Math.round(result * 100) / 100);
      }
    } catch {
      // evaluation failed, keep original
    }
    return s;
  };

  // Parse numbers safely
  const parseNum = (s: string) => {
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  const effectiveStartCash = isFirstRecord
    ? parseNum(startCashOverride || '0')
    : record
      ? record.startCash
      : previousStartCash;

  const effectiveCashIncome = parseNum(endCash) - effectiveStartCash;
  const effectiveTotalIncome = parseNum(cardAmount) + effectiveCashIncome;

  const canSave =
    cardAmount.trim() !== '' || endCash.trim() !== '' || cashRetired.trim() !== '';

  const handleSave = () => {
    if (!canSave) return;
    const data: any = {
      date,
      cardAmount: parseNum(cardAmount),
      endCash: parseNum(endCash),
      cashRetired: parseNum(cashRetired),
      notes: notes.trim() || undefined,
    };
    if (isFirstRecord && startCashOverride.trim() !== '') {
      data.startCash = parseNum(startCashOverride);
    }
    onSave(data);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <ModalTitle>
          {record ? `Editar: ${date}` : `Afegir: ${date}`}
        </ModalTitle>
        <ModalSubtitle>
          Introdueix les dades d'ingressos del dia
        </ModalSubtitle>

        {/* Date display */}
        <FieldGroup>
          <FieldLabel>Data</FieldLabel>
          <FieldInput type="text" value={date} disabled />
        </FieldGroup>

        {/* Start cash (read-only or editable for first record) */}
        <FieldGroup>
          <FieldLabel>
            {isFirstRecord
              ? 'Cash inicial (al inici de la temporada)'
              : 'Cash inicial (del dia anterior)'}
          </FieldLabel>
          {isFirstRecord ? (
            <FieldInput
              type="text"
              inputMode="decimal"
              value={startCashOverride}
              onChange={(e) => setStartCashOverride(e.target.value)}
              onBlur={(e) => setStartCashOverride(evaluateExpr(e.target.value))}
              placeholder="0.00"
            />
          ) : (
            <FieldInput
              type="number"
              value={effectiveStartCash.toFixed(2)}
              disabled
            />
          )}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>💳 Ingressos targeta</FieldLabel>
          <FieldInput
            type="text"
            inputMode="decimal"
            value={cardAmount}
            onChange={(e) => setCardAmount(e.target.value)}
            onBlur={(e) => setCardAmount(evaluateExpr(e.target.value))}
            placeholder="0.00"
          />
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>💵 Cash al final del dia</FieldLabel>
          <FieldInput
            type="text"
            inputMode="decimal"
            value={endCash}
            onChange={(e) => setEndCash(e.target.value)}
            onBlur={(e) => setEndCash(evaluateExpr(e.target.value))}
            placeholder="0.00"
          />
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>💵 Cash retirat del dia</FieldLabel>
          <FieldInput
            type="text"
            inputMode="decimal"
            value={cashRetired}
            onChange={(e) => setCashRetired(e.target.value)}
            onBlur={(e) => setCashRetired(evaluateExpr(e.target.value))}
            placeholder="0.00"
          />
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>📝 Notes (opcional)</FieldLabel>
          <FieldTextarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observacions..."
          />
        </FieldGroup>

        {/* Computed values */}
        <ComputedSection>
          <ComputedRow>
            <ComputedLabel>Cash inicial</ComputedLabel>
            <ComputedValue>€{effectiveStartCash.toFixed(2)}</ComputedValue>
          </ComputedRow>
          <ComputedRow>
            <ComputedLabel>Cash final</ComputedLabel>
            <ComputedValue>€{parseNum(endCash).toFixed(2)}</ComputedValue>
          </ComputedRow>
          <ComputedRow>
            <ComputedLabel>Ingrés cash (final - inicial)</ComputedLabel>
            <ComputedValue $highlight>
              €{effectiveCashIncome.toFixed(2)}
            </ComputedValue>
          </ComputedRow>
          <ComputedRow>
            <ComputedLabel>Cash retirat (per al dia següent)</ComputedLabel>
            <ComputedValue>€{parseNum(cashRetired).toFixed(2)}</ComputedValue>
          </ComputedRow>
          <ComputedRow>
            <ComputedLabel>💳 Targeta</ComputedLabel>
            <ComputedValue>€{parseNum(cardAmount).toFixed(2)}</ComputedValue>
          </ComputedRow>
          <ComputedRow style={{ borderTop: '2px solid var(--border-color)', paddingTop: 'var(--space-sm)' }}>
            <ComputedLabel><strong>💰 Ingrés brut total</strong></ComputedLabel>
            <ComputedValue $highlight>
              <strong>€{effectiveTotalIncome.toFixed(2)}</strong>
            </ComputedValue>
          </ComputedRow>
        </ComputedSection>

        <ModalActions>
          {record && onDelete && (
            <DeleteButton onClick={onDelete} disabled={isPending}>
              Eliminar
            </DeleteButton>
          )}
          <SecondaryButton onClick={onClose} disabled={isPending}>
            Cancel·lar
          </SecondaryButton>
          <ActionButton
            onClick={handleSave}
            disabled={isPending || !canSave}
          >
            {isPending ? 'Desant...' : 'Desar'}
          </ActionButton>
        </ModalActions>
      </ModalBox>
    </ModalOverlay>
  );
};
