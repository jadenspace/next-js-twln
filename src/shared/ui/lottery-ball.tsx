import { cn } from "@/shared/lib/utils";

/** 동행복권 공 색상 구간: 1-10 노랑, 11-20 파랑, 21-30 빨강, 31-40 회색, 41-45 초록 */
function getBallTone(num: number) {
  if (num <= 10) return "yellow";
  if (num <= 20) return "blue";
  if (num <= 30) return "red";
  if (num <= 40) return "gray";
  return "green";
}

const FILLED: Record<ReturnType<typeof getBallTone>, string> = {
  yellow: "bg-yellow-500",
  blue: "bg-blue-500",
  red: "bg-red-500",
  gray: "bg-gray-500",
  green: "bg-green-500",
};

const OUTLINED: Record<ReturnType<typeof getBallTone>, string> = {
  yellow: "border-yellow-500 text-yellow-500",
  blue: "border-blue-500 text-blue-500",
  red: "border-red-500 text-red-500",
  gray: "border-gray-500 text-gray-500",
  green: "border-green-500 text-green-500",
};

const SIZE = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
} as const;

interface LotteryBallProps {
  number: number;
  className?: string;
  size?: keyof typeof SIZE;
  /** 검색 조건이나 내 번호와 일치해 강조할 때 */
  highlighted?: boolean;
  /** 강조 대상이 따로 있어 상대적으로 흐리게 보일 때 */
  dimmed?: boolean;
}

export function LotteryBall({
  number,
  className,
  size = "md",
  highlighted = false,
  dimmed = false,
}: LotteryBallProps) {
  return (
    <div
      role="img"
      aria-label={`${number}번`}
      className={cn(
        "rounded-full flex items-center justify-center text-white font-bold shadow-md",
        SIZE[size],
        FILLED[getBallTone(number)],
        highlighted &&
          "ring-2 ring-offset-2 ring-primary ring-offset-background",
        dimmed && "opacity-40",
        className,
      )}
    >
      {number}
    </div>
  );
}

/** 보너스 번호. 채운 공과 구분되도록 테두리만 그린다. */
export function BonusLotteryBall({
  number,
  className,
  size = "md",
  highlighted = false,
  dimmed = false,
}: LotteryBallProps) {
  return (
    <div
      role="img"
      aria-label={`보너스 ${number}번`}
      className={cn(
        "rounded-full bg-transparent border-2 flex items-center justify-center font-bold",
        SIZE[size],
        OUTLINED[getBallTone(number)],
        highlighted &&
          "ring-2 ring-offset-2 ring-primary ring-offset-background",
        dimmed && "opacity-40",
        className,
      )}
    >
      {number}
    </div>
  );
}
