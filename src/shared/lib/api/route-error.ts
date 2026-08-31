import { NextResponse } from "next/server";
import { isServiceUnavailable } from "@/shared/lib/service-status";

/**
 * Supabase 쿼리 결과의 error 객체를 HTTP 응답으로 변환한다.
 * 장애성 오류(프로젝트 정지, 네트워크, 타임아웃)는 503으로 구분해
 * 클라이언트가 "서버 버그(500)"와 "일시 장애(503)"를 다르게 처리할 수 있게 한다.
 */
export function supabaseErrorResponse(error: { message: string }) {
  if (isServiceUnavailable(error)) {
    return NextResponse.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
  return NextResponse.json({ error: error.message }, { status: 500 });
}

/** 라우트 최상위 catch 블록용 — 예기치 못한 throw 를 JSON 응답으로 변환한다. */
export function unexpectedErrorResponse(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
  if (isServiceUnavailable(error)) {
    return NextResponse.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
