/** A single daily paradeta income record (as returned by the API). */
export interface DailyIncomeRecord {
  _id: string;
  date: string; // YYYY-MM-DD
  cardAmount: number;
  endCash: number;
  cashRetired: number;
  notes?: string;
  /** Computed: start cash for this day */
  startCash: number;
  /** Computed: cash income = endCash - startCash */
  cashIncome: number;
  /** Computed: total gross income = cardAmount + cashIncome */
  totalIncome: number;
}

/** DTO for creating a new record. */
export interface CreateIncomeDto {
  date: string;
  cardAmount: number;
  endCash: number;
  cashRetired: number;
  notes?: string;
  startCash?: number;
}

/** DTO for updating an existing record (partial). */
export interface UpdateIncomeDto {
  cardAmount?: number;
  endCash?: number;
  cashRetired?: number;
  notes?: string;
  startCash?: number;
}

/** Aggregated statistics. */
export interface IncomeStats {
  totalCard: number;
  totalCash: number;
  totalIncome: number;
  dayCount: number;
  averageDailyIncome: number;
}

/** A group of records aggregated by month/week/year. */
export interface GroupedStat {
  label: string;         // e.g. "2025-06", "2025-W25", "2025"
  dateStart: string;
  dateEnd: string;
  cardAmount: number;
  cashIncome: number;
  totalIncome: number;
  dayCount: number;
}

/** A plain export record (no computed fields). */
export interface IncomeExportRecord {
  _id: string;
  date: string;
  cardAmount: number;
  endCash: number;
  cashRetired: number;
  notes: string;
}

/** Income bracket for calendar color-coding. */
export interface IncomeBracket {
  max: number;
  color: string;
  label: string;
}

/** Default income brackets (user-configurable). */
export const DEFAULT_INCOME_BRACKETS: IncomeBracket[] = [
  { max: 0, color: '#e8f0e8', label: 'Sense dades' },
  { max: 200, color: '#e8f5e9', label: 'Dia caca (<200)' },
  { max: 400, color: '#c8e6c9', label: 'Dia meh (<400)' },
  { max: 600, color: '#a5d6a7', label: 'Dia ok (<600)' },
  { max: 800, color: '#66bb6a', label: 'Dia guai (<800)' },
  { max: 1000, color: '#43a047', label: 'Dia top (<1000)' },
  { max: Infinity, color: '#2e7d32', label: 'Dia max (>1000)' },
];

/** Storage key for bracket preferences. */
const BRACKETS_STORAGE_KEY = 'paradetaIncomeBrackets';

export function loadBrackets(): IncomeBracket[] {
  try {
    const saved = localStorage.getItem(BRACKETS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULT_INCOME_BRACKETS;
}

export function saveBrackets(brackets: IncomeBracket[]): void {
  localStorage.setItem(BRACKETS_STORAGE_KEY, JSON.stringify(brackets));
}

/**
 * Get the bracket color for a given total income.
 */
export function getBracketColor(totalIncome: number, brackets: IncomeBracket[]): string {
  const sorted = [...brackets].sort((a, b) => a.max - b.max);
  for (const b of sorted) {
    if (totalIncome <= b.max) return b.color;
  }
  return sorted[sorted.length - 1]?.color || '#e8f0e8';
}

/**
 * Determine if a hex color is light, returning the appropriate text color.
 * Returns 'var(--text-color-strong)' for light backgrounds, 'white' for dark ones.
 */
export function getTextColorForBg(hex: string): string {
  // Remove # if present
  const h = hex.replace('#', '');
  if (h.length < 6) return 'var(--text-color-strong)';
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  // Relative luminance (per WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? 'var(--text-color-strong)' : 'white';
}
