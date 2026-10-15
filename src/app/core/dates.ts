const MONTHS: ReadonlyArray<readonly [number, readonly string[]]> = [
  [1, ['janvier', 'jan']],
  [2, ['fevrier', 'février', 'feb']],
  [3, ['mars', 'mar']],
  [4, ['avril', 'avr', 'apr']],
  [5, ['mai', 'may']],
  [6, ['juin', 'jun']],
  [7, ['juillet', 'jul']],
  [8, ['aout', 'août', 'aug']],
  [9, ['septembre', 'sept', 'sep']],
  [10, ['octobre', 'oct']],
  [11, ['novembre', 'nov']],
  [12, ['decembre', 'décembre', 'dec', 'dez']],
];

export function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function yearOf(date: string): number | null {
  const match = date.match(/\b(19|20)\d{2}\b/);
  return match ? Number.parseInt(match[0], 10) : null;
}

export function monthOf(date: string): number | null {
  if (!date) return null;
  const lower = date.toLowerCase();
  const plain = fold(lower);
  for (const [month, aliases] of MONTHS) {
    for (const alias of aliases) {
      const needle = alias.toLowerCase();
      if (lower.includes(needle) || plain.includes(fold(needle))) return month;
    }
  }
  const numeric = plain.match(/(?:^|\D)(0?[1-9]|1[0-2])(?:\D|$)/);
  if (!numeric) return null;
  const month = Number.parseInt(numeric[1], 10);
  return month >= 1 && month <= 12 ? month : null;
}

export function lastName(value: string): string {
  const parts = value.trim().split(/\s+/);
  return parts.length ? parts[parts.length - 1].toLowerCase() : '';
}

/** Nom de famille du premier auteur : « Nick SRNICEK et Alex WILLIAMS » se classe à Srnicek. */
export function surnameKey(value: string): string {
  const withoutNotes = value.replace(/\([^)]*\)/g, ' ');
  const first = withoutNotes.split(/,|\s+(?:et|and|&)\s+/i).find((part) => part.trim()) ?? '';
  return lastName(first.replace(/\./g, ' '));
}

export function surnameInitial(value: string): string {
  const letter = fold(surnameKey(value)).replace(/[^a-z]/g, '').charAt(0).toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : '#';
}

export function compareFr(a: string, b: string): number {
  return a.localeCompare(b, 'fr', { sensitivity: 'base' });
}
