"use client";

import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { adminApi } from "@/features/auth/api/admin-api";
import { useQuery } from "@tanstack/react-query";
import { UserManagement } from "./components/user-management";
import { PaymentManagement } from "./components/payment-management";
import { PointManagement } from "./components/point-management";
import { ReportManagement } from "./components/report-management";
import { Button } from "@/shared/ui/button";
import {
  Loader2,
  Users,
  CreditCard,
  Coins,
  LayoutDashboard,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type AdminTab = "overview" | "users" | "payments" | "points" | "reports";

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  // Check if admin
  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ["admin", "is-admin", user?.email],
    queryFn: () => {
      if (!user?.email) return false;
      return adminApi.isUserAdmin(user.email);
    },
    enabled: !!user?.email,
  });

  if (adminLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 border rounded-xl shadow-sm bg-card">
          <h1 className="text-2xl font-bold mb-2">접근 권한이 없습니다</h1>
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
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r bg-muted/20 p-6 space-y-2 hidden md:block">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-6 px-2">
          관리 시스템
        </h2>

        <NavButton
          active={activeTab === "users"}
          onClick={() => setActiveTab("users")}
          icon={<Users className="w-4 h-4" />}
          label="사용자 승인"
        />
        <NavButton
          active={activeTab === "payments"}
          onClick={() => setActiveTab("payments")}
          icon={<CreditCard className="w-4 h-4" />}
          label="결제 관리"
        />
        <NavButton
          active={activeTab === "points"}
          onClick={() => setActiveTab("points")}
          icon={<Coins className="w-4 h-4" />}
          label="포인트 관리"
        />
        <NavButton
          active={activeTab === "reports"}
          onClick={() => setActiveTab("reports")}
          icon={<FileText className="w-4 h-4" />}
          label="리포트 관리"
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center border-b pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {activeTab === "users" && "사용자 승인 관리"}
                {activeTab === "payments" && "결제 요청 관리"}
                {activeTab === "points" && "포인트 수동 관리"}
                {activeTab === "reports" && "주간 리포트 관리"}
              </h1>
              <p className="text-muted-foreground mt-1">
                시스템의 중요한 설정 및 데이터를 관리합니다.
              </p>
            </div>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
        "w-full justify-start gap-3",
        active && "bg-secondary font-bold",
      )}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
  );
}
