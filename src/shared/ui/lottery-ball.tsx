import { cn } from "@/shared/lib/utils";

interface LotteryBallProps {
  number: number;
  className?: string;
}

export function LotteryBall({ number, className }: LotteryBallProps) {
  const getBallColor = (num: number) => {
    if (num <= 10) return "bg-yellow-500";
    if (num <= 20) return "bg-blue-500";
    if (num <= 30) return "bg-red-500";
    if (num <= 40) return "bg-gray-500";
    return "bg-green-500";
  };

  return (
    <div
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md",
        getBallColor(number),
        className,
      )}
    >
      {number}
    </div>
  );
}
