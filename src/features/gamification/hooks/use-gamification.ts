import { useQuery } from "@tanstack/react-query";
import { gamificationApi } from "../api/gamification-api";

export const useGamification = (userId?: string) => {
  const profileQuery = useQuery({
    queryKey: ["gamification", "profile", userId],
    queryFn: () => (userId ? gamificationApi.getProfile(userId) : null),
    enabled: !!userId,
  });

  const badgesQuery = useQuery({
    queryKey: ["gamification", "badges", userId],
    queryFn: () => (userId ? gamificationApi.getUserBadges(userId) : []),
    enabled: !!userId,
  });

  return {
    profile: profileQuery.data,
    badges: badgesQuery.data,
    isLoading: profileQuery.isLoading || badgesQuery.isLoading,
    refresh: () => {
      profileQuery.refetch();
      badgesQuery.refetch();
    },
  };
};
