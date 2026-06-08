import React, { useState, useMemo, useEffect } from 'react';
import { styled } from '@linaria/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaginationControls } from '../common/PaginationControls';
import { fetchEvents, IceCreamEventItem } from '../../api/iceCreamFlavors';
import {
  fetchDashboard,
  convertMixToFrozen,
  sellContainer,
  moveContainers,
  deleteFlavor,
  setFlavorStock,
  resetAllMix,
  resetAllContainers,
  resetAllFlavors,
} from '../../api/iceCreamFlavors';
import {
  DashboardFlavor,
  ConvertMixDto,
  SetFlavorStockDto,
} from '../../types/iceCreamFlavor';
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

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-md);
`;

const PageTitle = styled.h2`
  margin: 0;
`;

const ActionButton = styled.button`
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--border-radius);
  background-color: var(--primary-color);
  color: var(--text-on-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  white-space: nowrap;

  &:hover { background-color: var(--primary-color-dark); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const DangerButton = styled.button`
  padding: 2px 8px;
  border: var(--border-width) solid var(--danger-color);
  border-radius: var(--border-radius);
  background: var(--danger-color);
  color: white;
  font-size: var(--font-size-xs);
  cursor: pointer;
  white-space: nowrap;
  &:hover { background-color: var(--danger-color-dark); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const SecondaryButton = styled(ActionButton)`
  background-color: var(--surface-color);
  color: var(--text-color);
  border: var(--border-width) solid var(--border-color);
  &:hover { background-color: var(--surface-color-light); }
`;

const SmallButton = styled.button`
  padding: 2px 8px;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--surface-color);
  color: var(--text-color);
  font-size: var(--font-size-xs);
  cursor: pointer;
  white-space: nowrap;
  &:hover { background-color: var(--surface-color-light); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
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

const EmptyMessage = styled.div`
  text-align: center;
  padding: var(--space-2xl);
  color: var(--text-color-light);
  font-style: italic;
`;

const SearchSortRow = styled.div`
  display: flex;
  gap: var(--space-md);
  align-items: center;
  flex-wrap: wrap;
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 200px;
  font-size: var(--font-size-base);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--border-radius-lg);
`;

// ---------------------------------------------------------------------------
// Flavor card
// ---------------------------------------------------------------------------

const Card = styled.div<{ alertLevel?: 'low' | 'critical' }>`
  border: var(--border-width) solid
    ${({ alertLevel }) =>
      alertLevel === 'critical'
        ? 'var(--danger-color)'
        : alertLevel === 'low'
          ? 'var(--warning-color, #f0ad4e)'
          : 'var(--border-color)'};
  border-radius: var(--border-radius-lg);
  background: var(--surface-color);
  padding: var(--space-lg);
  box-shadow: ${({ alertLevel }) =>
    alertLevel === 'critical'
      ? '0 0 0 2px var(--danger-color-light)'
      : 'var(--shadow-sm)'};
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
  gap: var(--space-sm);
`;

const FlavorName = styled.h3`
  margin: 0;
  font-size: var(--font-size-lg);
`;

const BadgeGroup = styled.span`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const Badge = styled.span<{ variant?: 'essential' | 'warning' | 'danger' | 'info' }>`
  display: inline-block;
  padding: 1px 8px;
  border-radius: 12px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  background: ${({ variant }) =>
    variant === 'essential'
      ? 'var(--primary-color-light, #d4edda)'
      : variant === 'warning'
        ? '#fff3cd'
        : variant === 'danger'
          ? 'var(--danger-color-light)'
          : '#e2e3f5'};
  color: ${({ variant }) =>
    variant === 'essential'
      ? 'var(--primary-color-dark, #155724)'
      : variant === 'warning'
        ? '#856404'
        : variant === 'danger'
          ? 'var(--danger-color-dark)'
          : '#383d41'};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-md);
`;

const StatBox = styled.div`
  text-align: center;
  padding: var(--space-sm);
  background: var(--surface-color-light);
  border-radius: var(--border-radius);
`;

const StatValue = styled.div`
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-color-strong);
`;

const StatLabel = styled.div`
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
  margin-top: 2px;
`;

const LocationRow = styled.div`
  display: flex;
  gap: var(--space-md);
  flex-wrap: wrap;
  margin-bottom: var(--space-md);
  font-size: var(--font-size-sm);
`;

const LocationBlock = styled.div`
  flex: 1;
  min-width: 120px;
  padding: var(--space-sm);
  background: var(--surface-color-light);
  border-radius: var(--border-radius);
`;

const LocationLabel = styled.div`
  font-weight: 600;
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-color-light);
  margin-bottom: 4px;
`;

const LocationDetail = styled.div`
  font-size: var(--font-size-sm);
  color: var(--text-color);
`;

const ActionRow = styled.div`
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: var(--border-width) solid var(--border-color-light);
`;

// ---------------------------------------------------------------------------
// Modals (inline to keep imports clean)
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
  min-width: 340px;
  max-width: 500px;
  width: 90%;
  box-shadow: var(--shadow-xl);
`;

const ModalTitle = styled.h3`
  margin: 0 0 var(--space-lg);
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

  &[type='number'] {
    max-width: 200px;
  }
`;

const FieldSelect = styled.select`
  width: 100%;
  max-width: 200px;
  padding: var(--space-sm);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  background: var(--surface-color);
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  margin-top: var(--space-lg);
`;

// ---------------------------------------------------------------------------
// Event history (collapsible inline)
// ---------------------------------------------------------------------------

const HistoryToggle = styled.button`
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: var(--font-size-xs);
  padding: 0;
  text-decoration: underline;
  &:hover { opacity: 0.8; }
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-xs);
  margin-top: var(--space-sm);

  th, td {
    padding: 4px 8px;
    text-align: left;
    border-bottom: var(--border-width) solid var(--border-color-light);
  }
  th {
    font-weight: 600;
    color: var(--text-color-light);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
`;

const EventTypeBadge = styled.span<{ etype: string }>`
  display: inline-block;
  padding: 0 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  background: ${({ etype }) =>
    etype === 'production'
      ? '#cce5ff'
      : etype === 'conversion'
        ? '#d4edda'
        : etype === 'sale'
          ? '#f8d7da'
          : '#fff3cd'};
  color: ${({ etype }) =>
    etype === 'production'
      ? '#004085'
      : etype === 'conversion'
        ? '#155724'
        : etype === 'sale'
          ? '#721c24'
          : '#856404'};
`;

