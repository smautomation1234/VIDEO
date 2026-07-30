export const SCRATCH_DURATION_OPTIONS = [
  10,
  20,
  30,
  40,
  50,
  60,
  70,
  80,
  90,
] as const;

export function isScratchDuration(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= SCRATCH_DURATION_OPTIONS[0] &&
    value <= SCRATCH_DURATION_OPTIONS[SCRATCH_DURATION_OPTIONS.length - 1] &&
    value % 10 === 0
  );
}
