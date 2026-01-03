import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pointsApi } from "../api/points-api";
import { createClient } from "@/shared/lib/supabase/client";
import { useEffect, useState } from "react";

export function usePoints() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  const { data: userPoints, isLoading: isPointsLoading } = useQuery({
    queryKey: ["userPoints", userId],
    queryFn: () => (userId ? pointsApi.getUserPoints(userId) : null),
    enabled: !!userId,
  });

  const { data: pointPackages, isLoading: isPackagesLoading } = useQuery({
    queryKey: ["pointPackages"],
    queryFn: () => pointsApi.getPointPackages(),
  });

  // Helper to refresh points data
  const refreshPoints = () => {
    queryClient.invalidateQueries({ queryKey: ["userPoints"] });
    queryClient.invalidateQueries({ queryKey: ["pointTransactions"] });
  };

  return {
    userPoints,
    pointPackages,
    isPointsLoading,
    isPackagesLoading,
    userId,
    refreshPoints,
  };
}
