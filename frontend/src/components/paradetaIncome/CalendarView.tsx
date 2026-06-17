import { useMemo } from 'react';
import { styled } from '@linaria/react';
import { DailyIncomeRecord, IncomeBracket, getBracketColor } from '../../types/paradetaIncome';
import { DayCard } from './DayCard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_NAMES = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg'];
const MONTH_NAMES = [
  'Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny',
  'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre',
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  // Returns day of week: 0=Monday, 1=Tuesday, ..., 6=Sunday
  const d = new Date(year, month, 1);
  const day = d.getDay(); // Date.getDay(): 0=Sunday, 1=Monday, ...
  return day === 0 ? 6 : day - 1;
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Styled
// ---------------------------------------------------------------------------

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`;

const MonthNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
`;

const MonthTitle = styled.h3`
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 700;
`;

const NavButtons = styled.div`
  display: flex;
  gap: var(--space-sm);
  align-items: center;
`;

const NavButton = styled.button`
  padding: var(--space-xs) var(--space-sm);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--surface-color);
  color: var(--text-color);
  font-size: var(--font-size-sm);
  cursor: pointer;
  min-width: 36px;
  text-align: center;

  &:hover { background: var(--surface-color-light); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const TodayButton = styled(NavButton)`
  font-weight: 600;
`;

const SummaryRow = styled.div`
  display: flex;
  gap: var(--space-lg);
  flex-wrap: wrap;
  padding: var(--space-sm) var(--space-md);
  background: var(--surface-color-light);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
`;

const SummaryItem = styled.div`
  display: flex;
  gap: var(--space-xs);
  align-items: center;
`;

const SummaryValue = styled.span`
  font-weight: 700;
  color: var(--text-color-strong);
`;

// Calendar grid
const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;

  @media (max-width: 640px) {
    display: none; /* hide grid on mobile */
  }
`;

const DayHeader = styled.div`
  text-align: center;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-color-light);
  padding: var(--space-xs) 0;
  text-transform: uppercase;
`;

// Mobile: daily cards list
const MobileList = styled.div`
  display: none;

  @media (max-width: 640px) {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
`;

const MobileDayCard = styled.div<{ $color: string }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  background: ${({ $color }) => $color};
  border-radius: var(--border-radius);
  border: var(--border-width) solid var(--border-color);
  cursor: pointer;

  &:hover {
    border-color: var(--primary-color);
  }
`;

const MobileDayInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const MobileDateLabel = styled.div`
  font-weight: 600;
  font-size: var(--font-size-sm);
`;

const MobileDayName = styled.div`
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
`;

const MobileIncome = styled.div`
  font-weight: 700;
  font-size: var(--font-size-base);
  color: var(--text-color-strong);
`;

const NoDataText = styled.div`
  text-align: center;
  padding: var(--space-xl);
  color: var(--text-color-light);
  font-style: italic;
`;

// Bracket legend
const LegendRow = styled.div`
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
  align-items: center;
  padding: var(--space-xs) 0;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
`;

const LegendColor = styled.span<{ $color: string }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: ${({ $color }) => $color};
  border: 1px solid var(--border-color-light);
`;

// Collapsed month
const CollapsedBanner = styled.div`
  text-align: center;
  padding: var(--space-lg);
  background: var(--surface-color-light);
  border-radius: var(--border-radius);
  cursor: pointer;
  color: var(--text-color-light);
  font-style: italic;

  &:hover {
    background: var(--surface-color);
    color: var(--text-color);
  }
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CalendarViewProps {
  /** Currently displayed month (0-indexed) */
  currentMonth: number;
  /** Currently displayed year */
  currentYear: number;
  /** All known records for the current month */
  records: DailyIncomeRecord[];
  /** Brackets for color-coding */
  brackets: IncomeBracket[];
  /** If month has no data, whether it's collapsed */
  collapsed: boolean;
  /** Navigation handlers */
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  /** Click a day to open edit modal */
  onDayClick: (date: string) => void;
  /** Toggle collapsed state */
  onToggleCollapsed: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentMonth,
  currentYear,
  records,
  brackets,
  collapsed,
  onPrevMonth,
  onNextMonth,
  onToday,
  onDayClick,
  onToggleCollapsed,
}) => {
  const days = daysInMonth(currentYear, currentMonth);
  const firstDayOffset = firstDayOfMonth(currentYear, currentMonth);

  // Build a map of date string → record
  const recordsByDate = useMemo(() => {
    const map = new Map<string, DailyIncomeRecord>();
    for (const r of records) {
      map.set(r.date, r);
    }
    return map;
  }, [records]);

  // Compute month summary
  const monthSummary = useMemo(() => {
    let totalCard = 0;
    let totalCash = 0;
    let dayCount = 0;
    for (const r of records) {
      totalCard += r.cardAmount;
      totalCash += r.cashIncome;
      dayCount++;
    }
    return { totalCard, totalCash, totalIncome: totalCard + totalCash, dayCount };
  }, [records]);

  const monthLabel = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
  const hasData = records.length > 0;

  // Format date for mobile day names
  const getDayName = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    const names = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
    return names[d.getDay()];
  };

  if (collapsed && !hasData) {
    return (
      <Container>
        <MonthNav>
          <MonthTitle>{monthLabel}</MonthTitle>
          <NavButtons>
            <NavButton onClick={onPrevMonth}>◀</NavButton>
            <TodayButton onClick={onToday}>Avui</TodayButton>
            <NavButton onClick={onNextMonth}>▶</NavButton>
          </NavButtons>
        </MonthNav>
        <CollapsedBanner onClick={onToggleCollapsed}>
          ← Fer clic per afegir dades al {monthLabel} →
        </CollapsedBanner>
      </Container>
    );
  }

  // Build grid cells: array of { day, isEmpty }
  const totalCells = firstDayOffset + days;
  const totalRows = Math.ceil(totalCells / 7);
  const gridCells: Array<{ day: number; isEmpty: boolean }> = [];

  for (let i = 0; i < firstDayOffset; i++) {
    gridCells.push({ day: 0, isEmpty: true });
  }
  for (let d = 1; d <= days; d++) {
    gridCells.push({ day: d, isEmpty: false });
  }
  // Pad to full rows
  while (gridCells.length < totalRows * 7) {
    gridCells.push({ day: 0, isEmpty: true });
  }

  return (
    <Container>
      {/* Navigation */}
      <MonthNav>
        <MonthTitle>{monthLabel}</MonthTitle>
        <NavButtons>
          <NavButton onClick={onPrevMonth}>◀</NavButton>
          <TodayButton onClick={onToday}>Avui</TodayButton>
          <NavButton onClick={onNextMonth}>▶</NavButton>
        </NavButtons>
      </MonthNav>

      {/* Summary */}
      {hasData && (
        <SummaryRow>
          <SummaryItem>
            📅 <SummaryValue>{monthSummary.dayCount}</SummaryValue> dies
          </SummaryItem>
          <SummaryItem>
            💳 <SummaryValue>€{monthSummary.totalCard.toFixed(2)}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            💵 <SummaryValue>€{monthSummary.totalCash.toFixed(2)}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            💰 <SummaryValue>€{monthSummary.totalIncome.toFixed(2)}</SummaryValue> total
          </SummaryItem>
        </SummaryRow>
      )}

      {/* Legend */}
      <LegendRow>
        {brackets.slice(1).map((b, i) => (
          <LegendItem key={i}>
            <LegendColor $color={b.color} />
            {b.label}
          </LegendItem>
        ))}
      </LegendRow>

      {/* Calendar grid (desktop) */}
      <CalendarGrid>
        {/* Day headers */}
        {DAY_NAMES.map((name, i) => (
          <DayHeader key={i}>{name}</DayHeader>
        ))}
        {/* Day cells */}
        {gridCells.map((cell, idx) =>
          cell.isEmpty ? (
            <div key={idx} />
          ) : (
            <DayCard
              key={idx}
              day={cell.day}
              isCurrentMonth={true}
              record={recordsByDate.get(formatDate(currentYear, currentMonth, cell.day))}
              brackets={brackets}
              onClick={() => onDayClick(formatDate(currentYear, currentMonth, cell.day))}
            />
          ),
        )}
      </CalendarGrid>

      {/* Mobile: daily cards list */}
      <MobileList>
        {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
          const dateStr = formatDate(currentYear, currentMonth, day);
          const record = recordsByDate.get(dateStr);
          const color = record
            ? getBracketColor(record.totalIncome, brackets)
            : brackets[0]?.color || '#e8f0e8';
          return (
            <MobileDayCard key={day} $color={color} onClick={() => onDayClick(dateStr)}>
              <MobileDayInfo>
                <MobileDateLabel>{day} {MONTH_NAMES[currentMonth]}</MobileDateLabel>
                <MobileDayName>{getDayName(day)}</MobileDayName>
              </MobileDayInfo>
              {record ? (
                <MobileIncome>€{record.totalIncome.toFixed(2)}</MobileIncome>
              ) : (
                <MobileIncome style={{ color: 'var(--text-color-light)', fontWeight: 400 }}>
                  — €0.00
                </MobileIncome>
              )}
            </MobileDayCard>
          );
        })}
      </MobileList>

      {!hasData && (
        <NoDataText>
          No hi ha dades per aquest mes. Fes clic a un dia per afegir-ne.
        </NoDataText>
      )}
    </Container>
  );
};
