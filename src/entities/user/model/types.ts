import { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserState {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
}
