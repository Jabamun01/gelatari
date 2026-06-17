import { useState, useCallback } from 'react';
import { styled } from '@linaria/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
} from '../../api/paradetaIncome';
import {
  DailyIncomeRecord,
  IncomeBracket,
  DEFAULT_INCOME_BRACKETS,
  loadBrackets,
  saveBrackets,
} from '../../types/paradetaIncome';
import { CalendarView } from './CalendarView';
import { DayEditModal } from './DayEditModal';
import { AnalyticsView } from './AnalyticsView';

// ---------------------------------------------------------------------------
// Styled
// ---------------------------------------------------------------------------

const Container = styled.div`
  max-width: 1200px;
  margin: var(--space-lg) auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
`;

const PageTitle = styled.h2`
  margin: 0;
`;

const ViewToggleRow = styled.div`
  display: flex;
  gap: var(--space-sm);
  align-items: center;
`;

const ViewToggle = styled.button<{ $active?: boolean }>`
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width) solid
    ${({ $active }) => ($active ? 'var(--primary-color)' : 'var(--border-color)')};
  border-radius: var(--border-radius-lg);
  background: ${({ $active }) =>
    $active ? 'var(--primary-color)' : 'var(--surface-color)'};
  color: ${({ $active }) =>
    $active ? 'var(--text-on-primary)' : 'var(--text-color)'};
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    border-color: var(--primary-color);
    background: ${({ $active }) =>
      $active ? 'var(--primary-color-dark)' : 'var(--surface-color-light)'};
  }
`;

const SettingsButton = styled.button`
  padding: var(--space-xs) var(--space-sm);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--surface-color);
  color: var(--text-color-light);
  font-size: var(--font-size-sm);
  cursor: pointer;
  margin-left: auto;

  &:hover {
    color: var(--text-color);
    border-color: var(--primary-color);
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: var(--space-2xl);
  color: var(--text-color-light);
  font-style: italic;
`;

const ErrorMessage = styled.div`
  padding: var(--space-md);
  color: var(--danger-color-dark);
  background: var(--danger-color-light);
  border-radius: var(--border-radius);
  text-align: center;
`;

// ---------------------------------------------------------------------------
// Bracket Settings Modal
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
  min-width: 420px;
  max-width: 560px;
  width: 92%;
  box-shadow: var(--shadow-xl);
  max-height: 85vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  margin: 0 0 var(--space-lg);
`;

const BracketRow = styled.div`
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  margin-bottom: var(--space-sm);
`;

const BracketInput = styled.input`
  padding: var(--space-xs);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  width: 80px;
  background: var(--surface-color);
  color: var(--text-color);
`;

const BracketLabelInput = styled.input`
  padding: var(--space-xs);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  flex: 1;
  background: var(--surface-color);
  color: var(--text-color);
`;

const ColorInput = styled.input`
  width: 36px;
  height: 28px;
  padding: 0;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
`;

const SmallButton = styled.button`
  padding: 4px 8px;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--surface-color);
  color: var(--text-color);
  font-size: var(--font-size-xs);
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: var(--surface-color-light); }
`;

const AddBracketButton = styled(SmallButton)`
  margin-top: var(--space-sm);
  border-color: var(--primary-color);
  color: var(--primary-color);
`;

const ResetButton = styled(SmallButton)`
  color: var(--danger-color);
  border-color: var(--danger-color);
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
  background: var(--primary-color);
  color: var(--text-on-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  &:hover { background: var(--primary-color-dark); }
`;

const SecondaryButton = styled.button`
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--surface-color);
  color: var(--text-color);
  font-size: var(--font-size-sm);
  cursor: pointer;
  &:hover { background: var(--surface-color-light); }
