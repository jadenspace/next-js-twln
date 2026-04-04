"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/features/auth/api/admin-api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";
import {
  Coins,
  CreditCard,
  FileText,
  Loader2,
  TableProperties,
  Users,
} from "lucide-react";
import { DrawTrendManagement } from "./components/draw-trend-management";
import { PaymentManagement } from "./components/payment-management";
import { PointManagement } from "./components/point-management";
import { ReportManagement } from "./components/report-management";
import { UserManagement } from "./components/user-management";

type AdminTab = "users" | "payments" | "points" | "reports" | "draw-trends";

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("draw-trends");

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ["admin", "is-admin", user?.email],
    queryFn: () => {
      if (!user?.email) return false;
      return adminApi.isUserAdmin(user.email);
    },
    enabled: !!user?.email,
  });

  if (adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <h1 className="mb-2 text-2xl font-bold">관리자 권한이 없습니다.</h1>
          <p className="text-muted-foreground">
            이 페이지는 관리자만 접근할 수 있습니다.
          </p>
          <Button className="mt-6" onClick={() => (window.location.href = "/")}>
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden w-64 space-y-2 border-r bg-muted/20 p-6 md:block">
        <h2 className="mb-6 px-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          관리자 메뉴
        </h2>

        <NavButton
          active={activeTab === "draw-trends"}
          onClick={() => setActiveTab("draw-trends")}
          icon={<TableProperties className="h-4 w-4" />}
          label="당첨번호 추이분석"
        />
        <NavButton
          active={activeTab === "users"}
          onClick={() => setActiveTab("users")}
          icon={<Users className="h-4 w-4" />}
          label="사용자 관리"
        />
        <NavButton
          active={activeTab === "payments"}
          onClick={() => setActiveTab("payments")}
          icon={<CreditCard className="h-4 w-4" />}
          label="결제 관리"
        />
        <NavButton
          active={activeTab === "points"}
          onClick={() => setActiveTab("points")}
          icon={<Coins className="h-4 w-4" />}
          label="포인트 관리"
        />
        <NavButton
          active={activeTab === "reports"}
          onClick={() => setActiveTab("reports")}
          icon={<FileText className="h-4 w-4" />}
          label="리포트 관리"
        />
      </aside>

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
            <NavButton
              active={activeTab === "draw-trends"}
              onClick={() => setActiveTab("draw-trends")}
              icon={<TableProperties className="h-4 w-4" />}
              label="추이분석"
            />
            <NavButton
              active={activeTab === "users"}
              onClick={() => setActiveTab("users")}
              icon={<Users className="h-4 w-4" />}
              label="사용자"
            />
            <NavButton
              active={activeTab === "payments"}
              onClick={() => setActiveTab("payments")}
              icon={<CreditCard className="h-4 w-4" />}
              label="결제"
            />
            <NavButton
              active={activeTab === "points"}
              onClick={() => setActiveTab("points")}
              icon={<Coins className="h-4 w-4" />}
              label="포인트"
            />
            <NavButton
              active={activeTab === "reports"}
              onClick={() => setActiveTab("reports")}
              icon={<FileText className="h-4 w-4" />}
              label="리포트"
            />
          </div>

          <div className="border-b pb-6">
            <h1 className="text-3xl font-bold tracking-tight">
              {activeTab === "draw-trends" && "당첨번호 추이분석"}
              {activeTab === "users" && "사용자 관리"}
              {activeTab === "payments" && "결제 요청 관리"}
              {activeTab === "points" && "포인트 변동 관리"}
              {activeTab === "reports" && "주간 리포트 관리"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              운영 데이터와 관리자 기능을 한 화면에서 관리합니다.
            </p>
          </div>

          <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
            {activeTab === "draw-trends" && <DrawTrendManagement />}
            {activeTab === "users" && <UserManagement />}
            {activeTab === "payments" && <PaymentManagement />}
            {activeTab === "points" && <PointManagement />}
            {activeTab === "reports" && <ReportManagement />}
          </div>
        </div>
      </main>
    </div>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className={cn(
        "w-auto shrink-0 justify-start gap-3 md:w-full",
        active && "bg-secondary font-bold",
      )}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}
