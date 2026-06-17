import { useState, useCallback } from 'react';
import { styled } from '@linaria/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFlavorCosts } from '../../api/costs';
import { updateFlavor } from '../../api/iceCreamFlavors';
import { FlavorCostRow } from '../../types/costs';
import { ConversionHistoryModal } from './ConversionHistoryModal';

// ---------------------------------------------------------------------------
// Styled components
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

const LoadingMessage = styled.div`
  text-align: center;
  padding: var(--space-2xl);
  color: var(--text-color-light);
  font-style: italic;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: var(--space-lg);
  color: var(--danger-color-dark);
  background: var(--danger-color-light);
  border: 1px solid var(--danger-color);
  border-radius: var(--border-radius);
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-lg);
  background: var(--surface-color);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);

  th, td {
    padding: var(--space-sm) var(--space-md);
    text-align: right;
    white-space: nowrap;
    border-bottom: var(--border-width) solid var(--border-color-light);
  }

  th {
    background: var(--surface-color-light);
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 1;
  }

  td:first-child, th:first-child {
    text-align: left;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: var(--surface-color-light);
  }
`;

const FlavorName = styled.span`
  font-weight: 600;
  cursor: pointer;
  color: var(--text-color-strong);

  &:hover {
    color: var(--primary-color);
  }
`;

const OverrunBadge = styled.span<{ source: string }>`
  display: inline-block;
  font-size: var(--font-size-xs);
  padding: 1px 5px;
  border-radius: var(--border-radius-sm);
  margin-left: 4px;
  background: ${({ source }) =>
    source === 'override' ? 'var(--info-color-light, #d0e8ff)' :
    source === 'historical' ? 'var(--success-color-light, #d4edda)' :
    'var(--surface-color-light, #f0f0f0)'};
  color: ${({ source }) =>
    source === 'override' ? 'var(--info-color-dark, #0056b3)' :
    source === 'historical' ? 'var(--success-color-dark, #155724)' :
    'var(--text-color-light, #666)'};
`;

const InlineEdit = styled.input`
  width: 80px;
  padding: 2px 6px;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  text-align: right;
  background: var(--surface-color);
  color: var(--text-color);

  &:focus {
    outline: none;
    border-color: var(--primary-color);
  }
`;

const FeinaSelect = styled.select`
  padding: 2px 4px;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  background: var(--surface-color);
  color: var(--text-color);
`;

const HistoryButton = styled.button`
  padding: 2px 8px;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--surface-color);
  color: var(--text-color);
  font-size: var(--font-size-xs);
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background: var(--primary-color);
    color: var(--text-on-primary);
    border-color: var(--primary-color);
  }
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: var(--space-2xl);
  color: var(--text-color-light);
  font-style: italic;
`;

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const formatEur = (n: number) =>
  new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);

const formatPercent = (n: number) =>
  n.toFixed(1) + '%';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CostosTabProps {
  onOpenIceCreamFlavorEditTab: (
    flavorName: string,
    flavorId?: string,
    sourceRecipeId?: string,
    sourceRecipeName?: string,
  ) => void;
}