const HistorySection: React.FC<{ flavorId: string }> = ({ flavorId }) => {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['iceCreamEvents', flavorId],
    queryFn: () => fetchEvents({ flavorId, limit: 10 }),
    enabled: open,
  });

  const events = data?.events || [];

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const describeEvent = (e: IceCreamEventItem) => {
    switch (e.type) {
      case 'production':
        return `Producció: +${e.mixKgAdded?.toFixed(2)} kg mix` +
          (e.recipeName ? ` (${e.recipeName})` : '');
      case 'conversion':
        return `Conversió: ${e.mixKgConverted?.toFixed(1)} kg → ${e.frozenLitersProduced?.toFixed(1)} L` +
          ` (${e.largeContainersAdded} grans + ${e.smallContainersAdded} petits)` +
          (e.batchOverrunPercent ? ` · overrun: ${e.batchOverrunPercent.toFixed(1)}%` : '');
      case 'sale':
        return `Venda: 1 envàs ${e.soldContainerType === 'large' ? 'gran' : 'petit'} (${e.soldLocation === 'paradeta' ? 'paradeta' : 'magatzem'})`;
      case 'movement':
        return `Moviment: ${e.movedCount} ${e.movedContainerType === 'large' ? 'grans' : 'petits'}` +
          ` de ${e.movedFrom === 'warehouse' ? 'magatzem' : 'paradeta'}` +
          ` a ${e.movedTo === 'warehouse' ? 'magatzem' : 'paradeta'}`;
      default:
        return '';
    }
  };

  return (
    <div style={{ marginTop: 'var(--space-sm)' }}>
      <HistoryToggle onClick={() => setOpen(!open)}>
        {open ? '▼ Amaga historial' : '▶ Mostra historial'}
      </HistoryToggle>
      {open && (
        <div style={{ marginTop: 'var(--space-sm)' }}>
          {isLoading ? (
            <span style={{ color: 'var(--text-color-light)', fontSize: 'var(--font-size-xs)' }}>Carregant...</span>
          ) : events.length === 0 ? (
            <span style={{ color: 'var(--text-color-light)', fontSize: 'var(--font-size-xs)' }}>No hi ha esdeveniments.</span>
          ) : (
            <HistoryTable>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipus</th>
                  <th>Detall</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev._id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDate(ev.timestamp)}</td>
                    <td><EventTypeBadge etype={ev.type}>{ev.type}</EventTypeBadge></td>
                    <td>{describeEvent(ev)}</td>
                  </tr>
                ))}
              </tbody>
            </HistoryTable>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Modal components
// ---------------------------------------------------------------------------

interface ConvertModalProps {
  flavor: DashboardFlavor;
  onClose: () => void;
  onConfirm: (flavorId: string, dto: ConvertMixDto) => void;
  isPending: boolean;
}

const ConvertMixModal: React.FC<ConvertModalProps> = ({
  flavor,
  onClose,
  onConfirm,
  isPending,
}) => {
  const [mixKg, setMixKg] = useState(flavor.iceCreamMixKg > 0 ? Math.min(flavor.iceCreamMixKg, 10) : 0);
  const [frozenLiters, setFrozenLiters] = useState(0);
  const [largeContainers, setLargeContainers] = useState(0);
  const [smallContainers, setSmallContainers] = useState(0);

  const handleSubmit = () => {
    if (mixKg <= 0 || frozenLiters <= 0) return;
    if (largeContainers === 0 && smallContainers === 0) return;
    onConfirm(flavor._id, { mixKg, frozenLiters, largeContainers, smallContainers });
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <ModalTitle>
          Convertir mix a congelat — {flavor.name}
        </ModalTitle>
        <div style={{fontSize:'var(--font-size-sm)',color:'var(--text-color-light)',marginBottom:'var(--space-md)'}}>
          Mix disponible: <strong>{flavor.iceCreamMixKg.toFixed(2)} kg</strong>
          {flavor.iceCreamMixKg > 0 && (
            <span> · Overrun mitjà: <strong>{flavor.overrunPercent.toFixed(1)}%</strong></span>
          )}
        </div>

        <FieldGroup>
          <FieldLabel>Kg de mix a convertir</FieldLabel>
          <FieldInput
            type="number"
            min={0}
            step={0.1}
            value={mixKg}
            onChange={(e) => setMixKg(parseFloat(e.target.value) || 0)}
          />
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>Liters de gelat produïts</FieldLabel>
          <FieldInput
            type="number"
            min={0}
            step={0.1}
            value={frozenLiters}
            onChange={(e) => setFrozenLiters(parseFloat(e.target.value) || 0)}
          />
          {mixKg > 0 && frozenLiters > 0 && (
            <div style={{fontSize:'var(--font-size-xs)',color:'var(--text-color-light)',marginTop:4}}>
              Overrun estimat: <strong>{((frozenLiters / mixKg - 1) * 100).toFixed(1)}%</strong>
            </div>
          )}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>Envasos grans (omplir)</FieldLabel>
          <FieldInput
            type="number"
            min={0}
            step={1}
            value={largeContainers}
            onChange={(e) => setLargeContainers(parseInt(e.target.value) || 0)}
          />
          {largeContainers > 0 && frozenLiters > 0 && (
            <div style={{fontSize:'var(--font-size-xs)',color:'var(--text-color-light)',marginTop:4}}>
              ~ {(frozenLiters - smallContainers) / largeContainers} L per envàs gran
            </div>
          )}
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>Envasos petits (1L cadascun)</FieldLabel>
          <FieldInput
            type="number"
            min={0}
            step={1}
            value={smallContainers}
            onChange={(e) => setSmallContainers(parseInt(e.target.value) || 0)}
          />
        </FieldGroup>

        {/* Mix-in deduction preview */}
        {flavor.mixIns.length > 0 && mixKg > 0 && (
          <div style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-color)',
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--surface-color-light)',
            borderRadius: 'var(--border-radius)',
            marginBottom: 'var(--space-md)',
          }}>
            <strong style={{ display: 'block', marginBottom: 4 }}>🧩 Mix-ins a descomptar:</strong>
            {flavor.mixIns.map(m => {
              const grams = (m.amountPerKg * mixKg).toFixed(1);
              return (
                <div key={m.ingredient} style={{ fontSize: 'var(--font-size-xs)' }}>
                  {m.ingredientName || '?'}: <strong>{grams} g</strong>
                  {' '}({m.amountPerKg} g/kg × {mixKg.toFixed(1)} kg)
                </div>
              );
            })}
          </div>
        )}

        <ModalActions>
          <SecondaryButton onClick={onClose} disabled={isPending}>
            Cancel·lar
          </SecondaryButton>
          <ActionButton onClick={handleSubmit} disabled={isPending || mixKg <= 0 || frozenLiters <= 0 || (largeContainers === 0 && smallContainers === 0)}>
            {isPending ? 'Convertint...' : 'Convertir'}
          </ActionButton>
        </ModalActions>
      </ModalBox>
    </ModalOverlay>
  );
};

// ---------------------------------------------------------------------------

interface SellModalProps {
  flavor: DashboardFlavor;
  onClose: () => void;
  onConfirm: (flavorId: string, containerType: 'large' | 'small', location: 'warehouse' | 'paradeta') => void;
  isPending: boolean;
}

