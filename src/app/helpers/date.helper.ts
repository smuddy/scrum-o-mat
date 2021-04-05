export function ISO8601WeekNuber(dt) {
  const tdt = new Date(dt.valueOf());
  const dayNumber = (dt.getDay() + 6) % 7;
  tdt.setDate(tdt.getDate() - dayNumber + 3);
  const firstThursday = tdt.valueOf();
  tdt.setMonth(0, 1);
  if (tdt.getDay() !== 4) {
    tdt.setMonth(0, 1 + ((4 - tdt.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - (tdt as any)) / 604800000);
}
