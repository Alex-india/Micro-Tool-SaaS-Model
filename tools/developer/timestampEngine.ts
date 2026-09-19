/**
 * Universal Unix Timestamp and Temporal Conversion Engine.
 * Supports Seconds, Milliseconds, Microseconds, Nanoseconds, ISO 8601, RFC 2822,
 * Relative elapsed time, leap year / calendar metrics, multi-timezone formatting, and developer code snippets.
 */

export type TimestampUnit = "seconds" | "milliseconds" | "microseconds" | "nanoseconds";

export interface TimezoneDisplay {
  name: string;
  tz: string;
  formatted: string;
  offset: string;
}

export interface DetailedTimestampResult {
  isValid: boolean;
  error?: string;
  date: Date;
  epochSeconds: number;
  epochMilliseconds: number;
  epochMicroseconds: string;
  epochNanoseconds: string;
  iso8601: string;
  iso8601Local: string;
  utcString: string;
  localString: string;
  sqlTimestamp: string;
  excelSerial: number;
  relativeTime: string;
  dayOfWeek: string;
  dayOfYear: number;
  weekOfYear: number;
  isLeapYear: boolean;
  detectedUnit: TimestampUnit;
  timezones: TimezoneDisplay[];
}

export interface TimeDifferenceResult {
  isValid: boolean;
  error?: string;
  diffMs: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  totalSeconds: number;
  workdays: number;
  humanDuration: string;
  isPast: boolean;
}

export interface BatchConversionItem {
  input: string;
  isValid: boolean;
  epochSeconds?: number;
  utc?: string;
  local?: string;
  relative?: string;
  error?: string;
}

/**
 * Checks if a given year is a leap year in the Gregorian calendar.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Calculates the day of the year (1-366) for a given date.
 */
export function getDayOfYear(date: Date): number {
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diffMs = date.getTime() - startOfYear.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;
}

/**
 * Calculates the ISO 8601 week number (1-53).
 */
export function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Formats relative time ("just now", "10 seconds ago", "in 2 hours", etc.).
 */
export function formatRelativeTime(epochMs: number, nowMs: number = Date.now()): string {
  const diffSec = Math.floor((nowMs - epochMs) / 1000);
  const isPast = diffSec >= 0;
  const absSec = Math.abs(diffSec);

  if (absSec < 5) return "just now";
  if (absSec < 60) return isPast ? `${absSec} seconds ago` : `in ${absSec} seconds`;

  const absMin = Math.floor(absSec / 60);
  if (absMin < 60) {
    const unit = absMin === 1 ? "minute" : "minutes";
    return isPast ? `${absMin} ${unit} ago` : `in ${absMin} ${unit}`;
  }

  const absHours = Math.floor(absMin / 60);
  if (absHours < 24) {
    const unit = absHours === 1 ? "hour" : "hours";
    return isPast ? `${absHours} ${unit} ago` : `in ${absHours} ${unit}`;
  }

  const absDays = Math.floor(absHours / 24);
  if (absDays < 30) {
    const unit = absDays === 1 ? "day" : "days";
    return isPast ? `${absDays} ${unit} ago` : `in ${absDays} ${unit}`;
  }

  const absMonths = Math.floor(absDays / 30);
  if (absMonths < 12) {
    const unit = absMonths === 1 ? "month" : "months";
    return isPast ? `${absMonths} ${unit} ago` : `in ${absMonths} ${unit}`;
  }

  const absYears = Math.floor(absDays / 365);
  const unit = absYears === 1 ? "year" : "years";
  return isPast ? `${absYears} ${unit} ago` : `in ${absYears} ${unit}`;
}

const WORLD_TIMEZONES = [
  { name: "UTC", tz: "UTC" },
  { name: "US Pacific (PST/PDT)", tz: "America/Los_Angeles" },
  { name: "US Eastern (EST/EDT)", tz: "America/New_York" },
  { name: "UK London (GMT/BST)", tz: "Europe/London" },
  { name: "Central Europe (CET/CEST)", tz: "Europe/Berlin" },
  { name: "India (IST)", tz: "Asia/Kolkata" },
  { name: "Singapore / Beijing (SGT/CST)", tz: "Asia/Singapore" },
  { name: "Japan (JST)", tz: "Asia/Tokyo" },
  { name: "Australia Eastern (AEST/AEDT)", tz: "Australia/Sydney" },
];

/**
 * Formats a Date across major global timezones.
 */
export function formatWorldTimezones(date: Date): TimezoneDisplay[] {
  return WORLD_TIMEZONES.map(({ name, tz }) => {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZoneName: "short",
      });
      const parts = formatter.formatToParts(date);
      const tzName = parts.find((p) => p.type === "timeZoneName")?.value || tz;
      return {
        name,
        tz,
        formatted: formatter.format(date),
        offset: tzName,
      };
    } catch {
      return {
        name,
        tz,
        formatted: date.toUTCString(),
        offset: "UTC",
      };
    }
  });
}

