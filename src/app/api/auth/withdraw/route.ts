import { createClient } from "@/shared/lib/supabase/server";
import { createAdminClient } from "@/shared/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // 1. Check current user session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const userEmail = user.email;

    // 2. Use Admin Client to delete user
    const adminSupabase = createAdminClient();

    // 2-1. Archive user info and points before deletion
    try {
      // Get current points
      const { data: userPoints } = await adminSupabase
        .from("user_points")
        .select("balance")
        .eq("user_id", userId)
        .single();

      const currentBalance = userPoints?.balance || 0;

      // Insert into log
      const { error: archiveError } = await adminSupabase
        .from("withdrawn_users_log")
        .insert({
          original_user_id: userId,
          email: userEmail,
          final_point_balance: currentBalance,
          // client_ip, user_agent could be added if needed from headers
        });

      if (archiveError) {
        console.error("Failed to archive withdrawn user:", archiveError);
        // Continue with deletion even if archive fails, or choose to stop
      }
    } catch (archiveErr) {
      console.error("Error during user archival:", archiveErr);
    }

    // Delete from approved_users if email exists
    if (userEmail) {
      const { error: approvedUserDeleteError } = await adminSupabase
        .from("approved_users")
        .delete()
        .eq("email", userEmail);

      if (approvedUserDeleteError) {
        console.error(
          "Error deleting approved user record:",
          approvedUserDeleteError,
        );
      }
    }

    // Explicitly delete from user_profiles first (safe fallback if no cascade)
    const { error: profileDeleteError } = await adminSupabase
      .from("user_profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.error("Error deleting user profile:", profileDeleteError);
      // We continue to delete the auth user even if profile delete fails
      // or maybe we should stop? usually better to proceed or log it.
    }

    // This will typically trigger cascade delete on related tables if configured in DB
    const { error: deleteError } =
      await adminSupabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete user account" },
        { status: 500 },
      );
    }

    // 3. Sign out the user from the current session
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