`;

interface BracketSettingsModalProps {
  brackets: IncomeBracket[];
  onSave: (brackets: IncomeBracket[]) => void;
  onClose: () => void;
}

const BracketSettingsModal: React.FC<BracketSettingsModalProps> = ({
  brackets,
  onSave,
  onClose,
}) => {
  // Use mutable copies
  const [items, setItems] = useState<IncomeBracket[]>(() =>
    brackets.map((b) => ({ ...b })),
  );

  const sorted = [...items].sort((a, b) => a.max - b.max);

  const updateItem = (index: number, field: keyof IncomeBracket, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addItem = () => {
    const lastMax = items.length > 0
      ? Math.max(...items.filter((b) => b.max !== Infinity).map((b) => b.max))
      : 0;
    setItems((prev) => [
      ...prev,
      { max: lastMax + 200, color: '#a5d6a7', label: 'Nou bracket' },
    ]);
  };

  const resetToDefault = () => {
    setItems(DEFAULT_INCOME_BRACKETS.map((b) => ({ ...b })));
  };

  const handleSave = () => {
    // Ensure the last bracket has max = Infinity (or keep as is)
    const clean = items.map((b) => ({
      ...b,
      max: b.max === Infinity ? Infinity : Math.max(0, b.max),
    }));
    onSave(clean);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <ModalTitle>⚙️ Configuració de franges d'ingrés</ModalTitle>

        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)', marginBottom: 'var(--space-md)' }}>
          Cada dia es colorea segons el seu ingrés brut total.
        </div>

        {sorted.map((b, i) => (
          <BracketRow key={i}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)', minWidth: 36 }}>
              {i === 0 ? '€0' : `€${sorted[i - 1].max}–`}
            </span>
            <BracketLabelInput
              value={b.label}
              onChange={(e) => updateItem(i, 'label', e.target.value)}
              placeholder="Etiqueta"
            />
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)' }}>fins</span>
            <BracketInput
              type="number"
              min={0}
              step={50}
              value={b.max === Infinity ? '' : b.max}
              onChange={(e) =>
                updateItem(i, 'max', e.target.value === '' ? Infinity : parseFloat(e.target.value) || 0)
              }
              placeholder="∞"
              disabled={i === sorted.length - 1 && b.max === Infinity}
            />
            <ColorInput
              type="color"
              value={b.color}
              onChange={(e) => updateItem(i, 'color', e.target.value)}
            />
            <SmallButton onClick={() => removeItem(i)} disabled={items.length <= 2}>
              ✕
            </SmallButton>
          </BracketRow>
        ))}

        <AddBracketButton onClick={addItem}>+ Afegir bracket</AddBracketButton>
        <ResetButton onClick={resetToDefault} style={{ marginLeft: 'var(--space-sm)' }}>
          Restablir valors per defecte
        </ResetButton>

        <ModalActions>
          <SecondaryButton onClick={onClose}>Cancel·lar</SecondaryButton>
          <ActionButton onClick={handleSave}>Desar</ActionButton>
        </ModalActions>
      </ModalBox>
    </ModalOverlay>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const ParadetaIncomeTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'calendar' | 'analytics'>('calendar');

  // Calendar navigation
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  // Collapsed months with no data
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

  // Bracket config
  const [brackets, setBrackets] = useState<IncomeBracket[]>(loadBrackets);
  const [showBracketSettings, setShowBracketSettings] = useState(false);

  // Edit modal state
  const [editDate, setEditDate] = useState<string | null>(null);
  const [editRecord, setEditRecord] = useState<DailyIncomeRecord | undefined>(undefined);

  // Fetch records for the displayed month
  const fromDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
  const toDateRaw = new Date(currentYear, currentMonth + 1, 0);
  const toDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(toDateRaw.getDate()).padStart(2, '0')}`;

  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const {
    data: monthData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['paradetaIncome', fromDate, toDate],
    queryFn: () => fetchIncomes({ fromDate, toDate, limit: 31 }),
  });

  // Fetch all records before the current month for accurate startCash derivation
  const { data: olderRecords } = useQuery({
    queryKey: ['paradetaIncome', 'before', fromDate],
    queryFn: () => fetchIncomes({ toDate: fromDate, limit: 365 }),
    staleTime: 60000,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paradetaIncome'] });
      setEditDate(null);
      setEditRecord(undefined);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => updateIncome(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paradetaIncome'] });
      setEditDate(null);
      setEditRecord(undefined);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteIncome,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paradetaIncome'] });
      setEditDate(null);
      setEditRecord(undefined);
    },
  });

  // Navigation handlers
  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }, []);

  // Day click handler
  const handleDayClick = useCallback(
    (date: string) => {
      const record = monthData?.records?.find((r) => r.date === date);

      // If we're on a month that has collapsed, expand it
      setCollapsedMonths((prev) => {
        const next = new Set(prev);
        next.delete(monthKey);
        return next;
      });

      setEditDate(date);
      setEditRecord(record);
    },
    [monthData, monthKey],
  );

  // Save handler (create or update)
  const handleSave = useCallback(
    (data: {
      date: string;
      cardAmount: number;
      endCash: number;
      cashRetired: number;
      notes?: string;
      startCash?: number;
    }) => {
      if (editRecord) {
        updateMutation.mutate({
          id: editRecord._id,
          dto: {
            cardAmount: data.cardAmount,
            endCash: data.endCash,
            cashRetired: data.cashRetired,
            notes: data.notes,
          },
        });
      } else {
        createMutation.mutate(data);
      }
    },
    [editRecord, createMutation, updateMutation],
  );

  const handleDelete = useCallback(() => {
    if (editRecord) {
      deleteMutation.mutate(editRecord._id);
    }
  }, [editRecord, deleteMutation]);

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  // Compute previous start cash for the editing day
  const getStartCashForDate = useCallback(
    (date: string): number => {
      // Look through older records + current month records sorted by date
      const all = [
        ...(olderRecords?.records || []),
        ...(monthData?.records || []),
      ].sort((a, b) => a.date.localeCompare(b.date));

      const idx = all.findIndex((r) => r.date === date);
      if (idx > 0) {
        const prev = all[idx - 1];
        return prev.endCash - prev.cashRetired;
      }
      // No previous record found in fetched data
      return 0;
    },
    [olderRecords, monthData],
  );

  const isFirstRecord =
    editDate !== null &&
    !editRecord &&
    getStartCashForDate(editDate) === 0;

  // Toggle collapse for a month with no data
  const handleToggleCollapsed = useCallback(() => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) {
        next.delete(monthKey);
      } else {
        next.add(monthKey);
      }
      return next;
    });
  }, [monthKey]);

  // Save bracket settings
  const handleSaveBrackets = useCallback(
    (newBrackets: IncomeBracket[]) => {
      saveBrackets(newBrackets);
      setBrackets(newBrackets);
      setShowBracketSettings(false);
    },
    [],
  );

  if (isLoading && !monthData) {
    return (
      <Container>
        <PageTitle>Ingressos Paradeta</PageTitle>
        <LoadingMessage>Carregant...</LoadingMessage>
      </Container>
    );
  }

  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <PageTitle>📊 Ingressos Paradeta</PageTitle>
        <ViewToggleRow>
          <ViewToggle
            $active={view === 'calendar'}
            onClick={() => setView('calendar')}
          >
            📅 Calendari
          </ViewToggle>
          <ViewToggle
            $active={view === 'analytics'}
            onClick={() => setView('analytics')}
          >
            📈 Analítiques
          </ViewToggle>
          <SettingsButton onClick={() => setShowBracketSettings(true)}>
            ⚙️
          </SettingsButton>
        </ViewToggleRow>
      </div>

      {isError && (
        <ErrorMessage>
          Error: {(error as Error)?.message || 'Error en carregar les dades'}
        </ErrorMessage>
      )}

      {view === 'calendar' ? (
        <CalendarView
          currentMonth={currentMonth}
          currentYear={currentYear}
          records={monthData?.records || []}
          brackets={brackets}
          collapsed={collapsedMonths.has(monthKey)}
          onPrevMonth={goToPrevMonth}
          onNextMonth={goToNextMonth}
          onToday={goToToday}
          onDayClick={handleDayClick}
          onToggleCollapsed={handleToggleCollapsed}
        />
      ) : (
        <AnalyticsView currentYear={currentYear} />
      )}

      {/* Day edit modal */}
      {editDate && (
        <DayEditModal
          date={editDate}
          record={editRecord}
          previousStartCash={editRecord ? editRecord.startCash : getStartCashForDate(editDate)}
          isFirstRecord={isFirstRecord}
          onSave={handleSave}
          onDelete={editRecord ? handleDelete : undefined}
          onClose={() => {
            setEditDate(null);
            setEditRecord(undefined);
          }}
          isPending={isPending}
        />
      )}

      {/* Bracket settings modal */}
      {showBracketSettings && (
        <BracketSettingsModal
          brackets={brackets}
          onSave={handleSaveBrackets}
          onClose={() => setShowBracketSettings(false)}
        />
      )}
    </Container>
  );
};