const SellContainerModal: React.FC<SellModalProps> = ({
  flavor,
  onClose,
  onConfirm,
  isPending,
}) => {
  const [containerType, setContainerType] = useState<'large' | 'small'>('small');
  const [location, setLocation] = useState<'warehouse' | 'paradeta'>('paradeta');

  const maxAvailable =
    containerType === 'large'
      ? location === 'warehouse'
        ? flavor.largeWarehouseContainers
        : flavor.largeParadetaContainers
      : location === 'warehouse'
        ? flavor.smallWarehouseCount
        : flavor.smallParadetaCount;

  const handleSubmit = () => {
    if (maxAvailable < 1) return;
    onConfirm(flavor._id, containerType, location);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <ModalTitle>Vendre envàs — {flavor.name}</ModalTitle>

        <FieldGroup>
          <FieldLabel>Tipus d'envàs</FieldLabel>
          <FieldSelect
            value={containerType}
            onChange={(e) => setContainerType(e.target.value as 'large' | 'small')}
          >
            <option value="small">Petit (1L)</option>
            <option value="large">Gran (~{(
              (location === 'warehouse'
                ? flavor.largeWarehouseLiters
                : flavor.largeParadetaLiters) /
              Math.max(1, location === 'warehouse'
                ? flavor.largeWarehouseContainers
                : flavor.largeParadetaContainers)
            ).toFixed(1)}L)</option>
          </FieldSelect>
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>Ubicació</FieldLabel>
          <FieldSelect
            value={location}
            onChange={(e) => setLocation(e.target.value as 'warehouse' | 'paradeta')}
          >
            <option value="paradeta">Paradeta</option>
            <option value="warehouse">Magatzem</option>
          </FieldSelect>
        </FieldGroup>

        {maxAvailable < 1 && (
          <div style={{ color: 'var(--danger-color)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)' }}>
            No hi ha envasos disponibles en aquesta ubicació.
          </div>
        )}

        <ModalActions>
          <SecondaryButton onClick={onClose} disabled={isPending}>
            Cancel·lar
          </SecondaryButton>
          <ActionButton onClick={handleSubmit} disabled={isPending || maxAvailable < 1}>
            {isPending ? 'Venent...' : 'Vendre'}
          </ActionButton>
        </ModalActions>
      </ModalBox>
    </ModalOverlay>
  );
};

// ---------------------------------------------------------------------------

interface MoveModalProps {
  flavor: DashboardFlavor;
  onClose: () => void;
  onConfirm: (flavorId: string, containerType: 'large' | 'small', count: number, from: 'warehouse' | 'paradeta', to: 'warehouse' | 'paradeta') => void;
  isPending: boolean;
}

const MoveContainersModal: React.FC<MoveModalProps> = ({
  flavor,
  onClose,
  onConfirm,
  isPending,
}) => {
  const [containerType, setContainerType] = useState<'large' | 'small'>('large');
  const [from, setFrom] = useState<'warehouse' | 'paradeta'>('warehouse');
  const [count, setCount] = useState(1);

  const to = from === 'warehouse' ? 'paradeta' : 'warehouse';
  const maxAvailable =
    containerType === 'large'
      ? from === 'warehouse'
        ? flavor.largeWarehouseContainers
        : flavor.largeParadetaContainers
      : from === 'warehouse'
        ? flavor.smallWarehouseCount
        : flavor.smallParadetaCount;

  const handleSubmit = () => {
    if (count <= 0 || count > maxAvailable) return;
    onConfirm(flavor._id, containerType, count, from, to);
  };

  const fromLabel = from === 'warehouse' ? 'Magatzem' : 'Paradeta';
  const toLabel = to === 'warehouse' ? 'Magatzem' : 'Paradeta';

  return (
    <ModalOverlay onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <ModalTitle>Moure envasos — {flavor.name}</ModalTitle>

        <FieldGroup>
          <FieldLabel>Tipus d'envàs</FieldLabel>
          <FieldSelect
            value={containerType}
            onChange={(e) => setContainerType(e.target.value as 'large' | 'small')}
          >
            <option value="small">Petit (1L)</option>
            <option value="large">Gran</option>
          </FieldSelect>
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>De</FieldLabel>
          <FieldSelect
            value={from}
            onChange={(e) => setFrom(e.target.value as 'warehouse' | 'paradeta')}
          >
            <option value="warehouse">Magatzem ({maxAvailable} disponibles)</option>
            <option value="paradeta">Paradeta ({maxAvailable} disponibles)</option>
          </FieldSelect>
        </FieldGroup>

        <FieldGroup>
          <FieldLabel>Quantitat</FieldLabel>
          <FieldInput
            type="number"
            min={1}
            max={maxAvailable}
            step={1}
            value={count}
            onChange={(e) => setCount(Math.min(parseInt(e.target.value) || 1, maxAvailable))}
          />
        </FieldGroup>

        <div style={{fontSize:'var(--font-size-sm)',color:'var(--text-color-light)',marginBottom:'var(--space-md)'}}>
          Moure <strong>{count}</strong> envàs(sos) {containerType === 'large' ? 'gran(s)' : 'petit(s)'} de <strong>{fromLabel}</strong> a <strong>{toLabel}</strong>
        </div>

        <ModalActions>
          <SecondaryButton onClick={onClose} disabled={isPending}>
            Cancel·lar
          </SecondaryButton>
          <ActionButton onClick={handleSubmit} disabled={isPending || count <= 0 || count > maxAvailable}>
            {isPending ? 'Movent...' : 'Moure'}
          </ActionButton>
        </ModalActions>
      </ModalBox>
    </ModalOverlay>
  );
};

// ---------------------------------------------------------------------------
// Edit Stock Modal (direct quantity editing)
// ---------------------------------------------------------------------------

interface EditStockModalProps {
  flavor: DashboardFlavor;
  onClose: () => void;
  onConfirm: (flavorId: string, dto: SetFlavorStockDto) => void;
  isPending: boolean;
}

