export function weeklyChangeKg(
  currentKg: number,
  targetKg: number,
  weeks: number,
): number | null {
  if (!currentKg || !targetKg || !weeks) return null;
  return Math.round(((targetKg - currentKg) / weeks) * 10) / 10;
}

export function paceLabel(weeklyKg: number | null): string | null {
  if (weeklyKg == null || weeklyKg === 0) return null;
  const abs = Math.abs(weeklyKg).toFixed(1);
  if (weeklyKg < 0) return `About ${abs} kg per week of loss`;
  return `About ${abs} kg per week of gain`;
}
