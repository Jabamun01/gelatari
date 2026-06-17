import { useState, useCallback, useMemo } from 'react';
import { styled } from '@linaria/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFlavorCosts } from '../../api/costs';
import { updateFlavor } from '../../api/iceCreamFlavors';
import { FlavorCostRow } from '../../types/costs';
import { ConversionHistoryModal } from './ConversionHistoryModal';
import { useDebounce } from '../../utils/hooks';
import { normalizeText } from '../../utils/formatting';

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

const ThSortable = styled.th<{ $active?: boolean; $dir?: 'asc' | 'desc' }>`
  cursor: pointer;
  user-select: none;
  background: ${({ $active }) =>
    $active ? 'var(--primary-color-light, #e8f0fe)' : 'var(--surface-color-light)'};
  color: ${({ $active }) =>
    $active ? 'var(--primary-color, #1a73e8)' : 'inherit'};

  &:hover {
    background: var(--primary-color-light, #e8f0fe);
  }

  &::after {
    content: ${({ $active, $dir }) =>
      $active
        ? $dir === 'asc'
          ? "' ▲'"
          : "' ▼'"
        : "' \u2003'"};
    font-size: var(--font-size-xs);
    opacity: 0.7;
  }
`;

/** Cell that shows cost in red when ingredient prices are missing */
const CostCell = styled.td<{ $missing?: boolean }>`
  color: ${({ $missing }) => ($missing ? 'var(--danger-color, #dc3545)' : 'inherit')};
  font-weight: ${({ $missing }) => ($missing ? '600' : 'inherit')};
  position: relative;
  cursor: ${({ $missing }) => ($missing ? 'help' : 'default')};

  &:hover .missing-tooltip {
    display: block;
  }
`;

