import { useState } from 'react';
import { styled } from '@linaria/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEvents,
  updateEvent,
  deleteEvent,
  UpdateEventDto,
  IceCreamEventItem,
} from '../../api/iceCreamFlavors';

// ---------------------------------------------------------------------------
// Styled components
// ---------------------------------------------------------------------------

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: var(--surface-color);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  border-bottom: var(--border-width) solid var(--border-color);
`;

const Title = styled.h3`
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: var(--font-size-xl);
  cursor: pointer;
  color: var(--text-color-light);
  padding: 4px 8px;

  &:hover {
    color: var(--text-color);
  }
`;

const Body = styled.div`
  padding: var(--space-lg);
  overflow-y: auto;
  flex: 1;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);

  th, td {
    padding: var(--space-sm) var(--space-md);
    text-align: right;
    border-bottom: var(--border-width) solid var(--border-color-light);
    white-space: nowrap;
  }

  th {
    background: var(--surface-color-light);
    font-weight: 600;
    text-align: right;
  }

  th:first-child, td:first-child {
    text-align: left;
  }
`;

const ActionButton = styled.button`
  padding: 2px 8px;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-sm);
  background: var(--surface-color);
  color: var(--text-color);
  font-size: var(--font-size-xs);
  cursor: pointer;
  margin: 0 2px;

  &:hover {
    background: var(--primary-color);
    color: var(--text-on-primary);
  }
`;

const DeleteButton = styled(ActionButton)`
  color: var(--danger-color);
  &:hover {
    background: var(--danger-color);
    color: white;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: var(--space-xl);
  color: var(--text-color-light);
  font-style: italic;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: var(--space-xl);
  color: var(--text-color-light);
  font-style: italic;
`;

const InlineEdit = styled.input`
  width: 60px;
  padding: 1px 4px;
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  text-align: right;
  background: var(--surface-color);
  color: var(--text-color);
`;

const ButtonRow = styled.div`
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
  padding: var(--space-lg);
  border-top: var(--border-width) solid var(--border-color);
`;

const CancelButton = styled.button`
  padding: var(--space-sm) var(--space-lg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--surface-color);
  color: var(--text-color);
  cursor: pointer;
`;



// ---------------------------------------------------------------------------
// Edit inline row component
// ---------------------------------------------------------------------------

interface EditFormProps {
  event: IceCreamEventItem;
  onSave: (id: string, data: UpdateEventDto) => void;
  onCancel: () => void;
}

const EditForm = ({ event, onSave, onCancel }: EditFormProps) => {
  const [mixKg, setMixKg] = useState(event.mixKgConverted?.toString() ?? '');
  const [frozenL, setFrozenL] = useState(event.frozenLitersProduced?.toString() ?? '');
  const [large, setLarge] = useState(event.largeContainersAdded?.toString() ?? '');
  const [small, setSmall] = useState(event.smallContainersAdded?.toString() ?? '');

  const handleSave = () => {
    onSave(event._id, {
      mixKgConverted: parseFloat(mixKg) || 0,
      frozenLitersProduced: parseFloat(frozenL) || 0,
      largeContainersAdded: parseInt(large) || 0,
      smallContainersAdded: parseInt(small) || 0,
    });
  };

  return (
    <tr>
      <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)' }}>
        {new Date(event.timestamp).toLocaleString('ca-ES')}
      </td>
      <td><InlineEdit type="number" step="0.1" value={mixKg} onChange={e => setMixKg(e.target.value)} /></td>
      <td><InlineEdit type="number" step="0.1" value={frozenL} onChange={e => setFrozenL(e.target.value)} /></td>
      <td><InlineEdit type="number" value={large} onChange={e => setLarge(e.target.value)} style={{ width: 40 }} /></td>
      <td><InlineEdit type="number" value={small} onChange={e => setSmall(e.target.value)} style={{ width: 40 }} /></td>
      <td>—</td>
      <td>
        <ActionButton onClick={handleSave}>💾</ActionButton>
        <ActionButton onClick={onCancel}>✕</ActionButton>
      </td>
    </tr>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ConversionHistoryModalProps {
  flavorId: string;
  flavorName: string;
  recipeId?: string;
  onClose: () => void;
}

export const ConversionHistoryModal = ({
  flavorId,
  flavorName,
  recipeId: _recipeId,
  onClose,
}: ConversionHistoryModalProps) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const limit = 20;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['events', flavorId, 'conversion', page],
    queryFn: () =>
      fetchEvents({
        flavorId,
        type: 'conversion',
        limit,
        offset: page * limit,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ eventId, dto }: { eventId: string; dto: UpdateEventDto }) =>
      updateEvent(eventId, dto),
    onSuccess: () => {
      setEditingEventId(null);
      queryClient.invalidateQueries({ queryKey: ['events', flavorId, 'conversion'] });
      queryClient.invalidateQueries({ queryKey: ['flavorCosts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', flavorId, 'conversion'] });
      queryClient.invalidateQueries({ queryKey: ['flavorCosts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleSaveEdit = (eventId: string, dto: UpdateEventDto) => {
    updateMutation.mutate({ eventId, dto });
  };

  const handleDelete = (eventId: string) => {
    if (window.confirm('Eliminar aquesta conversió? Es reajustarà l\'estat de totes les conversions posteriors.')) {
      deleteMutation.mutate(eventId);
    }
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Title>Historial de conversions — {flavorName}</Title>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </Header>
        <Body>
          {isLoading && <LoadingMessage>Carregant...</LoadingMessage>}
          {isError && <LoadingMessage>Error en carregar l'historial.</LoadingMessage>}
          {data && data.events.length === 0 && (
            <EmptyMessage>No hi ha conversions registrades per aquest sabor.</EmptyMessage>
          )}
          {data && data.events.length > 0 && (
            <Table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Mix (kg)</th>
                  <th>Frozen (L)</th>
                  <th>Grans</th>
                  <th>Petits</th>
                  <th>Overrun</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.events.map((evt) =>
                  editingEventId === evt._id ? (
                    <EditForm
                      key={evt._id}
                      event={evt}
                      onSave={handleSaveEdit}
                      onCancel={() => setEditingEventId(null)}
                    />
                  ) : (
                    <tr key={evt._id}>
                      <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)' }}>
                        {new Date(evt.timestamp).toLocaleString('ca-ES')}
                      </td>
                      <td>{evt.mixKgConverted?.toFixed(2)}</td>
                      <td>{evt.frozenLitersProduced?.toFixed(2)}</td>
                      <td>{evt.largeContainersAdded ?? 0}</td>
                      <td>{evt.smallContainersAdded ?? 0}</td>
                      <td>
                        {evt.batchOverrunPercent !== undefined
                          ? evt.batchOverrunPercent.toFixed(1) + '%'
                          : '—'}
                      </td>
                      <td>
                        <ActionButton onClick={() => setEditingEventId(evt._id)}>✎</ActionButton>
                        <DeleteButton onClick={() => handleDelete(evt._id)}>🗑</DeleteButton>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </Table>
          )}
          {data && totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)' }}>
              <ActionButton disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>
                ← Anterior
              </ActionButton>
              <span style={{ fontSize: 'var(--font-size-sm)', padding: '4px 8px' }}>
                {page + 1} / {totalPages}
              </span>
              <ActionButton disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                Següent →
              </ActionButton>
            </div>
          )}
        </Body>
        <ButtonRow>
          <CancelButton onClick={onClose}>Tancar</CancelButton>
        </ButtonRow>
      </Modal>
    </Overlay>
  );
};
