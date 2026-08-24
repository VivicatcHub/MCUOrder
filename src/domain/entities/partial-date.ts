export type DatePrecision = "year" | "month" | "day";

export interface PartialDate {
  readonly raw: string;
  readonly year: number;
  readonly month: number | null;
  readonly day: number | null;
  readonly precision: DatePrecision;

  readonly sortKey: number;
}

const PATTERN = /^(-?\d{1,6})(?:-(\d{2}))?(?:-(\d{2}))?$/;

export function parsePartialDate(raw: string): PartialDate {
  const match = PATTERN.exec(raw.trim());
  if (!match) throw new Error(`Unparseable date: "${raw}"`);

  const year = Number(match[1]);
  const month = match[2] ? Number(match[2]) : null;
  const day = match[3] ? Number(match[3]) : null;
  const precision: DatePrecision = day ? "day" : month ? "month" : "year";

  return {
    raw,
    year,
    month,
    day,
    precision,
    sortKey: year * 10000 + (month ?? 0) * 100 + (day ?? 0),
  };
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatPartialDate(
  date: PartialDate,
  style: "long" | "short" = "long",
): string {
  const year = date.year < 0 ? `${Math.abs(date.year)} BC` : String(date.year);
  if (date.precision === "year") return year;

  const month = MONTHS[(date.month ?? 1) - 1];
  const monthLabel = style === "short" ? month.slice(0, 3) : month;
  if (date.precision === "month") return `${monthLabel} ${year}`;

  return `${monthLabel} ${date.day}, ${year}`;
}

export function parseOptionalDate(
  raw: string | null | undefined,
): PartialDate | null {
  return raw ? parsePartialDate(raw) : null;
}

export function formatDateRange(
  start: PartialDate | null,
  end: PartialDate | null,
): string | null {
  if (!start) return end ? formatPartialDate(end) : null;
  const from = formatPartialDate(start);
  const to = end ? formatPartialDate(end) : from;
  return from === to ? from : `${from} → ${to}`;
}

export function compareDates(a: PartialDate, b: PartialDate): number {
  return a.sortKey - b.sortKey;
}

export function compareOptionalDates(
  a: PartialDate | null,
  b: PartialDate | null,
): number {
  if (a && b) return compareDates(a, b);
  if (a) return -1;
  if (b) return 1;
  return 0;
}