/**
 * Detects unit of a numeric epoch string (seconds, milliseconds, microseconds, nanoseconds).
 */
export function detectTimestampUnit(numStr: string): TimestampUnit {
  const digits = numStr.trim().replace(/^[-+]/, "").split(".")[0].length;
  if (digits >= 18) return "nanoseconds";
  if (digits >= 15) return "microseconds";
  if (digits >= 12) return "milliseconds";
  return "seconds";
}

/**
 * Parses numeric epoch string according to unit or auto-detection.
 */
export function parseEpochInput(
  input: string | number,
  forcedUnit?: TimestampUnit
): { date: Date; unit: TimestampUnit } | null {
  const str = input.toString().trim();
  if (!str) return null;

  // If floating point, handle seconds with fractional ms
  const num = parseFloat(str);
  if (isNaN(num)) return null;

  const unit = forcedUnit || detectTimestampUnit(str);
  let ms: number;

  switch (unit) {
    case "seconds":
      ms = Math.floor(num * 1000);
      break;
    case "milliseconds":
      ms = Math.floor(num);
      break;
    case "microseconds":
      ms = Math.floor(num / 1000);
      break;
    case "nanoseconds":
      ms = Math.floor(num / 1000000);
      break;
  }

  const date = new Date(ms);
  if (isNaN(date.getTime())) return null;

  return { date, unit };
}

export function dateToExcelSerial(date: Date): number {
  if (isNaN(date.getTime())) return 0;
  const epoch = new Date(Date.UTC(1899, 11, 30)).getTime();
  return Number(((date.getTime() - epoch) / 86400000).toFixed(5));
}

export function getLocalISOString(date: Date): string {
  if (isNaN(date.getTime())) return "";
  const tzo = -date.getTimezoneOffset();
  const dif = tzo >= 0 ? "+" : "-";
  const pad = (num: number) => (num < 10 ? "0" : "") + num;
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds()) +
    dif +
    pad(Math.floor(Math.abs(tzo) / 60)) +
    ":" +
    pad(Math.abs(tzo) % 60)
  );
}

export function dateToSqlTimestamp(date: Date, isUtc: boolean = true): string {
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => (n < 10 ? "0" : "") + n;
  const y = isUtc ? date.getUTCFullYear() : date.getFullYear();
  const m = isUtc ? date.getUTCMonth() + 1 : date.getMonth() + 1;
  const d = isUtc ? date.getUTCDate() : date.getDate();
  const h = isUtc ? date.getUTCHours() : date.getHours();
  const min = isUtc ? date.getUTCMinutes() : date.getMinutes();
  const s = isUtc ? date.getUTCSeconds() : date.getSeconds();
  return `${y}-${pad(m)}-${pad(d)} ${pad(h)}:${pad(min)}:${pad(s)}`;
}

/**
 * Formats a Date using a custom token pattern (YYYY, MM, DD, HH, mm, ss, SSS, A, etc.).
 */
export function formatCustomDate(date: Date, pattern: string, isUtc: boolean = true): string {
  if (isNaN(date.getTime())) return "";
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");

  const y = isUtc ? date.getUTCFullYear() : date.getFullYear();
  const m = isUtc ? date.getUTCMonth() + 1 : date.getMonth() + 1;
  const d = isUtc ? date.getUTCDate() : date.getDate();
  const h24 = isUtc ? date.getUTCHours() : date.getHours();
  const h12 = h24 % 12 || 12;
  const min = isUtc ? date.getUTCMinutes() : date.getMinutes();
  const sec = isUtc ? date.getUTCSeconds() : date.getSeconds();
  const ms = isUtc ? date.getUTCMilliseconds() : date.getMilliseconds();
  const ampm = h24 >= 12 ? "PM" : "AM";

  return pattern
    .replace(/YYYY/g, String(y))
    .replace(/YY/g, String(y).slice(-2))
    .replace(/MM/g, pad(m))
    .replace(/DD/g, pad(d))
    .replace(/HH/g, pad(h24))
    .replace(/hh/g, pad(h12))
    .replace(/mm/g, pad(min))
    .replace(/ss/g, pad(sec))
    .replace(/SSS/g, pad(ms, 3))
    .replace(/A/g, ampm)
    .replace(/a/g, ampm.toLowerCase());
}

/**
 * Calculates the exact duration and time difference between two timestamps or dates.
 */
