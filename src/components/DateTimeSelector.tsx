import React from 'react';

interface DateTimeSelectorProps {
  dateTimeStr: string;
  onChange: (value: string) => void;
}

interface DateTimeParts {
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const SELECT_CLASS_NAME = 'w-full min-w-0 bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 focus:border-indigo-500 rounded-xl px-2.5 py-2 text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500';
const pad = (value: number) => value.toString().padStart(2, '0');

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function parseDateTime(value: string): DateTimeParts {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (match) {
    const [, yearText, monthText, dayText, hourText, minuteText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    const hour = Number(hourText);
    const minute = Number(minuteText);

    if (
      year >= 1 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= daysInMonth(year, month) &&
      hour >= 0 &&
      hour <= 23 &&
      minute >= 0 &&
      minute <= 59
    ) {
      return { year, month, day, hour, minute };
    }
  }

  return { year: 2024, month: 5, day: 15, hour: 12, minute: 0 };
}

export function DateTimeSelector({ dateTimeStr, onChange }: DateTimeSelectorProps) {
  const { day, month, year, hour, minute } = parseDateTime(dateTimeStr);
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: Math.max(currentYear - 1900 + 1, 1) },
    (_, index) => currentYear - index
  );

  if (!years.includes(year)) {
    years.unshift(year);
  }

  const emitChange = (parts: DateTimeParts) => {
    const clampedDay = Math.min(parts.day, daysInMonth(parts.year, parts.month));
    onChange(
      `${parts.year.toString().padStart(4, '0')}-${pad(parts.month)}-${pad(clampedDay)}T${pad(parts.hour)}:${pad(parts.minute)}`
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      <div>
        <label htmlFor="birth-date-day" className="block text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">
          Day
        </label>
        <select
          id="birth-date-day"
          aria-label="Day"
          required
          value={day}
          onChange={(event) => emitChange({ day: Number(event.target.value), month, year, hour, minute })}
          className={SELECT_CLASS_NAME}
        >
          {Array.from({ length: daysInMonth(year, month) }, (_, index) => index + 1).map((value) => (
            <option key={value} value={value}>{pad(value)}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="birth-date-month" className="block text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">
          Month
        </label>
        <select
          id="birth-date-month"
          aria-label="Month"
          required
          value={month}
          onChange={(event) => emitChange({ day, month: Number(event.target.value), year, hour, minute })}
          className={SELECT_CLASS_NAME}
        >
          {MONTHS.map((name, index) => (
            <option key={name} value={index + 1}>{name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="birth-date-year" className="block text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">
          Year
        </label>
        <select
          id="birth-date-year"
          aria-label="Year"
          required
          value={year}
          onChange={(event) => emitChange({ day, month, year: Number(event.target.value), hour, minute })}
          className={SELECT_CLASS_NAME}
        >
          {years.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="birth-date-hour" className="block text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">
          Hour
        </label>
        <select
          id="birth-date-hour"
          aria-label="Hour"
          required
          value={hour}
          onChange={(event) => emitChange({ day, month, year, hour: Number(event.target.value), minute })}
          className={SELECT_CLASS_NAME}
        >
          {Array.from({ length: 24 }, (_, value) => (
            <option key={value} value={value}>{pad(value)}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="birth-date-minute" className="block text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">
          Minute
        </label>
        <select
          id="birth-date-minute"
          aria-label="Minute"
          required
          value={minute}
          onChange={(event) => emitChange({ day, month, year, hour, minute: Number(event.target.value) })}
          className={SELECT_CLASS_NAME}
        >
          {Array.from({ length: 60 }, (_, value) => (
            <option key={value} value={value}>{pad(value)}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
