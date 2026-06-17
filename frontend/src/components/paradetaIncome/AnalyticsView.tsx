import { useState, useMemo } from 'react';
import { styled } from '@linaria/react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import {
  fetchIncomes,
  fetchStats,
  fetchGroupedStats,
  fetchExportData,
} from '../../api/paradetaIncome';
import { IncomeExportRecord } from '../../types/paradetaIncome';

// ---------------------------------------------------------------------------
// Styled
// ---------------------------------------------------------------------------

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  padding-bottom: var(--space-2xl);
`;

const Section = styled.div`
  background: var(--surface-color);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
`;

const SectionTitle = styled.h4`
  margin: 0 0 var(--space-md);
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-color-strong);
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 300px;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-md);
`;

const SummaryCard = styled.div<{ $accent?: boolean }>`
  background: ${({ $accent }) =>
    $accent ? 'var(--primary-color-light, #e3f2fd)' : 'var(--surface-color-light)'};
  border: var(--border-width) solid ${({ $accent }) =>
    $accent ? 'var(--primary-color)' : 'var(--border-color-light)'};
  border-radius: var(--border-radius-lg);
  padding: var(--space-md);
  text-align: center;
`;

const SummaryValue = styled.div<{ $large?: boolean }>`
  font-size: ${({ $large }) => ($large ? 'var(--font-size-2xl, 1.75rem)' : 'var(--font-size-lg, 1.25rem)')};
  font-weight: 800;
  color: var(--text-color-strong);
  line-height: 1.2;
`;

const SummaryLabel = styled.div`
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
  margin-top: 4px;
`;

const FilterRow = styled.div`
  display: flex;
  gap: var(--space-sm);
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: var(--space-md);
`;

const FilterSelect = styled.select`
  padding: var(--space-xs) var(--space-sm);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--surface-color);
  color: var(--text-color);
  font-size: var(--font-size-sm);
`;

const ExportButton = styled.button`
  padding: var(--space-xs) var(--space-md);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--surface-color);
  color: var(--text-color);
  font-size: var(--font-size-sm);
  cursor: pointer;
  margin-left: auto;

  &:hover {
    background: var(--surface-color-light);
    border-color: var(--primary-color);
  }
`;

const LoadingText = styled.div`
  text-align: center;
  padding: var(--space-xl);
  color: var(--text-color-light);
  font-style: italic;
`;

const EmptyText = styled.div`
  text-align: center;
  padding: var(--space-xl);
  color: var(--text-color-light);
  font-style: italic;
`;

const WeekdayBar = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const WeekdayLabel = styled.div`
  font-size: var(--font-size-xs);
  color: var(--text-color-light);
  text-transform: uppercase;
`;

const WeekdayValue = styled.div`
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-color-strong);
`;

const WeekdayBarVisual = styled.div<{ $height: number; $color: string }>`
  width: 40px;
  height: ${({ $height }) => Math.max(4, $height)}px;
  background: ${({ $color }) => $color};
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s ease;
`;

const WeekdayChart = styled.div`
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-md) 0;
  align-items: flex-end;
