/**
 * Supabase 요청에 타임아웃을 강제하는 fetch 래퍼.
 * 무료 티어 프로젝트가 응답 없이 hang 하면 전체 라우트가 플랫폼 한계(~25초)까지
 * 잠기던 문제를 여기서 차단한다.
 */
export function createGuardedFetch(
  timeoutMs: number,
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  return (input, init = {}) => {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal =
      init.signal && typeof AbortSignal.any === "function"
        ? AbortSignal.any([init.signal, timeoutSignal])
        : timeoutSignal;

    return fetch(input, { ...init, signal });
  };
}
