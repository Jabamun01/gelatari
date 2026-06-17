import DailyParadetaIncome, { IDailyParadetaIncome } from '../models/DailyParadetaIncome';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateIncomeDto {
  date: string;           // ISO date string
  cardAmount: number;
  endCash: number;
  cashRetired: number;
  notes?: string;
  /** Optional initial start cash override (only used when no previous day exists) */
  startCash?: number;
}

export interface UpdateIncomeDto {
  cardAmount?: number;
  endCash?: number;
  cashRetired?: number;
  notes?: string;
  startCash?: number;
}

export interface IncomeRecord {
  _id: string;
  date: string;
  cardAmount: number;
  endCash: number;
  cashRetired: number;
  notes?: string;
  /** Computed: start cash for this day (from previous day or initial override) */
  startCash: number;
  /** Computed: cash income = endCash - startCash */
  cashIncome: number;
  /** Computed: total gross income = cardAmount + cashIncome */
  totalIncome: number;
}

export interface IncomeQuery {
  fromDate?: string;
  toDate?: string;
  year?: number;
  month?: number;
  limit?: number;
  offset?: number;
}

export interface IncomeStats {
  totalCard: number;
  totalCash: number;
  totalIncome: number;
  dayCount: number;
  averageDailyIncome: number;
}

