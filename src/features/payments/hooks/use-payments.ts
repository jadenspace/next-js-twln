import { useQuery } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments-api";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useState } from "react";

export function usePaymentHistory() {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const LIMIT = 10;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["paymentHistory", user?.id, page],
    queryFn: () =>
      user ? paymentsApi.getPaymentHistory(user.id, LIMIT, page * LIMIT) : null,
    enabled: !!user,
  });

  return {
    payments: data?.data || [],
    totalCount: data?.count || 0,
    isLoading,
    page,
    setPage,
    LIMIT,
    refetch,
  };
}
