export type FestivalEntryType = 'festival' | 'holiday';

export interface FestivalEntry {
  readonly name: string;
  readonly date: string;
  readonly type: FestivalEntryType;
}

export const FESTIVALS_BY_YEAR: Readonly<Record<number, readonly FestivalEntry[]>> = {
  2026: [
    { name: 'Republic Day', date: '2026-01-26', type: 'holiday' },
    { name: 'Makar Sankranti', date: '2026-01-14', type: 'festival' },
    { name: 'Vasant Panchami', date: '2026-01-23', type: 'festival' },
    { name: 'Maha Shivaratri', date: '2026-02-15', type: 'festival' },
    { name: 'Holika Dahan', date: '2026-03-03', type: 'festival' },
    { name: 'Holi', date: '2026-03-04', type: 'festival' },
    { name: 'Rama Navami', date: '2026-03-26', type: 'festival' },
    { name: 'Akshaya Tritiya', date: '2026-04-19', type: 'festival' },
    { name: 'Independence Day', date: '2026-08-15', type: 'holiday' },
    { name: 'Raksha Bandhan', date: '2026-08-28', type: 'festival' },
    { name: 'Janmashtami', date: '2026-09-04', type: 'festival' },
    { name: 'Ganesh Chaturthi', date: '2026-09-14', type: 'festival' },
    { name: 'Navratri Begins', date: '2026-10-11', type: 'festival' },
    { name: 'Gandhi Jayanti', date: '2026-10-02', type: 'holiday' },
    { name: 'Dussehra', date: '2026-10-20', type: 'festival' },
    { name: 'Karva Chauth', date: '2026-10-29', type: 'festival' },
    { name: 'Dhanteras', date: '2026-11-06', type: 'festival' },
    { name: 'Diwali', date: '2026-11-08', type: 'festival' },
    { name: 'Govardhan Puja', date: '2026-11-09', type: 'festival' },
    { name: 'Bhai Dooj', date: '2026-11-11', type: 'festival' },
    { name: 'Chhath Puja', date: '2026-11-15', type: 'festival' },
    { name: 'Guru Nanak Jayanti', date: '2026-11-24', type: 'festival' },
    { name: 'Christmas Day', date: '2026-12-25', type: 'holiday' }
  ]
};

export function getUpcomingFestivals(
  entries: readonly FestivalEntry[],
  today: Date
): FestivalEntry[] {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return entries
    .filter((entry) => new Date(`${entry.date}T00:00:00`).getTime() >= startOfToday)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
}