export interface GroupedStat {
  label: string;         // e.g. "2025-06" for month, "2025-W25" for week, "2025" for year
  dateStart: string;     // ISO date
  dateEnd: string;       // ISO date
  cardAmount: number;
  cashIncome: number;
  totalIncome: number;
  dayCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get the previous income record before a given date (sorted by date descending).
 */
async function getPreviousRecord(date: Date): Promise<IDailyParadetaIncome | null> {
  return DailyParadetaIncome.findOne({ date: { $lt: date } })
    .sort({ date: -1 })
    .exec();
}

/**
 * Compute derived fields for a record given its previous day.
 */
function computeDerived(
  record: IDailyParadetaIncome,
  previous: IDailyParadetaIncome | null,
  startCashOverride?: number,
): IncomeRecord {
  // Precedence: explicit override > stored override > previous day end-cashRetired > 0
  const startCash = startCashOverride !== undefined
    ? startCashOverride
    : record.startCashOverride !== undefined
      ? record.startCashOverride
      : previous !== null
        ? previous.endCash - previous.cashRetired
        : 0;

  const cashIncome = record.endCash - startCash;
  const totalIncome = record.cardAmount + cashIncome;

  return {
    _id: (record._id as string).toString(),
    date: record.date.toISOString().split('T')[0],
    cardAmount: record.cardAmount,
    endCash: record.endCash,
    cashRetired: record.cashRetired,
    notes: record.notes,
    startCash: round2(startCash),
    cashIncome: round2(cashIncome),
    totalIncome: round2(totalIncome),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseDate(dateStr: string): Date {
  // Parse as local date (YYYY-MM-DD) to avoid timezone shifting
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a new daily income record.
 * Throws if a record for the given date already exists.
 */
export async function createIncome(dto: CreateIncomeDto): Promise<IncomeRecord> {
  const date = parseDate(dto.date);

  // Check for existing record on the same date
  const existing = await DailyParadetaIncome.findOne({ date }).exec();
  if (existing) {
    const err: any = new Error(`Ja existeix un registre per al dia ${dto.date}.`);
    err.statusCode = 409;
    throw err;
  }

  const record = await DailyParadetaIncome.create({
    date,
    cardAmount: dto.cardAmount ?? 0,
    endCash: dto.endCash ?? 0,
    cashRetired: dto.cashRetired ?? 0,
    notes: dto.notes,
  });

  const previous = await getPreviousRecord(date);
  const isFirst = !previous && dto.startCash !== undefined;

  if (isFirst) {
    record.startCashOverride = dto.startCash;
    await record.save();
  }

  return computeDerived(record, previous, isFirst ? dto.startCash : undefined);
}

/**
 * Update an existing daily income record.
 */
export async function updateIncome(
  id: string,
  dto: UpdateIncomeDto,
): Promise<IncomeRecord> {
  const record = await DailyParadetaIncome.findById(id);
  if (!record) {
    const err: any = new Error('Registre no trobat.');
    err.statusCode = 404;
    throw err;
  }

  if (dto.cardAmount !== undefined) record.cardAmount = dto.cardAmount;
  if (dto.endCash !== undefined) record.endCash = dto.endCash;
  if (dto.cashRetired !== undefined) record.cashRetired = dto.cashRetired;
  if (dto.notes !== undefined) record.notes = dto.notes || undefined;
  if (dto.startCash !== undefined) record.startCashOverride = dto.startCash;

  await record.save();

  const previous = await getPreviousRecord(record.date);
  return computeDerived(record, previous);
}

/**
 * Delete an income record.
 */
export async function deleteIncome(id: string): Promise<void> {
  const result = await DailyParadetaIncome.findByIdAndDelete(id);
  if (!result) {
    const err: any = new Error('Registre no trobat.');
    err.statusCode = 404;
    throw err;
  }
}

/**
 * Get income records, sorted by date ascending.
 */
export async function getIncomes(query: IncomeQuery): Promise<{
  records: IncomeRecord[];
  total: number;
}> {
  const filter: any = {};

  if (query.fromDate || query.toDate) {
    filter.date = {};
    if (query.fromDate) filter.date.$gte = parseDate(query.fromDate);
    if (query.toDate) {
      // Include the full toDate day
      const to = parseDate(query.toDate);
      to.setHours(23, 59, 59, 999);
      filter.date.$lte = to;
    }
  } else if (query.year) {
    const start = new Date(query.year, 0, 1);
    const end = new Date(query.year, 11, 31, 23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
    if (query.month !== undefined) {
      const monthStart = new Date(query.year, query.month - 1, 1);
      const monthEnd = new Date(query.year, query.month, 0, 23, 59, 59, 999);
      filter.date = { $gte: monthStart, $lte: monthEnd };
    }
  }

  const limit = query.limit || 365;
  const offset = query.offset || 0;

  const [records, total] = await Promise.all([
    DailyParadetaIncome.find(filter)
      .sort({ date: 1 })
      .skip(offset)
      .limit(limit)
      .exec(),
    DailyParadetaIncome.countDocuments(filter),
  ]);

  // For each record, compute derived fields using previous record
  const result: IncomeRecord[] = [];
  let previous: IDailyParadetaIncome | null = null;

  for (const record of records) {
    const prev = previous || (await getPreviousRecord(record.date));
    result.push(computeDerived(record, prev));
    previous = record;
  }

  return { records: result, total };
}

/**
 * Get a single income record by ID.
 */
export async function getIncomeById(id: string): Promise<IncomeRecord | null> {
  const record = await DailyParadetaIncome.findById(id).exec();
  if (!record) return null;

  const previous = await getPreviousRecord(record.date);
  return computeDerived(record, previous);
}

/**
 * Get aggregated statistics for a date range.
 */
export async function getStats(
  fromDate?: string,
  toDate?: string,
): Promise<IncomeStats> {
  const filter: any = {};
  if (fromDate || toDate) {
    filter.date = {};
    if (fromDate) filter.date.$gte = parseDate(fromDate);
    if (toDate) {
      const to = parseDate(toDate);
      to.setHours(23, 59, 59, 999);
      filter.date.$lte = to;
    }
  }

  const records = await DailyParadetaIncome.find(filter)
    .sort({ date: 1 })
    .exec();

  if (records.length === 0) {
    return {
      totalCard: 0,
      totalCash: 0,
      totalIncome: 0,
      dayCount: 0,
      averageDailyIncome: 0,
    };
  }

  let previous: IDailyParadetaIncome | null = null;
  let totalCard = 0;
  let totalCash = 0;
  let totalIncome = 0;

  for (const record of records) {
    const prev = previous || (await getPreviousRecord(record.date));
    const startCash = prev ? prev.endCash - prev.cashRetired : 0;
    const cashIncome = record.endCash - startCash;
    totalCard += record.cardAmount;
    totalCash += cashIncome;
    totalIncome += record.cardAmount + cashIncome;
    previous = record;
  }

  return {
    totalCard: round2(totalCard),
    totalCash: round2(totalCash),
    totalIncome: round2(totalIncome),
    dayCount: records.length,
    averageDailyIncome: round2(totalIncome / records.length),
  };
}

/**
 * Get grouped statistics for charts (by month, week, or year).
 */
export async function getGroupedStats(
  groupBy: 'month' | 'week' | 'year',
  fromDate?: string,
  toDate?: string,
): Promise<GroupedStat[]> {
  const filter: any = {};
  if (fromDate || toDate) {
    filter.date = {};
    if (fromDate) filter.date.$gte = parseDate(fromDate);
    if (toDate) {
      const to = parseDate(toDate);
      to.setHours(23, 59, 59, 999);
      filter.date.$lte = to;
    }
  }

  const records = await DailyParadetaIncome.find(filter)
    .sort({ date: 1 })
    .exec();

  if (records.length === 0) return [];

  // Compute derived records first
  const derived: IncomeRecord[] = [];
  let previous: IDailyParadetaIncome | null = null;
  for (const record of records) {
    const prev = previous || (await getPreviousRecord(record.date));
    derived.push(computeDerived(record, prev));
    previous = record;
  }

  // Group
  const groups = new Map<string, {
    cardAmount: number;
    cashIncome: number;
    totalIncome: number;
    dayCount: number;
    dateStart: string;
    dateEnd: string;
  }>();

  for (const rec of derived) {
    const d = new Date(rec.date + 'T12:00:00');
    let key: string;
    let dateStart: string;
    let dateEnd: string;

    if (groupBy === 'year') {
      const y = d.getFullYear();
      key = String(y);
      dateStart = `${y}-01-01`;
      dateEnd = `${y}-12-31`;
    } else if (groupBy === 'month') {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      key = `${y}-${m}`;
      dateStart = `${y}-${m}-01`;
      // Last day of month
      const lastDay = new Date(y, d.getMonth() + 1, 0).getDate();
      dateEnd = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
    } else {
      // Week (ISO week)
      const weekStart = getISOWeekStart(d);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const y = weekStart.getFullYear();
      const weekNum = getISOWeekNumber(d);
      key = `${y}-W${String(weekNum).padStart(2, '0')}`;
      dateStart = formatDate(weekStart);
      dateEnd = formatDate(weekEnd);
    }

    const existing = groups.get(key) || {
      cardAmount: 0,
      cashIncome: 0,
      totalIncome: 0,
      dayCount: 0,
      dateStart,
      dateEnd,
    };
    existing.cardAmount += rec.cardAmount;
    existing.cashIncome += rec.cashIncome;
    existing.totalIncome += rec.totalIncome;
    existing.dayCount += 1;
    groups.set(key, existing);
  }

  const result: GroupedStat[] = [];
  for (const [label, val] of groups) {
    result.push({
      label,
      dateStart: val.dateStart,
      dateEnd: val.dateEnd,
      cardAmount: round2(val.cardAmount),
      cashIncome: round2(val.cashIncome),
      totalIncome: round2(val.totalIncome),
      dayCount: val.dayCount,
    });
  }

  // Sort by date ascending
  result.sort((a, b) => a.dateStart.localeCompare(b.dateStart));

  return result;
}

export interface ExportRecord {
  _id: string;
  date: string;
  cardAmount: number;
  endCash: number;
  cashRetired: number;
  notes: string;
}

/**
 * Export all records as plain data (no computed fields).
 */
export async function exportAll(): Promise<ExportRecord[]> {
  const records = await DailyParadetaIncome.find()
    .sort({ date: 1 })
    .lean()
    .exec();

  return records.map((r) => ({
    _id: (r._id as string).toString(),
    date: formatDate(r.date),
    cardAmount: r.cardAmount,
    endCash: r.endCash,
    cashRetired: r.cashRetired,
    notes: r.notes || '',
  }));
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function getISOWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