export function calculateTimeDifference(
  startInput: string | number,
  endInput: string | number
): TimeDifferenceResult {
  const startRes = parseTimestamp(startInput);
  const endRes = parseTimestamp(endInput);

  if (!startRes.isValid || !endRes.isValid) {
    return {
      isValid: false,
      error: !startRes.isValid ? `Start time error: ${startRes.error}` : `End time error: ${endRes.error}`,
      diffMs: 0,
      totalDays: 0,
      totalHours: 0,
      totalMinutes: 0,
      totalSeconds: 0,
      workdays: 0,
      humanDuration: "",
      isPast: false,
    };
  }

  const t1 = startRes.date.getTime();
  const t2 = endRes.date.getTime();
  const diffMs = Math.abs(t2 - t1);
  const isPast = t2 < t1;

  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const totalHours = Math.floor(diffMs / (3600 * 1000));
  const totalDays = Math.floor(diffMs / (24 * 3600 * 1000));

  // Business days
  const minDate = t1 < t2 ? startRes.date : endRes.date;
  const maxDate = t1 < t2 ? endRes.date : startRes.date;
  let workdays = 0;
  const cur = new Date(minDate.getTime());
  while (cur < maxDate) {
    const day = cur.getUTCDay();
    if (day !== 0 && day !== 6) workdays++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  const remHours = Math.floor((diffMs % (24 * 3600 * 1000)) / (3600 * 1000));
  const remMinutes = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
  const remSeconds = Math.floor((diffMs % (60 * 1000)) / 1000);

  const parts: string[] = [];
  if (totalDays > 0) parts.push(`${totalDays} ${totalDays === 1 ? "day" : "days"}`);
  if (remHours > 0) parts.push(`${remHours} ${remHours === 1 ? "hour" : "hours"}`);
  if (remMinutes > 0) parts.push(`${remMinutes} ${remMinutes === 1 ? "minute" : "minutes"}`);
  if (remSeconds > 0 || parts.length === 0) parts.push(`${remSeconds} ${remSeconds === 1 ? "second" : "seconds"}`);

  return {
    isValid: true,
    diffMs,
    totalDays,
    totalHours,
    totalMinutes,
    totalSeconds,
    workdays,
    humanDuration: parts.join(", "),
    isPast,
  };
}

/**
 * Comprehensive parser for any timestamp input (numeric epoch, ISO 8601, RFC 2822, human date).
 */
export function parseTimestamp(
  input: string | number,
  options: {
    unit?: TimestampUnit;
    nowMs?: number;
  } = {}
): DetailedTimestampResult {
  const str = input.toString().trim();
  if (!str) {
    return {
      isValid: false,
      error: "Input timestamp is empty.",
      date: new Date(NaN),
      epochSeconds: 0,
      epochMilliseconds: 0,
      epochMicroseconds: "0",
      epochNanoseconds: "0",
      iso8601: "",
      iso8601Local: "",
      utcString: "",
      localString: "",
      sqlTimestamp: "",
      excelSerial: 0,
      relativeTime: "",
      dayOfWeek: "",
      dayOfYear: 0,
      weekOfYear: 0,
      isLeapYear: false,
      detectedUnit: "seconds",
      timezones: [],
    };
  }

  let date: Date | null = null;
  let detectedUnit: TimestampUnit = "seconds";

  // Check if strictly numeric or scientific notation
  if (/^[-+]?[0-9]+(\.[0-9]+)?([eE][-+]?[0-9]+)?$/.test(str)) {
    const parsed = parseEpochInput(str, options.unit);
    if (parsed) {
      date = parsed.date;
      detectedUnit = parsed.unit;
    }
  } else {
    // Try standard date parsing (ISO 8601, RFC 2822, etc.)
    const parsedDate = new Date(str);
    if (!isNaN(parsedDate.getTime())) {
      date = parsedDate;
      detectedUnit = "milliseconds";
    }
  }

  if (!date || isNaN(date.getTime())) {
    return {
      isValid: false,
      error: "Unable to parse timestamp or date. Please enter a valid Unix epoch, ISO 8601, or RFC 2822 date string.",
      date: new Date(NaN),
      epochSeconds: 0,
      epochMilliseconds: 0,
      epochMicroseconds: "0",
      epochNanoseconds: "0",
      iso8601: "",
      iso8601Local: "",
      utcString: "",
      localString: "",
      sqlTimestamp: "",
      excelSerial: 0,
      relativeTime: "",
      dayOfWeek: "",
      dayOfYear: 0,
      weekOfYear: 0,
      isLeapYear: false,
      detectedUnit: "seconds",
      timezones: [],
    };
  }

  const ms = date.getTime();
  const sec = Math.floor(ms / 1000);
  const micro = (BigInt(ms) * 1000n).toString();
  const nano = (BigInt(ms) * 1000000n).toString();
  const year = date.getUTCFullYear();

  return {
    isValid: true,
    date,
    epochSeconds: sec,
    epochMilliseconds: ms,
    epochMicroseconds: micro,
    epochNanoseconds: nano,
    iso8601: date.toISOString(),
    iso8601Local: getLocalISOString(date),
    utcString: date.toUTCString(),
    localString: date.toLocaleString(),
    sqlTimestamp: dateToSqlTimestamp(date, true),
    excelSerial: dateToExcelSerial(date),
    relativeTime: formatRelativeTime(ms, options.nowMs),
    dayOfWeek: date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
    dayOfYear: getDayOfYear(date),
    weekOfYear: getISOWeek(date),
    isLeapYear: isLeapYear(year),
    detectedUnit,
    timezones: formatWorldTimezones(date),
  };
}

/**
 * Converts a human date breakdown (year, month, day, hour, minute, second, tz) to Epoch.
 */
export function customDateToTimestamp(parts: {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hours?: number;
  minutes?: number;
  seconds?: number;
  isUtc?: boolean;
}): DetailedTimestampResult {
  const { year, month, day, hours = 0, minutes = 0, seconds = 0, isUtc = true } = parts;

  let date: Date;
  if (isUtc) {
    date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
  } else {
    date = new Date(year, month - 1, day, hours, minutes, seconds);
  }

  return parseTimestamp(date.getTime(), { unit: "milliseconds" });
}

/**
 * Batch parses a multi-line string of timestamps or dates.
 */
export function parseBatchTimestamps(rawText: string): BatchConversionItem[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const res = parseTimestamp(line);
    if (!res.isValid) {
      return {
        input: line,
        isValid: false,
        error: res.error,
      };
    }
    return {
      input: line,
      isValid: true,
      epochSeconds: res.epochSeconds,
      utc: res.utcString,
      local: res.localString,
      relative: res.relativeTime,
    };
  });
}

