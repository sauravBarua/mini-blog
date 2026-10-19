const formatter = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' });

export function formatDate(iso: string): string {
  return formatter.format(new Date(iso));
}
