/**
 * Supabase 장애(무료 티어 일시 정지, 네트워크 단절, 타임아웃) 판별 유틸.
 * 서버 라우트와 클라이언트 컴포넌트 양쪽에서 사용한다.
 */
export class ServiceUnavailableError extends Error {
  constructor(message = "일시적으로 서비스에 연결할 수 없습니다.") {
    super(message);
    this.name = "ServiceUnavailableError";
  }
}

export function isServiceUnavailable(error: unknown): boolean {
  if (!error) return false;

  const e = error as {
    name?: string;
    message?: string;
    status?: number;
  };

  if (e.name === "ServiceUnavailableError") return true;
  // supabase auth-js 는 네트워크/5xx 실패를 AuthRetryableFetchError 로 감싼다.
  if (e.name === "AuthRetryableFetchError") return true;
  // AbortSignal.timeout 이 만든 중단
  if (e.name === "TimeoutError" || e.name === "AbortError") return true;
  // postgrest-js 는 네트워크 실패를 status 0 으로, Supabase 게이트웨이는 5xx 로 반환한다.
  if (typeof e.status === "number" && (e.status === 0 || e.status >= 500)) {
    return true;
  }

  const msg = typeof e.message === "string" ? e.message : "";
  // postgrest-js 는 fetch 거부를 "TypeError: fetch failed" 류 메시지로 감싼다.
  return (
    msg.includes("fetch failed") ||
    msg.includes("Failed to fetch") ||
    msg.includes("FetchError") ||
    msg.includes("Load failed") ||
    msg.includes("NetworkError") ||
    msg.includes("TimeoutError") ||
    msg.includes("AbortError")
  );
}
