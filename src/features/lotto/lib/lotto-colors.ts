export const LOTTO_COLORS = {
  yellow: "#fbc400", // 1-10
  blue: "#69c8f2", // 11-20
  red: "#ff7272", // 21-30
  gray: "#aaa", // 31-40
  green: "#b0d840", // 41-45
} as const;

export function getLottoBallColor(num: number): string {
  if (num <= 10) return LOTTO_COLORS.yellow;
  if (num <= 20) return LOTTO_COLORS.blue;
  if (num <= 30) return LOTTO_COLORS.red;
  if (num <= 40) return LOTTO_COLORS.gray;
  return LOTTO_COLORS.green;
}