`;

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

const CHART_COLORS = {
  card: '#4fc3f7',
  cash: '#81c784',
  total: '#5c6bc0',
  income: '#66bb6a',
};

const PIE_COLORS = ['#4fc3f7', '#81c784'];

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const formatEur = (n: number) =>
  new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const formatEurDec = (n: number) =>
  new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);

const MONTH_NAMES_SHORT = [
  'Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des',
];

const DAY_NAMES = ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AnalyticsViewProps {
  currentYear: number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ currentYear }) => {
  const [yearFilter, setYearFilter] = useState<number>(currentYear);

  // Get available years from data
  const { data: allRecords } = useQuery({
    queryKey: ['paradetaIncome', 'all'],
    queryFn: () => fetchIncomes({ limit: 10000 }),
  });

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear);
    if (allRecords?.records) {
      for (const r of allRecords.records) {
        const y = parseInt(r.date.split('-')[0], 10);
        if (!isNaN(y)) years.add(y);
      }
    }
    return [...years].sort((a, b) => b - a); // newest first
  }, [allRecords, currentYear]);

  // Stats for selected year
  const fromDate = `${yearFilter}-01-01`;
  const toDate = `${yearFilter}-12-31`;

  const { data: stats } = useQuery({
    queryKey: ['paradetaIncome', 'stats', fromDate, toDate],
    queryFn: () => fetchStats({ fromDate, toDate }),
  });

  // Monthly stats
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['paradetaIncome', 'grouped', 'month', fromDate, toDate],
    queryFn: () => fetchGroupedStats({ groupBy: 'month', fromDate, toDate }),
  });

  // Weekly stats
  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ['paradetaIncome', 'grouped', 'week', fromDate, toDate],
    queryFn: () => fetchGroupedStats({ groupBy: 'week', fromDate, toDate }),
  });

  // All daily data for trend/heatmap
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['paradetaIncome', 'year', yearFilter],
    queryFn: () => fetchIncomes({ year: yearFilter, limit: 366 }),
  });

  // Year-over-year (all years monthly)
  const { data: yoyData } = useQuery({
    queryKey: ['paradetaIncome', 'grouped', 'month', 'all'],
    queryFn: () => fetchGroupedStats({ groupBy: 'month' }),
  });

  // Transform monthly data for recharts
  const monthlyChartData = useMemo(() => {
    if (!monthlyData) return [];
    return monthlyData.map((m) => ({
      name: MONTH_NAMES_SHORT[parseInt(m.label.split('-')[1], 10) - 1] || m.label,
      card: m.cardAmount,
      cash: m.cashIncome,
      total: m.totalIncome,
    }));
  }, [monthlyData]);

  // Transform weekly data
  const weeklyChartData = useMemo(() => {
    if (!weeklyData) return [];
    return weeklyData.map((w) => ({
      name: w.label.replace(/^\d{4}-W/, 'S'),
      card: w.cardAmount,
      cash: w.cashIncome,
      total: w.totalIncome,
      dayCount: w.dayCount,
    }));
  }, [weeklyData]);

  // Daily trend data
  const dailyTrendData = useMemo(() => {
    if (!dailyData?.records) return [];
    return dailyData.records.map((d) => ({
      date: d.date,
      card: d.cardAmount,
      cash: d.cashIncome,
      total: d.totalIncome,
    }));
  }, [dailyData]);

  // Cumulative income
  const cumulativeData = useMemo(() => {
    if (!dailyData?.records) return [];
    let running = 0;
    return dailyData.records.map((d) => {
      running += d.totalIncome;
      return {
        date: d.date,
        cumulative: running,
      };
    });
  }, [dailyData]);

  // Weekday breakdown
  const weekdayData = useMemo(() => {
    if (!dailyData?.records) return [];
    const totals: number[] = [0, 0, 0, 0, 0, 0, 0];
    const counts: number[] = [0, 0, 0, 0, 0, 0, 0];
    for (const r of dailyData.records) {
      const d = new Date(r.date + 'T12:00:00');
      const dayIdx = d.getDay(); // 0=Sun, 1=Mon, ...
      // Convert to Monday-based: Mon=0, Tue=1, ... Sun=6
      const idx = dayIdx === 0 ? 6 : dayIdx - 1;
      totals[idx] += r.totalIncome;
      counts[idx]++;
    }
    const maxVal = Math.max(...totals, 1);
    return DAY_NAMES.map((name, i) => ({
      name,
      total: totals[i],
      avg: counts[i] > 0 ? totals[i] / counts[i] : 0,
      count: counts[i],
      barHeight: (totals[i] / maxVal) * 150,
    }));
  }, [dailyData]);

  // Year-over-year (monthly comparison)
  const yoyChartData = useMemo(() => {
    if (!yoyData) return [];
    // Group by month label across years
    const byMonth = new Map<string, { label: string; values: { year: number; total: number }[] }>();
    for (const g of yoyData) {
      const parts = g.label.split('-');
      if (parts.length !== 2) continue;
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const key = month.toString();
      if (!byMonth.has(key)) {
        byMonth.set(key, { label: MONTH_NAMES_SHORT[month - 1], values: [] });
      }
      byMonth.get(key)!.values.push({ year, total: g.totalIncome });
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
      .map(([_, v]) => {
        const row: any = { name: v.label };
        for (const val of v.values) {
          row[String(val.year)] = val.total;
        }
        return row;
      });
  }, [yoyData]);

  const availableYearsForYoy = useMemo(() => {
    if (!yoyData) return [];
    const years = new Set<number>();
    for (const g of yoyData) {
      const y = parseInt(g.label.split('-')[0], 10);
      if (!isNaN(y)) years.add(y);
    }
    return [...years].sort();
  }, [yoyData]);

  // Handle CSV export
  const handleExport = async () => {
    try {
      const data = await fetchExportData();
      const headers = 'Data,Targeta,CashFinal,CashRetirat,Notes';
      const rows = data.map((r: IncomeExportRecord) =>
        `${r.date},${r.cardAmount.toFixed(2)},${r.endCash.toFixed(2)},${r.cashRetired.toFixed(2)},"${(r.notes || '').replace(/"/g, '""')}"`
      );
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `paradeta-ingressos-${yearFilter}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const isLoading = monthlyLoading || weeklyLoading || dailyLoading;

  if (isLoading) return <Container><LoadingText>Carregant analítiques...</LoadingText></Container>;

  return (
    <Container>
      {/* Filters */}
      <FilterRow>
        <FilterSelect
          value={yearFilter}
          onChange={(e) => setYearFilter(parseInt(e.target.value, 10))}
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </FilterSelect>
        <ExportButton onClick={handleExport}>
          📥 Exportar CSV
        </ExportButton>
      </FilterRow>

      {/* Summary cards */}
      {stats && (
        <Section>
          <SummaryGrid>
            <SummaryCard $accent>
              <SummaryValue $large>€{(stats.totalIncome).toFixed(0)}</SummaryValue>
              <SummaryLabel>💰 Ingrés brut total</SummaryLabel>
            </SummaryCard>
            <SummaryCard>
              <SummaryValue>€{stats.totalCard.toFixed(0)}</SummaryValue>
              <SummaryLabel>💳 Targeta</SummaryLabel>
            </SummaryCard>
            <SummaryCard>
              <SummaryValue>€{stats.totalCash.toFixed(0)}</SummaryValue>
              <SummaryLabel>💵 Cash</SummaryLabel>
            </SummaryCard>
            <SummaryCard>
              <SummaryValue>{stats.dayCount}</SummaryValue>
              <SummaryLabel>📅 Dies</SummaryLabel>
            </SummaryCard>
            <SummaryCard>
              <SummaryValue>€{stats.averageDailyIncome.toFixed(0)}</SummaryValue>
              <SummaryLabel>📊 Mitjana/dia</SummaryLabel>
            </SummaryCard>
          </SummaryGrid>
        </Section>
      )}

      {/* Totals per month */}
      {monthlyChartData.length > 0 && (
        <Section>
          <SectionTitle>📊 Ingressos mensuals</SectionTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-light)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `€${v}`} />
                <Tooltip formatter={(v) => formatEurDec(v as number)} />
                <Legend />
                <Bar dataKey="card" name="Targeta" fill={CHART_COLORS.card} stackId="a" />
                <Bar dataKey="cash" name="Cash" fill={CHART_COLORS.cash} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Section>
      )}

      {/* Totals per week */}
      {weeklyChartData.length > 0 && (
        <Section>
          <SectionTitle>📊 Ingressos setmanals</SectionTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-light)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `€${v}`} />
                <Tooltip formatter={(v, name: string) => [formatEurDec(v as number), name === 'card' ? 'Targeta' : name === 'cash' ? 'Cash' : 'Total']} />
                <Legend />
                <Bar dataKey="card" name="Targeta" fill={CHART_COLORS.card} stackId="a" />
                <Bar dataKey="cash" name="Cash" fill={CHART_COLORS.cash} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Section>
      )}

      {/* Card vs Cash pie */}
      {stats && stats.totalIncome > 0 && (
        <Section>
          <SectionTitle>🥧 Targeta vs Cash</SectionTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Targeta', value: stats.totalCard },
                    { name: 'Cash', value: stats.totalCash },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }: { name?: unknown; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {PIE_COLORS.map((color, i) => (
                    <Cell key={i} fill={color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatEurDec(v as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Section>
      )}

      {/* Daily trend */}
      {dailyTrendData.length > 0 && (
        <Section>
          <SectionTitle>📈 Evolució diària</SectionTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-light)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v + 'T12:00:00');
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `€${v}`} />
                <Tooltip
                  formatter={(v, name) => [formatEurDec(v as number), name === 'total' ? 'Total' : name === 'card' ? 'Targeta' : 'Cash']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total" stroke={CHART_COLORS.total} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="card" name="Targeta" stroke={CHART_COLORS.card} strokeWidth={1} dot={false} />
                <Line type="monotone" dataKey="cash" name="Cash" stroke={CHART_COLORS.cash} strokeWidth={1} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Section>
      )}

      {/* Cumulative */}
      {cumulativeData.length > 0 && (
        <Section>
          <SectionTitle>📈 Ingrés acumulat</SectionTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-light)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => {
                    const d = new Date(v + 'T12:00:00');
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `€${v}`} />
                <Tooltip formatter={(v) => formatEurDec(v as number)} labelFormatter={(label) => `Data: ${label}`} />
                <Legend />
                <Line type="monotone" dataKey="cumulative" name="Acumulat" stroke={CHART_COLORS.income} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Section>
      )}

      {/* Weekday breakdown */}
      {weekdayData.some((w) => w.count > 0) && (
        <Section>
          <SectionTitle>📅 Ingressos per dia de la setmana</SectionTitle>
          <WeekdayChart>
            {weekdayData.map((w, i) => (
              <WeekdayBar key={i}>
                <WeekdayValue>{w.count > 0 ? formatEur(w.avg) : '—'}</WeekdayValue>
                <WeekdayBarVisual $height={w.barHeight} $color={CHART_COLORS.income} />
                <WeekdayLabel>{w.name.slice(0, 3)}</WeekdayLabel>
              </WeekdayBar>
            ))}
          </WeekdayChart>
          <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--text-color-light)', marginTop: 'var(--space-xs)' }}>
            Mitjana per dia de la setmana
          </div>
        </Section>
      )}

      {/* Year-over-year comparison */}
      {yoyChartData.length > 0 && availableYearsForYoy.length >= 2 && (
        <Section>
          <SectionTitle>📊 Comparació interanual</SectionTitle>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yoyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color-light)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `€${v}`} />
                <Tooltip formatter={(v) => formatEurDec(v as number)} />
                <Legend />
                {availableYearsForYoy.map((year, i) => (
                  <Bar
                    key={year}
                    dataKey={String(year)}
                    name={String(year)}
                    fill={i === 0 ? CHART_COLORS.card : i === 1 ? CHART_COLORS.cash : CHART_COLORS.total}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Section>
      )}

      {!stats && (
        <EmptyText>No hi ha dades d'ingressos per aquest any.</EmptyText>
      )}
    </Container>
  );
};
