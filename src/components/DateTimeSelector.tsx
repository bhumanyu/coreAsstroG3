import React from 'react';

interface DateTimeSelectorProps {
  dateTimeStr: string;
  onChange: (value: string) => void;
}

/**
 * Collects a local wall-clock value, not a UTC instant.
 * Calendar validity and timezone/DST resolution are handled by the birth domain validator.
 */
export function DateTimeSelector({ dateTimeStr, onChange }: DateTimeSelectorProps) {
  return (
    <input
      type="datetime-local"
      step="1"
      required
      aria-label="Birth date and time"
      value={dateTimeStr}
      onChange={(event) => onChange(event.target.value)}
      className="w-full bg-slate-950 dark:bg-slate-950 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-100 dark:text-slate-100 light:text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
    />
  );
}
