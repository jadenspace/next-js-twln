import { Button } from "@/shared/ui/button";
import { usePoints } from "../hooks/use-points";
import { CreditCard, History } from "lucide-react";
import { useState } from "react";
import { PointHistoryModal } from "./point-history-modal";
import Link from "next/link";

export function PointBalance() {
  const { userPoints, userId, isPointsLoading } = usePoints();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  if (!userId) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-secondary/20 rounded-full border border-border">
          <CreditCard className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">
            {isPointsLoading
              ? "..."
              : (userPoints?.balance?.toLocaleString() ?? 0)}
          </span>
          <span className="text-xs text-muted-foreground">P</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsHistoryOpen(true)}
          title="포인트 내역"
        >
          <History className="w-4 h-4" />
        </Button>

        <Link href="/points/charge">
          <Button size="sm" variant="default" className="h-8 text-xs">
            충전
          </Button>
        </Link>
      </div>

      <PointHistoryModal
        userId={userId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
    </>
  );
}
