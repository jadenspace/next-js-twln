export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  criteria_type: string;
  criteria_value: number;
}

export interface UserBadge {
  badge_id: string;
  awarded_at: string;
  badge: Badge;
}

export interface UserProfile {
  id: string;
  email: string;
  level: number;
  xp: number;
}
