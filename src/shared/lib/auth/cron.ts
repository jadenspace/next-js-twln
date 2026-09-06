import { timingSafeEqual } from "node:crypto";

/**
 * Vercel Cron 요청 인증.
 *
 * Vercel 은 프로젝트에 `CRON_SECRET` 환경변수가 있으면 크론 호출마다
 * `Authorization: Bearer <CRON_SECRET>` 헤더를 붙인다. 이전에는 이 검사가 없어
 * `/api/cron/update-lotto` 와 `/api/backfill-lotto` 를 누구나 호출해 service_role
 * 쓰기와 외부 API 호출을 유발할 수 있었다.
 *
 * 시크릿이 설정되지 않았으면(fail closed) 어떤 요청도 통과시키지 않는다.
 * 로컬에서 시험하려면 `.env.local` 에 CRON_SECRET 을 넣고 같은 값을 헤더로 보낼 것.
 */
export function isAuthorizedCronRequest(
  authorizationHeader: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || !authorizationHeader) return false;

  const parts = authorizationHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) return false;

  const provided = Buffer.from(parts[1]);
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(provided, expected);
}

/** 요청 객체와 환경변수로 바로 판정하는 편의 함수. */
export function isAuthorizedCron(request: Request): boolean {
  return isAuthorizedCronRequest(
    request.headers.get("authorization"),
    process.env.CRON_SECRET,
  );
}