const MissingTooltip = styled.div`
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  padding: 6px 10px;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
  box-shadow: var(--shadow-lg);
  line-height: 1.4;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -4px;
    border: 4px solid transparent;
    border-top-color: #333;
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

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  max-width: 400px;
  font-size: var(--font-size-base);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius-lg);
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
  const [sort, setSort] = useState<{ column: string; dir: 'asc' | 'desc' }>({
    column: '',
    dir: 'asc',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: costs, isLoading, isError, error } = useQuery<FlavorCostRow[]>({
    queryKey: ['flavorCosts'],
    queryFn: fetchFlavorCosts,
  });

  // Sorting — click once = asc, twice = desc, three times = clear
  const handleSort = useCallback((column: string) => {
    setSort((prev) => {
      if (prev.column === column) {
        if (prev.dir === 'asc') return { column, dir: 'desc' };
        return { column: '', dir: 'asc' }; // third click clears sort
      }
      return { column, dir: 'asc' };
    });
  }, []);

  const sortedCosts = useMemo(() => {
    let list = costs ?? [];
    // Search filter (shared utilities, no duplication)
    if (debouncedSearchTerm) {
      const normalizedTerm = normalizeText(debouncedSearchTerm).toLowerCase();
      list = list.filter((f) =>
        normalizeText(f.name).toLowerCase().includes(normalizedTerm),
      );
    }
    // Sort
    if (sort.column) {
      list = [...list].sort((a, b) => {
        let aVal: any, bVal: any;
        switch (sort.column) {
          case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
          case 'feina': aVal = a.feina || ''; bVal = b.feina || ''; break;
          case 'baseMix': aVal = a.baseMixCostPerKg; bVal = b.baseMixCostPerKg; break;
          case 'mixIns': aVal = a.mixInsCostPerKg; bVal = b.mixInsCostPerKg; break;
          case 'total': aVal = a.totalCostPerKg; bVal = b.totalCostPerKg; break;
          case 'overrun': aVal = a.overrunPercent; bVal = b.overrunPercent; break;
          case 'costPerLiter': aVal = a.costPerLiter; bVal = b.costPerLiter; break;
          case 'salePrice': aVal = a.salePriceSmall ?? -1; bVal = b.salePriceSmall ?? -1; break;
          default: return 0;
        }
        if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [costs, sort.column, sort.dir, debouncedSearchTerm]);

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

      <SearchInput
        type="search"
        placeholder="Cerca per sabor..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Cerca per sabor"
      />

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <ThSortable
                $active={sort.column === 'name'}
                $dir={sort.column === 'name' ? sort.dir : undefined}
                onClick={() => handleSort('name')}
              >Sabor</ThSortable>
              <ThSortable
                $active={sort.column === 'feina'}
                $dir={sort.column === 'feina' ? sort.dir : undefined}
                onClick={() => handleSort('feina')}
              >Feina</ThSortable>
              <ThSortable
                $active={sort.column === 'baseMix'}
                $dir={sort.column === 'baseMix' ? sort.dir : undefined}
                onClick={() => handleSort('baseMix')}
              >Base €/kg</ThSortable>
              <ThSortable
                $active={sort.column === 'mixIns'}
                $dir={sort.column === 'mixIns' ? sort.dir : undefined}
                onClick={() => handleSort('mixIns')}
              >+Mix-ins €/kg</ThSortable>
              <ThSortable
                $active={sort.column === 'total'}
                $dir={sort.column === 'total' ? sort.dir : undefined}
                onClick={() => handleSort('total')}
              >Total €/kg</ThSortable>
              <ThSortable
                $active={sort.column === 'overrun'}
                $dir={sort.column === 'overrun' ? sort.dir : undefined}
                onClick={() => handleSort('overrun')}
              >Overrun</ThSortable>
              <ThSortable
                $active={sort.column === 'costPerLiter'}
                $dir={sort.column === 'costPerLiter' ? sort.dir : undefined}
                onClick={() => handleSort('costPerLiter')}
              >€/L</ThSortable>
              <ThSortable
                $active={sort.column === 'salePrice'}
                $dir={sort.column === 'salePrice' ? sort.dir : undefined}
                onClick={() => handleSort('salePrice')}
              >Preu venda 1L</ThSortable>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sortedCosts.map((row) => (
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
                <CostCell $missing={row.missingBaseIngredientNames.length > 0}>
                  {formatEur(row.baseMixCostPerKg)}
                  {row.missingBaseIngredientNames.length > 0 && (
                    <MissingTooltip className="missing-tooltip">
                      Falta preu: {row.missingBaseIngredientNames.join(', ')}
                    </MissingTooltip>
                  )}
                </CostCell>
                <CostCell $missing={row.missingMixInIngredientNames.length > 0}>
                  {formatEur(row.mixInsCostPerKg)}
                  {row.missingMixInIngredientNames.length > 0 && (
                    <MissingTooltip className="missing-tooltip">
                      Falta preu: {row.missingMixInIngredientNames.join(', ')}
                    </MissingTooltip>
                  )}
                </CostCell>
                <CostCell $missing={row.missingBaseIngredientNames.length > 0 || row.missingMixInIngredientNames.length > 0}>
                  <strong>{formatEur(row.totalCostPerKg)}</strong>
                  {(row.missingBaseIngredientNames.length > 0 || row.missingMixInIngredientNames.length > 0) && (
                    <MissingTooltip className="missing-tooltip">
                      Falta preu:{' '}
                      {[
                        ...row.missingBaseIngredientNames,
                        ...row.missingMixInIngredientNames,
                      ].join(', ')}
                    </MissingTooltip>
                  )}
                </CostCell>
                <td>
                  {formatPercent(row.overrunPercent)}
                  <OverrunBadge source={row.overrunSource}>
                    {row.overrunSource === 'override' ? 'O' : row.overrunSource === 'historical' ? 'H' : '—'}
                  </OverrunBadge>
                </td>
                <CostCell $missing={row.missingBaseIngredientNames.length > 0 || row.missingMixInIngredientNames.length > 0}>
                  <strong>{formatEur(row.costPerLiter)}</strong>
                  {(row.missingBaseIngredientNames.length > 0 || row.missingMixInIngredientNames.length > 0) && (
                    <MissingTooltip className="missing-tooltip">
                      Falta preu:{' '}
                      {[
                        ...row.missingBaseIngredientNames,
                        ...row.missingMixInIngredientNames,
                      ].join(', ')}
                    </MissingTooltip>
                  )}
                </CostCell>
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
