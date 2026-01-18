"use client";

import { usePoints } from "@/features/points/hooks/use-points";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Loader2, Coins } from "lucide-react";
import { useState } from "react";
import { PointPackage } from "@/features/points/types";
import { PaymentRequestModal } from "@/features/payments/components/payment-request-modal";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/shared/ui/page-header";

export default function ChargePage() {
  const { pointPackages, isPackagesLoading } = usePoints();
  const [selectedPackage, setSelectedPackage] = useState<PointPackage | null>(
    null,
  );
  const router = useRouter();

  if (isPackagesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-10 px-4 md:px-0">
      <PageHeader
        title="포인트 충전"
        description="원하시는 포인트 패키지를 선택해주세요. 무통장 입금으로 결제가 진행됩니다."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {pointPackages?.map((pkg) => (
          <Card key={pkg.id} className="flex flex-col relative overflow-hidden">
            {pkg.bonus_points > 0 && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-bl-lg font-bold">
                +{pkg.bonus_points.toLocaleString()}P
              </div>
            )}
            <CardHeader className="text-center pb-2 px-3 md:px-6">
              <CardTitle className="text-base md:text-xl">{pkg.name}</CardTitle>
              <CardDescription>
                <span className="text-lg md:text-2xl font-bold text-foreground">
                  {pkg.price.toLocaleString()}
                </span>
                <span className="text-xs md:text-sm ml-0.5 md:ml-1">원</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-center flex flex-col items-center justify-center gap-1 md:gap-2 py-2 md:py-4 px-3 md:px-6">
              <div className="p-2 md:p-3 bg-secondary/30 rounded-full">
                <Coins className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
              <div className="text-sm md:text-lg font-medium">
                {(pkg.points + pkg.bonus_points).toLocaleString()} P
              </div>
            </CardContent>
            <CardFooter className="p-3 md:p-6">
              <Button
                className="w-full text-xs md:text-sm h-9 md:h-10"
                onClick={() => setSelectedPackage(pkg)}
              >
                선택하기
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <PaymentRequestModal
        isOpen={!!selectedPackage}
        onClose={() => setSelectedPackage(null)}
        selectedPackage={selectedPackage}
        onSuccess={() => {
          router.push("/payments"); // Redirect to history on success
        }}
      />
    </div>
  );
}
