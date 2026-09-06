import { describe, expect, it } from "vitest";
import { isAuthorizedCronRequest } from "./cron";

describe("isAuthorizedCronRequest", () => {
  it("CRON_SECRET 이 설정되지 않았으면 어떤 요청도 허용하지 않는다", () => {
    expect(isAuthorizedCronRequest("Bearer abc", undefined)).toBe(false);
    expect(isAuthorizedCronRequest("Bearer abc", "")).toBe(false);
  });

  it("Authorization 헤더가 없으면 거부한다", () => {
    expect(isAuthorizedCronRequest(null, "abc")).toBe(false);
  });

  it("토큰이 다르면 거부한다", () => {
    expect(isAuthorizedCronRequest("Bearer wrong", "abc")).toBe(false);
  });

  it("Bearer 스킴이 아니면 거부한다", () => {
    expect(isAuthorizedCronRequest("abc", "abc")).toBe(false);
  });

  it("Bearer <CRON_SECRET> 이면 허용한다", () => {
    expect(isAuthorizedCronRequest("Bearer abc", "abc")).toBe(true);
  });
});
