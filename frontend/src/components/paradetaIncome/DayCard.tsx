import { styled } from '@linaria/react';
import { DailyIncomeRecord, IncomeBracket, getBracketColor } from '../../types/paradetaIncome';

// ---------------------------------------------------------------------------
// Styled
// ---------------------------------------------------------------------------

const Card = styled.div<{ $color: string; $hasData: boolean }>`
  background: ${({ $color }) => $color};
  border: 1px solid ${({ $color, $hasData }) =>
    $hasData ? 'var(--border-color)' : 'var(--border-color-light)'};
  border-radius: var(--border-radius);
  padding: var(--space-xs) var(--space-sm);
  cursor: pointer;
  min-height: 64px;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.15s ease, transform 0.1s ease;

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  @media (max-width: 640px) {
    min-height: 56px;
    padding: var(--space-xs);
  }
`;

const DayNumber = styled.div`
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 2px;
`;

const IncomeValue = styled.div`
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-color-strong);
  line-height: 1.2;
`;

const SubInfo = styled.div`
  font-size: 10px;
  color: var(--text-color-light);
  line-height: 1.2;
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DayCardProps {
  day: number;
  isCurrentMonth: boolean;
  record?: DailyIncomeRecord;
  brackets: IncomeBracket[];
  onClick: () => void;
}

export const DayCard: React.FC<DayCardProps> = ({
  day,
  isCurrentMonth,
  record,
  brackets,
  onClick,
}) => {
  if (!isCurrentMonth) return <div />;

  const hasData = !!record;
  const totalIncome = record?.totalIncome ?? 0;
  const color = hasData
    ? getBracketColor(totalIncome, brackets)
    : brackets[0]?.color || '#e8f0e8';

  return (
    <Card
      $color={color}
      $hasData={hasData}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
    >
      <DayNumber>{day}</DayNumber>
      {hasData && (
        <>
          <IncomeValue>€{totalIncome.toFixed(0)}</IncomeValue>
          <SubInfo>
            💳{record.cardAmount.toFixed(0)}
            {' · '}
            💵{record.cashIncome.toFixed(0)}
          </SubInfo>
        </>
      )}
    </Card>
  );
};
