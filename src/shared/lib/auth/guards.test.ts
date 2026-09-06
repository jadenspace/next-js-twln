import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSupabaseMock } from "@/test-utils/supabase-mock";

let sessionUser: {
  id: string;
  email?: string;
  email_confirmed_at?: string;
} | null;
let adminTables: Record<string, unknown>;

vi.mock("@/shared/lib/supabase/server", () => ({
  createClient: async () => createSupabaseMock({ user: sessionUser }).client,
}));

vi.mock("@/shared/lib/supabase/admin", () => ({
  createAdminClient: () => createSupabaseMock({ tables: adminTables }).client,
}));

import {
  isAdminEmail,
  requireAdmin,
  requireUser,
  requireVerifiedUser,
} from "./guards";

const verifiedUser = {
  id: "user-1",
  email: "u@example.com",
  email_confirmed_at: "2026-01-01T00:00:00Z",
};

describe("requireUser — 승인 취소(정지) 강제", () => {
  beforeEach(() => {
    sessionUser = verifiedUser;
    adminTables = {};
  });

  it("approved_users 에 is_active=false 행이 있으면 403 으로 거부한다", async () => {
    adminTables = {
      approved_users: { data: { is_active: false }, error: null },
    };
    const guard = await requireUser();
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.response.status).toBe(403);
  });

  it("approved_users 행이 없으면(아직 자동 승인 전) 통과시킨다", async () => {
    adminTables = { approved_users: { data: null, error: null } };
    const guard = await requireUser();
    expect(guard.ok).toBe(true);
  });

  it("is_active=true 면 통과시킨다", async () => {
    adminTables = {
      approved_users: { data: { is_active: true }, error: null },
    };
    const guard = await requireUser();
    expect(guard.ok).toBe(true);
  });

  it("세션이 없으면 401", async () => {
    sessionUser = null;
    const guard = await requireUser();
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.response.status).toBe(401);
  });
});

describe("requireVerifiedUser", () => {
  beforeEach(() => {
    adminTables = { approved_users: { data: null, error: null } };
  });

  it("이메일 미인증이면 403", async () => {
    sessionUser = { id: "user-2", email: "x@example.com" };
    const guard = await requireVerifiedUser();
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.response.status).toBe(403);
  });

  it("정지된 사용자는 이메일 인증이 되어 있어도 403", async () => {
    sessionUser = verifiedUser;
    adminTables = {
      approved_users: { data: { is_active: false }, error: null },
    };
    const guard = await requireVerifiedUser();
    expect(guard.ok).toBe(false);
  });
});

describe("isAdminEmail / requireAdmin", () => {
  beforeEach(() => {
    sessionUser = verifiedUser;
  });

  it("admin_users 에 활성 행이 있으면 관리자다", async () => {
    adminTables = {
      approved_users: { data: null, error: null },
      admin_users: { data: { id: "a1" }, error: null },
    };
    expect(await isAdminEmail("u@example.com")).toBe(true);
    const guard = await requireAdmin();
    expect(guard.ok).toBe(true);
  });

  it("admin_users 에 없으면 관리자가 아니고 requireAdmin 은 403", async () => {
    adminTables = {
      approved_users: { data: null, error: null },
      admin_users: { data: null, error: null },
    };
    expect(await isAdminEmail("u@example.com")).toBe(false);
    const guard = await requireAdmin();
    expect(guard.ok).toBe(false);
    if (!guard.ok) expect(guard.response.status).toBe(403);
  });
});
