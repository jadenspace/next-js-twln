import { TypeSafeClient, choice, noul, score } from "@typesafe-ai/sdk";

let cachedClient: TypeSafeClient | null = null;
let cachedKey: string | null = null;

/**
 * 환경변수(`TYPESAFE_API_KEY` 또는 `TYPESAFE_AI_API_KEY`)에서 API 키를 읽어
 * Jev(`@typesafe-ai/sdk`) 클라이언트를 반환한다.
 * 키가 설정되지 않은 환경(테스트 등)에서는 `null`을 반환해 호출부에서 안전하게 폴백할 수 있게 한다.
 */
export function getJevClient(): TypeSafeClient | null {
  const apiKey =
    process.env.TYPESAFE_API_KEY?.trim() ||
    process.env.TYPESAFE_AI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  if (!cachedClient || cachedKey !== apiKey) {
    cachedClient = new TypeSafeClient({
      apiKey,
      timeout: 8000,
      retry: { maxRetries: 1 },
    });
    cachedKey = apiKey;
  }

  return cachedClient;
}

export { choice, noul, score };