const EditStockModal: React.FC<EditStockModalProps> = ({
  flavor,
  onClose,
  onConfirm,
  isPending,
}) => {
  // Use string state so users can clear and retype values in number inputs
  const [largeWH, setLargeWH] = useState(() => String(flavor.largeWarehouseContainers));
  const [largeWHL, setLargeWHL] = useState(() => String(flavor.largeWarehouseLiters));
  const [largePar, setLargePar] = useState(() => String(flavor.largeParadetaContainers));
  const [largeParL, setLargeParL] = useState(() => String(flavor.largeParadetaLiters));
  const [smallWH, setSmallWH] = useState(() => String(flavor.smallWarehouseCount));
  const [smallPar, setSmallPar] = useState(() => String(flavor.smallParadetaCount));

  const parseNum = (s: string): number => {
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  const handleSubmit = () => {
    onConfirm(flavor._id, {
      largeWarehouseContainers: parseNum(largeWH),
      largeWarehouseLiters: parseNum(largeWHL),
      largeParadetaContainers: parseNum(largePar),
      largeParadetaLiters: parseNum(largeParL),
      smallWarehouseCount: parseNum(smallWH),
      smallParadetaCount: parseNum(smallPar),
    });
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <ModalTitle>Editar estoc directe — {flavor.name}</ModalTitle>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-color-light)', marginBottom: 'var(--space-md)' }}>
          Edita els valors dels envasos directament. El mix es gestiona des de la recepta.
        </p>

        <FieldGroup>
          <FieldLabel>📍 Magatzem — Envasos grans (comptador)</FieldLabel>
          <FieldInput type="number" min={0} step={1} value={largeWH} onChange={(e) => setLargeWH(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>📍 Magatzem — Envasos grans (litres)</FieldLabel>
          <FieldInput type="number" min={0} step={0.1} value={largeWHL} onChange={(e) => setLargeWHL(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>🏪 Paradeta — Envasos grans (comptador)</FieldLabel>
          <FieldInput type="number" min={0} step={1} value={largePar} onChange={(e) => setLargePar(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>🏪 Paradeta — Envasos grans (litres)</FieldLabel>
          <FieldInput type="number" min={0} step={0.1} value={largeParL} onChange={(e) => setLargeParL(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>📍 Magatzem — Envasos petits (comptador)</FieldLabel>
          <FieldInput type="number" min={0} step={1} value={smallWH} onChange={(e) => setSmallWH(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel>🏪 Paradeta — Envasos petits (comptador)</FieldLabel>
          <FieldInput type="number" min={0} step={1} value={smallPar} onChange={(e) => setSmallPar(e.target.value)} />
        </FieldGroup>

        <ModalActions>
          <SecondaryButton onClick={onClose} disabled={isPending}>
            Cancel·lar
          </SecondaryButton>
          <ActionButton onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Desant...' : 'Desar valors'}
          </ActionButton>
        </ModalActions>
      </ModalBox>
    </ModalOverlay>
  );
};

// ---------------------------------------------------------------------------
// Reset confirmation modal (reusable inline)
// ---------------------------------------------------------------------------

interface ResetConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isPending,
}) => {
  if (!isOpen) return null;
  return (
    <ModalOverlay onClick={onCancel}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <ModalTitle>{title}</ModalTitle>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-color)' }}>{message}</p>
        <ModalActions>
          <SecondaryButton onClick={onCancel} disabled={isPending}>
            Cancel·lar
          </SecondaryButton>
          <DangerButton
            style={{ padding: 'var(--space-sm) var(--space-md)', fontSize: 'var(--font-size-sm)' }}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Restablint...' : 'Sí, restablir'}
          </DangerButton>
        </ModalActions>
      </ModalBox>
    </ModalOverlay>
  );
};

// ---------------------------------------------------------------------------
// Summary & Overview styled components
// ---------------------------------------------------------------------------

const SummaryCardsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-md);
  margin-bottom: var(--space-md);
`;

const SummaryCard = styled.div<{ variant?: 'info' | 'success' | 'warning' | 'danger' }>`
  background: ${({ variant }) =>
    variant === 'danger' ? 'var(--danger-color-light, #f8d7da)'
    : variant === 'warning' ? '#fff3cd'
    : variant === 'success' ? 'var(--primary-color-light, #d4edda)'
    : 'var(--surface-color)'};
  border: var(--border-width) solid
    ${({ variant }) =>
      variant === 'danger' ? 'var(--danger-color)'
      : variant === 'warning' ? '#f0ad4e'
      : variant === 'success' ? 'var(--primary-color)'
      : 'var(--border-color)'};
  border-radius: var(--border-radius-lg);
  padding: var(--space-md) var(--space-lg);
  text-align: center;
  box-shadow: var(--shadow-sm);
`;

const SummaryValue = styled.div`
  font-size: var(--font-size-2xl, 1.75rem);
  font-weight: 800;
  line-height: 1.1;
  color: var(--text-color-strong);
`;

const SummaryLabel = styled.div`
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
  margin-top: 4px;
  white-space: nowrap;
`;

const LocationSummaryRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const LocationSummaryBox = styled.div`
  background: var(--surface-color);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: var(--space-md) var(--space-lg);
  box-shadow: var(--shadow-sm);
`;

const LocationSummaryTitle = styled.div`
  font-weight: 600;
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-sm);
`;

const LocationSummaryDetail = styled.div`
  font-size: var(--font-size-sm);
  color: var(--text-color);
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
`;

const ViewToggleButton = styled.button`
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width) solid var(--primary-color);
  border-radius: var(--border-radius-lg);
  background: transparent;
  color: var(--primary-color);
  font-size: var(--font-size-sm);
  cursor: pointer;
  white-space: nowrap;
  min-height: 44px;
  font-weight: 500;
  &:hover {
    background: var(--primary-color);
    color: var(--text-on-primary);
  }
`;

// ── Overview table ─────────────────────────────────────────────────

const OverviewTableWrapper = styled.div`
  overflow-x: auto;
  margin-bottom: var(--space-lg);
`;

const OverviewTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--font-size-sm);
  background: var(--surface-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
`;

const TableHead = styled.thead`
  th {
    background: var(--surface-color-light, #f5f5f5);
    padding: var(--space-sm) var(--space-md);
    text-align: left;
    font-weight: 600;
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-color-light);
    border-bottom: 2px solid var(--border-color);
    white-space: nowrap;
    user-select: none;
  }
`;

const SortableTh = styled.th<{ active?: boolean }>`
  cursor: pointer;
  &:hover {
    background: var(--surface-color);
    color: var(--text-color-strong);
  }
  ${({ active }) => active ? `color: var(--primary-color, #007bff) !important;` : ''}
`;

const TableRow = styled.tr<{ alertLevel?: 'critical' | 'low' | 'normal' }>`
  background: ${({ alertLevel }) =>
    alertLevel === 'critical' ? 'var(--danger-color-light, #fff0f0)'
    : alertLevel === 'low' ? '#fffff0'
    : 'transparent'};
  &:nth-child(even) {
    background: ${({ alertLevel }) =>
      alertLevel === 'critical' ? 'var(--danger-color-light, #fff0f0)'
      : alertLevel === 'low' ? '#fffff0'
      : 'var(--surface-color-light, #fafafa)'};
  }
  &:hover {
    filter: brightness(0.97);
  }
  td {
    padding: var(--space-sm) var(--space-md);
    border-bottom: var(--border-width) solid var(--border-color-light);
    vertical-align: middle;
  }
`;

const TableFlavorName = styled.span`
  font-weight: 600;
  color: var(--text-color-strong);
`;

const TableStat = styled.span<{ highlight?: 'critical' | 'low' | 'ok' }>`
  font-weight: 600;
  color: ${({ highlight }) =>
    highlight === 'critical' ? 'var(--danger-color)'
    : highlight === 'low' ? '#856404'
    : highlight === 'ok' ? 'var(--primary-color-dark, #155724)'
    : 'var(--text-color)'};
`;

const TableAlert = styled.span<{ level: 'critical' | 'low' | 'none' }>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ level }) =>
    level === 'critical' ? 'var(--danger-color)'
    : level === 'low' ? '#f0ad4e'
    : '#28a745'};
`;

const CompactActionBtn = styled.button`
  padding: 2px 6px;
  border: none;
  border-radius: var(--border-radius);
  background: transparent;
  color: var(--text-color-light);
  font-size: var(--font-size-sm);
  cursor: pointer;
  &:hover { background: var(--surface-color-light); color: var(--text-color); }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

// ---------------------------------------------------------------------------
// Advanced collapsible section (resets etc)
// ---------------------------------------------------------------------------

const AdvancedSection = styled.div`
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-color-light);
`;

const AdvancedToggle = styled.button`
  background: none;
  border: none;
  color: var(--text-color-light);
  font-size: var(--font-size-sm);
  cursor: pointer;
  text-decoration: underline;
  &:hover { color: var(--text-color); }
`;

const ResetGroup = styled.div`
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  margin-top: var(--space-sm);
`;

// ---------------------------------------------------------------------------
// Main dashboard component
// ---------------------------------------------------------------------------

interface IceCreamDashboardTabProps {
  onOpenFlavorEdit: (flavorName: string, flavorId?: string, sourceRecipeId?: string, sourceRecipeName?: string) => void;
  onOpenRecipeTab?: (recipeId: string, recipeName: string) => void;
}

export const IceCreamDashboardTab: React.FC<IceCreamDashboardTabProps> = ({
  onOpenFlavorEdit,
  onOpenRecipeTab,
}) => {
  const queryClient = useQueryClient();

  // Fetch dashboard data
  const {
    data: flavors,
    isLoading,
    isError,
    error,
  } = useQuery<DashboardFlavor[], Error>({
    queryKey: ['iceCreamDashboard'],
    queryFn: fetchDashboard,
  });

  // Mutations
  const convertMutation = useMutation({
    mutationFn: ({
      flavorId,
      dto,
    }: {
      flavorId: string;
      dto: ConvertMixDto;
    }) => convertMixToFrozen(flavorId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iceCreamDashboard'] });
      setConvertFlavor(null);
    },
  });

  const sellMutation = useMutation({
    mutationFn: ({
      flavorId,
      containerType,
      location,
    }: {
      flavorId: string;
      containerType: 'large' | 'small';
      location: 'warehouse' | 'paradeta';
    }) => sellContainer(flavorId, { containerType, location }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iceCreamDashboard'] });
      setSellFlavor(null);
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({
      flavorId,
      containerType,
      count,
      from,
      to,
    }: {
      flavorId: string;
      containerType: 'large' | 'small';
      count: number;
      from: 'warehouse' | 'paradeta';
      to: 'warehouse' | 'paradeta';
    }) => moveContainers(flavorId, { containerType, count, from, to }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iceCreamDashboard'] });
      setMoveFlavor(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (flavorId: string) => deleteFlavor(flavorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iceCreamDashboard'] });
    },
  });

  // ── New: Edit stock mutation ─────────────────────────────────────────
  const editStockMutation = useMutation({
    mutationFn: ({
      flavorId,
      dto,
    }: {
      flavorId: string;
      dto: SetFlavorStockDto;
    }) => setFlavorStock(flavorId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iceCreamDashboard'] });
      setEditStockFlavor(null);
    },
  });

  // ── New: Reset mutations ─────────────────────────────────────────────
  const resetMixMutation = useMutation({
    mutationFn: () => resetAllMix(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iceCreamDashboard'] });
      setResetModal(null);
    },
  });

  const resetContainersMutation = useMutation({
    mutationFn: () => resetAllContainers(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iceCreamDashboard'] });
      setResetModal(null);
    },
  });

  const resetAllMutation = useMutation({
    mutationFn: () => resetAllFlavors(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iceCreamDashboard'] });
      setResetModal(null);
    },
  });

  // Modal state
  const [convertFlavor, setConvertFlavor] = useState<DashboardFlavor | null>(null);
  const [sellFlavor, setSellFlavor] = useState<DashboardFlavor | null>(null);
  const [moveFlavor, setMoveFlavor] = useState<DashboardFlavor | null>(null);
  const [editStockFlavor, setEditStockFlavor] = useState<DashboardFlavor | null>(null);

  // View mode: detail (cards) or overview (compact table)
  const [viewMode, setViewMode] = useState<'detail' | 'overview'>('detail');

  // Container type filter
  const [containerFilter, setContainerFilter] = useState<'all' | 'large' | 'small'>('all');

  // Show/hide advanced (reset) actions
  const [showAdvancedResets, setShowAdvancedResets] = useState(false);

  // Overview table click-to-sort state
  const [tableSort, setTableSort] = useState<{ col: string; dir: 'asc' | 'desc' }>({ col: 'name', dir: 'asc' });

  const handleTableSort = (col: string) => {
    setTableSort(prev => ({
      col,
      dir: prev.col === col ? (prev.dir === 'asc' ? 'desc' : 'asc') : 'asc',
    }));
  };

  // Reset confirmation modal state: { title, message, onConfirm } | null
  const [resetModal, setResetModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    isPending: boolean;
  } | null>(null);

  // ── Search & sort state ──────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  // ── Client-side pagination state ────────────────────────────────────
  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  // Derive typed flavors (always before guards so hooks are consistent)
  const typedFlavors = flavors as DashboardFlavor[] | undefined;

  // ── Summary statistics (computed from all flavors) ────────────────────
  const summaryData = useMemo(() => {
    const list = typedFlavors || [];
    const totalMix = list.reduce((s, f) => s + f.iceCreamMixKg, 0);
    const totalFrozen = list.reduce((s, f) => s + f.totalFrozenLiters, 0);
    const totalLarge = list.reduce((s, f) => s + f.totalLargeContainers, 0);
    const totalSmall = list.reduce((s, f) => s + f.totalSmallCount, 0);
    const criticalAlerts = list.filter((f) => f.alerts.overallLow).length;
    const warningAlerts = list.filter((f) => !f.alerts.overallLow && f.alerts.paradetaLow).length;
    const totalWarehouseL = list.reduce((s, f) => s + f.warehouseTotalLiters, 0);
    const totalParadetaL = list.reduce((s, f) => s + f.paradetaTotalLiters, 0);
    return {
      totalMix,
      totalFrozen,
      totalFlavors: list.length,
      totalLarge,
      totalSmall,
      criticalAlerts,
      warningAlerts,
      totalWarehouseL,
      totalParadetaL,
    };
  }, [typedFlavors]);

  // ── Filter & sort flavors ────────────────────────────────────────────
  const filteredAndSortedFlavors = useMemo(() => {
    const list = typedFlavors || [];

    // Filter by debounced search term
    const filtered = debouncedSearchTerm
      ? list.filter((f) =>
          normalizeText(f.name).toLowerCase().includes(normalizeText(debouncedSearchTerm).toLowerCase())
        )
      : list;

    // Sort
    return [...filtered].sort((a, b) => {
      // Overview table: click-to-sort overrides the dropdown
      if (viewMode === 'overview') {
        const { col, dir } = tableSort;
        const mul = dir === 'asc' ? 1 : -1;
        switch (col) {
          case 'name': {
            // Essentials first in asc mode
            if (dir === 'asc') {
              const aEss = a.essentialLarge || a.essentialSmall;
              const bEss = b.essentialLarge || b.essentialSmall;
              if (aEss && !bEss) return -1;
              if (!aEss && bEss) return 1;
            }
            return mul * a.name.localeCompare(b.name, 'ca');
          }
          case 'mix':
            return mul * (a.iceCreamMixKg - b.iceCreamMixKg);
          case 'frozen':
            return mul * (a.totalFrozenLiters - b.totalFrozenLiters);
          case 'large':
            return mul * (a.totalLargeContainers - b.totalLargeContainers);
          case 'small':
            return mul * (a.totalSmallCount - b.totalSmallCount);
          case 'warehouse':
            return mul * (a.largeWarehouseLiters - b.largeWarehouseLiters);
          case 'paradeta':
            return mul * (a.largeParadetaLiters - b.largeParadetaLiters);
          default:
            return 0;
        }
      }

    });
  }, [typedFlavors, debouncedSearchTerm, viewMode, tableSort]);

  // ── Pagination derived values ─────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil((filteredAndSortedFlavors?.length || 0) / PAGE_SIZE));

  // Reset to last page if current page exceeds total after a deletion (via effect to avoid re-render loop)
  useEffect(() => {
    if (filteredAndSortedFlavors && currentPage > Math.ceil(filteredAndSortedFlavors.length / PAGE_SIZE)) {
      setCurrentPage(Math.max(1, Math.ceil(filteredAndSortedFlavors.length / PAGE_SIZE)));
    }
  }, [filteredAndSortedFlavors, currentPage, PAGE_SIZE]);

  const paginatedFlavors = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedFlavors.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedFlavors, currentPage]);

  // Determine overall alert level for a card
  const getAlertLevel = (f: DashboardFlavor): 'critical' | 'low' | undefined => {
    if (!f.essentialLarge && !f.essentialSmall) return undefined;
    if (f.alerts.overallLow) return 'critical';
    if (f.alerts.paradetaLow) return 'low';
    return undefined;
  };

  const isAnyResetPending =
    resetMixMutation.isPending ||
    resetContainersMutation.isPending ||
    resetAllMutation.isPending;

  if (isLoading) return <Container><LoadingMessage>Carregant dashboard...</LoadingMessage></Container>;
  if (isError) return <Container><ErrorMessage>Error: {error?.message}</ErrorMessage></Container>;

  return (
    <Container>
      <HeaderRow>
        <PageTitle>🍦 Estoc de Gelats</PageTitle>
      </HeaderRow>

      {/* ── Summary cards ──────────────────────────────────────────── */}
      {typedFlavors && typedFlavors.length > 0 && (
        <>
          <SummaryCardsRow>
            <SummaryCard variant="info">
              <SummaryValue>{summaryData.totalMix.toFixed(1)}</SummaryValue>
              <SummaryLabel>🧊 Mix total (kg)</SummaryLabel>
            </SummaryCard>
            <SummaryCard variant="info">
              <SummaryValue>{summaryData.totalFrozen.toFixed(1)}</SummaryValue>
              <SummaryLabel>❄️ Frozen total (L)</SummaryLabel>
            </SummaryCard>
            <SummaryCard variant="info">
              <SummaryValue>{summaryData.totalFlavors}</SummaryValue>
              <SummaryLabel>🍦 Gustos</SummaryLabel>
            </SummaryCard>
            <SummaryCard
              variant={
                summaryData.criticalAlerts > 0
                  ? 'danger'
                  : summaryData.warningAlerts > 0
                    ? 'warning'
                    : 'success'
              }
            >
              <SummaryValue>
                {summaryData.criticalAlerts > 0
                  ? `🔴 ${summaryData.criticalAlerts}`
                  : summaryData.warningAlerts > 0
                    ? `🟡 ${summaryData.warningAlerts}`
                    : '✅ 0'}
              </SummaryValue>
              <SummaryLabel>Alertes</SummaryLabel>
            </SummaryCard>
            <SummaryCard
              variant={containerFilter === 'large' ? 'success' : 'info'}
              onClick={() => setContainerFilter(prev => prev === 'large' ? 'all' : 'large')}
              style={{ cursor: 'pointer' }}
            >
              <SummaryValue>{summaryData.totalLarge}</SummaryValue>
              <SummaryLabel>📦 Envasos grans</SummaryLabel>
              {containerFilter === 'large' && (
                <SummaryLabel style={{ fontSize: '10px', color: 'var(--primary-color)' }}>
                  ▼ Filtrant
                </SummaryLabel>
              )}
            </SummaryCard>
            <SummaryCard
              variant={containerFilter === 'small' ? 'success' : 'info'}
              onClick={() => setContainerFilter(prev => prev === 'small' ? 'all' : 'small')}
              style={{ cursor: 'pointer' }}
            >
              <SummaryValue>{summaryData.totalSmall}</SummaryValue>
              <SummaryLabel>🥫 Envasos petits</SummaryLabel>
              {containerFilter === 'small' && (
                <SummaryLabel style={{ fontSize: '10px', color: 'var(--primary-color)' }}>
                  ▼ Filtrant
                </SummaryLabel>
              )}
            </SummaryCard>
          </SummaryCardsRow>

          <LocationSummaryRow>
            <LocationSummaryBox>
              <LocationSummaryTitle>📍 Magatzem</LocationSummaryTitle>
              <LocationSummaryDetail>
                {containerFilter !== 'small' && (
                  <span>Grans: <strong>{summaryData.totalWarehouseL.toFixed(1)} L</strong></span>
                )}
                {containerFilter !== 'large' && (
                  <span>Petits: <strong>{typedFlavors.reduce((s, f) => s + f.smallWarehouseCount, 0)}</strong></span>
                )}
              </LocationSummaryDetail>
            </LocationSummaryBox>
            <LocationSummaryBox>
              <LocationSummaryTitle>🏪 Paradeta</LocationSummaryTitle>
              <LocationSummaryDetail>
                {containerFilter !== 'small' && (
                  <span>Grans: <strong>{summaryData.totalParadetaL.toFixed(1)} L</strong></span>
                )}
                {containerFilter !== 'large' && (
                  <span>Petits: <strong>{typedFlavors.reduce((s, f) => s + f.smallParadetaCount, 0)}</strong></span>
                )}
              </LocationSummaryDetail>
            </LocationSummaryBox>
          </LocationSummaryRow>
        </>
      )}

      {/* ── Search & sort controls ───────────────────────────────────── */}
      {(typedFlavors && typedFlavors.length > 0) && (
        <SearchSortRow>
          <SearchInput
            type="search"
            placeholder="Cerca gustos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Cerca gustos"
          />

          <ViewToggleButton onClick={() => setViewMode(v => (v === 'detail' ? 'overview' : 'detail'))}>
            {viewMode === 'detail' ? '👁️ Visió general' : '📋 Detall'}
          </ViewToggleButton>
        </SearchSortRow>
      )}

      {(!typedFlavors || typedFlavors.length === 0) ? (
        <EmptyMessage>
          No hi ha gustos de gelat definits. Creeu el primer gust!
        </EmptyMessage>
      ) : filteredAndSortedFlavors.length === 0 ? (
        <EmptyMessage>
          {`No s'han trobat gustos que coincideixin amb "${debouncedSearchTerm}".`}
        </EmptyMessage>
      ) : viewMode === 'overview' ? (
        <OverviewTableWrapper>
          <OverviewTable>
            <TableHead>
              <tr>
                <SortableTh active={tableSort.col === 'name'} onClick={() => handleTableSort('name')}>
                  Gust {tableSort.col === 'name' ? (tableSort.dir === 'asc' ? '▲' : '▼') : ''}
                </SortableTh>
                <SortableTh active={tableSort.col === 'mix'} onClick={() => handleTableSort('mix')}>
                  🧊 Mix {tableSort.col === 'mix' ? (tableSort.dir === 'asc' ? '▲' : '▼') : ''}
                </SortableTh>
                <SortableTh active={tableSort.col === 'frozen'} onClick={() => handleTableSort('frozen')}>
                  ❄️ Frozen {tableSort.col === 'frozen' ? (tableSort.dir === 'asc' ? '▲' : '▼') : ''}
                </SortableTh>
                {containerFilter !== 'small' && (
                  <SortableTh active={tableSort.col === 'large'} onClick={() => handleTableSort('large')}>
                    📦 Grans {tableSort.col === 'large' ? (tableSort.dir === 'asc' ? '▲' : '▼') : ''}
                  </SortableTh>
                )}
                {containerFilter !== 'large' && (
                  <SortableTh active={tableSort.col === 'small'} onClick={() => handleTableSort('small')}>
                    🥫 Petits {tableSort.col === 'small' ? (tableSort.dir === 'asc' ? '▲' : '▼') : ''}
                  </SortableTh>
                )}
                <SortableTh active={tableSort.col === 'warehouse'} onClick={() => handleTableSort('warehouse')}>
                  📍 Magatzem {tableSort.col === 'warehouse' ? (tableSort.dir === 'asc' ? '▲' : '▼') : ''}
                </SortableTh>
                <SortableTh active={tableSort.col === 'paradeta'} onClick={() => handleTableSort('paradeta')}>
                  🏪 Paradeta {tableSort.col === 'paradeta' ? (tableSort.dir === 'asc' ? '▲' : '▼') : ''}
                </SortableTh>
                <th>⚠️</th>
                <th></th>
              </tr>
            </TableHead>
            <tbody>
              {filteredAndSortedFlavors.map((f) => {
                const alertLevel = getAlertLevel(f);
                return (
                  <TableRow key={f._id} alertLevel={alertLevel}>
                    <td>
                      <TableFlavorName>
                        {(f.essentialLarge || f.essentialSmall) && '⭐ '}
                        {f.name}
                      </TableFlavorName>
                    </td>
                    <td>
                      <TableStat highlight={f.iceCreamMixKg <= 0 ? 'critical' : 'ok'}>
                        {f.iceCreamMixKg.toFixed(1)}
                      </TableStat>
                    </td>
                    <td>
                      <TableStat highlight={f.totalFrozenLiters <= 0 ? 'critical' : undefined}>
                        {f.totalFrozenLiters.toFixed(1)}
                      </TableStat>
                    </td>
                    {containerFilter !== 'small' && <td>{f.totalLargeContainers}</td>}
                    {containerFilter !== 'large' && <td>{f.totalSmallCount}</td>}
                    <td>
                      {containerFilter !== 'small' && (
                        <div>{f.largeWarehouseContainers} grans ({f.largeWarehouseLiters.toFixed(1)} L)</div>
                      )}
                      {containerFilter !== 'large' && (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)' }}>
                          {f.smallWarehouseCount} petits
                        </div>
                      )}
                    </td>
                    <td>
                      {containerFilter !== 'small' && (
                        <div>{f.largeParadetaContainers} grans ({f.largeParadetaLiters.toFixed(1)} L)</div>
                      )}
                      {containerFilter !== 'large' && (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)' }}>
                          {f.smallParadetaCount} petits
                        </div>
                      )}
                    </td>
                    <td>
                      <TableAlert
                        level={alertLevel === 'critical' ? 'critical' : alertLevel === 'low' ? 'low' : 'none'}
                        title={
                          alertLevel === 'critical'
                            ? 'Estoc crític'
                            : alertLevel === 'low'
                              ? 'Paradeta baixa'
                              : 'Correcte'
                        }
                      />
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <CompactActionBtn
                        onClick={() => setConvertFlavor(f)}
                        disabled={f.iceCreamMixKg <= 0}
                        title="Convertir mix"
                      >
                        🧊
                      </CompactActionBtn>
                      <CompactActionBtn
                        onClick={() => setSellFlavor(f)}
                        disabled={f.totalFrozenLiters <= 0}
                        title="Vendre envàs"
                      >
                        💰
                      </CompactActionBtn>
                      <CompactActionBtn
                        onClick={() => setMoveFlavor(f)}
                        disabled={f.totalFrozenLiters <= 0}
                        title="Moure envasos"
                      >
                        📦
                      </CompactActionBtn>
                    </td>
                  </TableRow>
                );
              })}
            </tbody>
          </OverviewTable>
        </OverviewTableWrapper>
      ) : (
        paginatedFlavors.map((f) => {
          const alertLevel = getAlertLevel(f);
          return (
            <Card key={f._id} alertLevel={alertLevel}>
              <CardHeader>
                <div>
                  <FlavorName>{f.name}</FlavorName>
                  {f.sourceRecipeId && onOpenRecipeTab && (
                    <SmallButton
                      onClick={() =>
                        onOpenRecipeTab(f.sourceRecipeId!, f.sourceRecipeName || f.name)
                      }
                      title="Obrir recepta vinculada"
                      style={{ marginTop: 4 }}
                    >
                      📖 {f.sourceRecipeName || 'Veure recepta'}
                    </SmallButton>
                  )}
                </div>
                <BadgeGroup>
                  {f.essentialLarge && <Badge variant="essential">Essencial GRAN</Badge>}
                  {f.essentialSmall && <Badge variant="essential">Essencial PETIT</Badge>}
                  {alertLevel === 'critical' && <Badge variant="danger">URGENT: Estoc baix</Badge>}
                  {alertLevel === 'low' && <Badge variant="warning">Paradeta baixa</Badge>}
                  {f.overrunPercent > 0 && (
                    <Badge variant="info">Overrun: {f.overrunPercent.toFixed(1)}%</Badge>
                  )}
                </BadgeGroup>
              </CardHeader>

              {/* Main stats */}
              <StatsGrid>
                <StatBox>
                  <StatValue>{f.iceCreamMixKg.toFixed(2)} kg</StatValue>
                  <StatLabel>Mix disponible</StatLabel>
                </StatBox>
                <StatBox>
                  <StatValue>{f.totalFrozenLiters.toFixed(1)} L</StatValue>
                  <StatLabel>Total congelat</StatLabel>
                </StatBox>
                {containerFilter !== 'small' && (
                  <StatBox>
                    <StatValue>{f.totalLargeContainers}</StatValue>
                    <StatLabel>Envasos grans</StatLabel>
                  </StatBox>
                )}
                {containerFilter !== 'large' && (
                  <StatBox>
                    <StatValue>{f.totalSmallCount}</StatValue>
                    <StatLabel>Envasos petits</StatLabel>
                  </StatBox>
                )}
              </StatsGrid>

              {/* Location breakdown */}
              <LocationRow>
                <LocationBlock>
                  <LocationLabel>📍 Magatzem</LocationLabel>
                  {containerFilter !== 'small' && (
                    <LocationDetail>
                      Grans: {f.largeWarehouseContainers} ({f.largeWarehouseLiters.toFixed(1)} L)
                    </LocationDetail>
                  )}
                  {containerFilter !== 'large' && (
                    <LocationDetail>
                      Petits: {f.smallWarehouseCount}
                    </LocationDetail>
                  )}
                </LocationBlock>
                <LocationBlock>
                  <LocationLabel>🏪 Paradeta</LocationLabel>
                  {containerFilter !== 'small' && (
                    <LocationDetail>
                      Grans: {f.largeParadetaContainers} ({f.largeParadetaLiters.toFixed(1)} L)
                    </LocationDetail>
                  )}
                  {containerFilter !== 'large' && (
                    <LocationDetail>
                      Petits: {f.smallParadetaCount}
                    </LocationDetail>
                  )}
                </LocationBlock>
              </LocationRow>

              {/* Actions */}
              <ActionRow>
                <SmallButton
                  onClick={() => setEditStockFlavor(f)}
                  title="Editar estoc directament"
                >
                  📝 Edit stock
                </SmallButton>
                <SmallButton
                  onClick={() => setConvertFlavor(f)}
                  disabled={f.iceCreamMixKg <= 0}
                  title={
                    f.iceCreamMixKg <= 0
                      ? 'No hi ha mix disponible per convertir'
                      : 'Convertir mix en gelat congelat'
                  }
                >
                  🧊 Convertir mix
                </SmallButton>
                <SmallButton
                  onClick={() => setSellFlavor(f)}
                  disabled={f.totalFrozenLiters <= 0}
                  title="Vendre un envàs"
                >
                  💰 Vendre envàs
                </SmallButton>
                <SmallButton
                  onClick={() => setMoveFlavor(f)}
                  disabled={f.totalFrozenLiters <= 0}
                  title="Moure envasos entre ubicacions"
                >
                  📦 Moure envasos
                </SmallButton>
                <SmallButton onClick={() => onOpenFlavorEdit(f.name, f._id)}>
                  ✏️ Editar
                </SmallButton>
                {f.sourceRecipeId && (
                  <SmallButton
                    onClick={() =>
                      onOpenFlavorEdit(
                        'Nova variant',
                        undefined,
                        f.sourceRecipeId,
                        f.sourceRecipeName || f.name,
                      )
                    }
                    title="Crear una variant d'aquest gust amb mix-ins"
                  >
                    ➕ Nova Variant
                  </SmallButton>
                )}
                <DangerButton
                  onClick={() => {
                    if (window.confirm(`Eliminar el gust "${f.name}"?`)) {
                      deleteMutation.mutate(f._id);
                    }
                  }}
                >
                  🗑️ Eliminar
                </DangerButton>
              </ActionRow>
              <HistorySection flavorId={f._id} />
            </Card>
          );
        })
      )}

      {viewMode === 'detail' && totalPages > 1 && filteredAndSortedFlavors && filteredAndSortedFlavors.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
          isLoading={isLoading}
        />
      )}

      {/* ── Advanced actions (collapsible) ────────────────────────── */}
      <AdvancedSection>
        <AdvancedToggle onClick={() => setShowAdvancedResets(s => !s)}>
          {showAdvancedResets ? '▼ ' : '▶ '}Accions avançades de restabliment
        </AdvancedToggle>
        {showAdvancedResets && (
          <ResetGroup>
            <SecondaryButton
              onClick={() =>
                setResetModal({
                  title: 'Restablir mix a 0',
                  message:
                    'Això posarà iceCreamMixKg a 0 per a TOTS els gustos. Esteu segurs?',
                  onConfirm: () => resetMixMutation.mutate(),
                  isPending: resetMixMutation.isPending,
                })
              }
              disabled={isAnyResetPending}
              title="Restablir tot el mix a 0"
            >
              🔄 Restablir Mix
            </SecondaryButton>
            <SecondaryButton
              onClick={() =>
                setResetModal({
                  title: 'Restablir envasos a 0',
                  message:
                    'Això posarà TOTS els envasos (grans, petits, magatzem, paradeta) a 0 per a TOTS els gustos. Esteu segurs?',
                  onConfirm: () => resetContainersMutation.mutate(),
                  isPending: resetContainersMutation.isPending,
                })
              }
              disabled={isAnyResetPending}
              title="Restablir tots els envasos a 0"
            >
              🔄 Restablir Envasos
            </SecondaryButton>
            <DangerButton
              style={{ padding: 'var(--space-sm) var(--space-md)', fontSize: 'var(--font-size-sm)' }}
              onClick={() =>
                setResetModal({
                  title: '⚠️ Restablir TOT a 0',
                  message:
                    'Això posarà mix + envasos + històric de overrun a 0 per a TOTS els gustos. Aquesta acció no es pot desfer. Esteu absolutament segurs?',
                  onConfirm: () => resetAllMutation.mutate(),
                  isPending: resetAllMutation.isPending,
                })
              }
              disabled={isAnyResetPending}
              title="Restablir tot (mix + envasos + overrun) a 0"
            >
              ⚠️ Restablir TOT
            </DangerButton>
          </ResetGroup>
        )}
      </AdvancedSection>

      {/* Modals */}
      {convertFlavor && (
        <ConvertMixModal
          flavor={convertFlavor}
          onClose={() => setConvertFlavor(null)}
          onConfirm={(flavorId, dto) =>
            convertMutation.mutate({ flavorId, dto })
          }
          isPending={convertMutation.isPending}
        />
      )}

      {sellFlavor && (
        <SellContainerModal
          flavor={sellFlavor}
          onClose={() => setSellFlavor(null)}
          onConfirm={(flavorId, containerType, location) =>
            sellMutation.mutate({ flavorId, containerType, location })
          }
          isPending={sellMutation.isPending}
        />
      )}

      {moveFlavor && (
        <MoveContainersModal
          flavor={moveFlavor}
          onClose={() => setMoveFlavor(null)}
          onConfirm={(flavorId, containerType, count, from, to) =>
            moveMutation.mutate({ flavorId, containerType, count, from, to })
          }
          isPending={moveMutation.isPending}
        />
      )}

      {editStockFlavor && (
        <EditStockModal
          flavor={editStockFlavor}
          onClose={() => setEditStockFlavor(null)}
          onConfirm={(flavorId, dto) =>
            editStockMutation.mutate({ flavorId, dto })
          }
          isPending={editStockMutation.isPending}
        />
      )}

      <ResetConfirmModal
        isOpen={resetModal !== null}
        title={resetModal?.title || ''}
        message={resetModal?.message || ''}
        onConfirm={() => resetModal?.onConfirm()}
        onCancel={() => setResetModal(null)}
        isPending={resetModal?.isPending ?? false}
      />
    </Container>
  );
};
