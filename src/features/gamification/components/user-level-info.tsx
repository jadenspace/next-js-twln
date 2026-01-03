"use client";

import { useGamification } from "../hooks/use-gamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Trophy, Star, Award } from "lucide-react";

export function UserLevelInfo({ userId }: { userId: string }) {
  const { profile, badges, isLoading } = useGamification(userId);

  if (isLoading || !profile) return null;

  const nextLevelXp = profile.level * 100;
  const progress = (profile.xp / nextLevelXp) * 100;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            레벨 {profile.level}
          </CardTitle>
          <span className="text-xs text-muted-foreground font-medium">
            {profile.xp} / {nextLevelXp} XP
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            다음 레벨까지 {nextLevelXp - profile.xp} XP 남았습니다.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-orange-500" />
            획득한 뱃지 ({badges?.length || 0})
          </h4>
          <div className="flex flex-wrap gap-2">
            {badges && badges.length > 0 ? (
              badges.map((ub) => (
                <div
                  key={ub.badge_id}
                  className="group relative cursor-help"
                  title={ub.badge.description}
                >
                  <div className="p-2 bg-primary/10 rounded-full text-primary hover:bg-primary hover:text-white transition-colors">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                아직 획득한 뱃지가 없습니다.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