export const CostosTab = ({ onOpenIceCreamFlavorEditTab }: CostosTabProps) => {
  const queryClient = useQueryClient();
  const [historyFlavorId, setHistoryFlavorId] = useState<string | null>(null);
  const [historyFlavorName, setHistoryFlavorName] = useState<string>('');
  const [historyRecipeId, setHistoryRecipeId] = useState<string | undefined>(undefined);
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});
  const [_editingFeina, setEditingFeina] = useState<Record<string, string>>({});

  const { data: costs, isLoading, isError, error } = useQuery<FlavorCostRow[]>({
    queryKey: ['flavorCosts'],
    queryFn: fetchFlavorCosts,
  });

  // Mutation for updating sale price, feina, and overrun override
  const updatePriceMutation = useMutation({
    mutationFn: ({ flavorId, salePriceSmall }: { flavorId: string; salePriceSmall?: number }) =>
      updateFlavor(flavorId, { salePriceSmall }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flavorCosts'] });
    },
  });

  const handlePriceBlur = useCallback(
    (flavorId: string, _costRow: FlavorCostRow) => {
      const raw = editingPrice[flavorId];
      if (raw === undefined) return;
      const val = parseFloat(raw);
      if (!isNaN(val) && val >= 0) {
        updatePriceMutation.mutate({ flavorId, salePriceSmall: val });
      } else {
        // Reset to original
        setEditingPrice((prev) => {
          const next = { ...prev };
          delete next[flavorId];
          return next;
        });
      }
    },
    [editingPrice, updatePriceMutation],
  );

  const handleOpenHistory = (flavor: FlavorCostRow) => {
    setHistoryFlavorId(flavor._id);
    setHistoryFlavorName(flavor.name);
    setHistoryRecipeId(flavor.sourceRecipeId);
  };

  const handleCloseHistory = () => {
    setHistoryFlavorId(null);
    setHistoryFlavorName('');
    setHistoryRecipeId(undefined);
    // Refresh costs after potential event edits
    queryClient.invalidateQueries({ queryKey: ['flavorCosts'] });
  };

  if (isLoading) {
    return (
      <Container>
        <PageTitle>Costos</PageTitle>
        <LoadingMessage>Calculant costos...</LoadingMessage>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container>
        <PageTitle>Costos</PageTitle>
        <ErrorMessage>Error: {(error as Error)?.message || 'Error desconegut'}</ErrorMessage>
      </Container>
    );
  }

  if (!costs || costs.length === 0) {
    return (
      <Container>
        <PageTitle>Costos</PageTitle>
        <EmptyMessage>No hi ha sabors per mostrar. Crea alguna recepta de gelat o sorbet primer.</EmptyMessage>
      </Container>
    );
  }

  return (
    <Container>
      <PageTitle>Costos</PageTitle>

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <th>Sabor</th>
              <th>Feina</th>
              <th>Base €/kg</th>
              <th>+Mix-ins €/kg</th>
              <th>Total €/kg</th>
              <th>Overrun</th>
              <th>€/L</th>
              <th>Preu venda 1L</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {costs.map((row) => (
              <tr key={row._id}>
                <td>
                  <FlavorName
                    onClick={() =>
                      onOpenIceCreamFlavorEditTab(
                        row.name,
                        row._id,
                        row.sourceRecipeId,
                        row.sourceRecipeName,
                      )
                    }
                  >
                    {row.name}
                  </FlavorName>
                  {row.sourceRecipeName && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)' }}>
                      {row.sourceRecipeName}
                    </div>
                  )}
                </td>
                <td>
                  <FeinaSelect
                    value={row.feina ?? ''}
                    onChange={(e) => {
                      const val = e.target.value as '' | 'Baix' | 'Mitjà' | 'Alt' | 'Molt alt';
                      setEditingFeina((prev) => ({ ...prev, [row._id]: val }));
                    }}
                    onBlur={() => {
                      // Feina changes are saved via the recipe, not the flavor.
                      // For now, this is read-only here (editable in recipe editor).
                      // Could add a PATCH endpoint later if needed.
                    }}
                  >
                    <option value="">—</option>
                    <option value="Baix">Baix</option>
                    <option value="Mitjà">Mitjà</option>
                    <option value="Alt">Alt</option>
                    <option value="Molt alt">Molt alt</option>
                  </FeinaSelect>
                </td>
                <td>{formatEur(row.baseMixCostPerKg)}</td>
                <td>{formatEur(row.mixInsCostPerKg)}</td>
                <td><strong>{formatEur(row.totalCostPerKg)}</strong></td>
                <td>
                  {formatPercent(row.overrunPercent)}
                  <OverrunBadge source={row.overrunSource}>
                    {row.overrunSource === 'override' ? 'O' : row.overrunSource === 'historical' ? 'H' : '—'}
                  </OverrunBadge>
                </td>
                <td><strong>{formatEur(row.costPerLiter)}</strong></td>
                <td>
                  <InlineEdit
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="—"
                    value={
                      editingPrice[row._id] !== undefined
                        ? editingPrice[row._id]
                        : row.salePriceSmall !== undefined
                          ? row.salePriceSmall.toString()
                          : ''
                    }
                    onChange={(e) =>
                      setEditingPrice((prev) => ({ ...prev, [row._id]: e.target.value }))
                    }
                    onBlur={() => handlePriceBlur(row._id, row)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                  />
                </td>
                <td>
                  <HistoryButton onClick={() => handleOpenHistory(row)}>
                    📜 Hist.
                  </HistoryButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrapper>

      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)', textAlign: 'right' }}>
        <OverrunBadge source="historical">H</OverrunBadge> = mitjana històrica &nbsp;
        <OverrunBadge source="override">O</OverrunBadge> = override manual &nbsp;
        <OverrunBadge source="none">—</OverrunBadge> = sense dades
      </div>

      {historyFlavorId && (
        <ConversionHistoryModal
          flavorId={historyFlavorId}
          flavorName={historyFlavorName}
          recipeId={historyRecipeId}
          onClose={handleCloseHistory}
        />
      )}
    </Container>
  );
};