/**
 * Generates copy-paste ready developer code snippets in 9 programming languages.
 */
export function generateCodeSnippets(epochSeconds: number): Record<string, { current: string; parse: string }> {
  return {
    javascript: {
      current: `// Get current Unix timestamp in seconds\nconst timestamp = Math.floor(Date.now() / 1000);`,
      parse: `// Parse Unix timestamp to Date\nconst date = new Date(${epochSeconds} * 1000);\nconsole.log(date.toISOString());`,
    },
    python: {
      current: `# Get current Unix timestamp\nimport time\ntimestamp = int(time.time())`,
      parse: `# Parse Unix timestamp\nfrom datetime import datetime, timezone\ndt = datetime.fromtimestamp(${epochSeconds}, tz=timezone.utc)\nprint(dt.isoformat())`,
    },
    java: {
      current: `// Get current Unix timestamp\nlong timestamp = java.time.Instant.now().getEpochSecond();`,
      parse: `// Parse Unix timestamp\njava.time.Instant instant = java.time.Instant.ofEpochSecond(${epochSeconds}L);\nSystem.out.println(instant.toString());`,
    },
    go: {
      current: `// Get current Unix timestamp\nimport "time"\ntimestamp := time.Now().Unix()`,
      parse: `// Parse Unix timestamp\nimport "time"\ntm := time.Unix(${epochSeconds}, 0).UTC()\nprintln(tm.Format(time.RFC3339))`,
    },
    csharp: {
      current: `// Get current Unix timestamp\nlong timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();`,
      parse: `// Parse Unix timestamp\nDateTimeOffset dto = DateTimeOffset.FromUnixTimeSeconds(${epochSeconds});\nConsole.WriteLine(dto.ToString("o"));`,
    },
    php: {
      current: `// Get current Unix timestamp\n$timestamp = time();`,
      parse: `// Parse Unix timestamp\n$date = gmdate("Y-m-d H:i:s", ${epochSeconds});\necho $date;`,
    },
    rust: {
      current: `// Get current Unix timestamp\nuse std::time::{SystemTime, UNIX_EPOCH};\nlet timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();`,
      parse: `// Parse Unix timestamp (with chrono crate)\nuse chrono::{DateTime, Utc};\nlet dt = DateTime::<Utc>::from_timestamp(${epochSeconds}, 0).unwrap();\nprintln!("{}", dt.to_rfc3339());`,
    },
    sql: {
      current: `-- Current Unix Timestamp\nSELECT EXTRACT(EPOCH FROM NOW()); -- PostgreSQL\nSELECT UNIX_TIMESTAMP();          -- MySQL\nSELECT unixepoch();               -- SQLite`,
      parse: `-- Convert Unix timestamp to Timestamp\nSELECT TO_TIMESTAMP(${epochSeconds});         -- PostgreSQL\nSELECT FROM_UNIXTIME(${epochSeconds});       -- MySQL\nSELECT datetime(${epochSeconds}, 'unixepoch'); -- SQLite`,
    },
  };
}
