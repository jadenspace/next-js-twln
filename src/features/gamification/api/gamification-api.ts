import { createClient } from "@/shared/lib/supabase/client";
import { UserProfile, UserBadge } from "../types";

export const gamificationApi = {
  async getProfile(userId: string): Promise<UserProfile> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, email, level, xp")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data as UserProfile;
  },

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_badges")
      .select(
        `
        badge_id,
        awarded_at,
        badge:badge_id (*)
      `,
      )
      .eq("user_id", userId);

    if (error) throw error;
    return data as any[];
  },
};
