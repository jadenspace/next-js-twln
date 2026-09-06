/**
 * 금액을 "1,234,567원" 형태로 만든다. BIGINT 컬럼은 문자열로 올 수 있어
 * 문자열·빈 값도 받는다. 브라우저 로케일에 따라 구분 기호가 달라지지 않도록
 * ko-KR 을 고정한다.
 */
export function formatWon(value: string | number | null | undefined): string {
  const n =
    value === null || value === undefined || value === "" ? 0 : Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  return `${safe.toLocaleString("ko-KR")}원`;
}
