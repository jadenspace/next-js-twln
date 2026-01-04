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
    <div className="container max-w-5xl py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">포인트 충전</h1>
        <p className="text-muted-foreground">
          원하시는 포인트 패키지를 선택해주세요. 무통장 입금으로 결제가
          진행됩니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {pointPackages?.map((pkg) => (
          <Card key={pkg.id} className="flex flex-col relative overflow-hidden">
            {pkg.bonus_points > 0 && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-bl-lg font-bold">
                +{pkg.bonus_points.toLocaleString()}P 보너스
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{pkg.name}</CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold text-foreground">
                  {pkg.price.toLocaleString()}
                </span>
                <span className="text-sm ml-1">원</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 text-center flex flex-col items-center justify-center gap-2 py-4">
              <div className="p-3 bg-secondary/30 rounded-full">
                <Coins className="w-8 h-8 text-primary" />
              </div>
              <div className="text-lg font-medium">
                {(pkg.points + pkg.bonus_points).toLocaleString()} P
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => setSelectedPackage(pkg)}
              >
                선택하기
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button variant="link" onClick={() => router.push("/payments")}>
          결제 내역 확인하기
        </Button>
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
