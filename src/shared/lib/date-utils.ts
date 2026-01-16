/**
 * 현재 시간을 한국 표준시(KST, UTC+9) 기준으로 YYYY-MM-DD 형식의 문자열로 반환합니다.
 */
export function getKstDateString(date = new Date()): string {
  // Intl.DateTimeFormat을 사용하여 명시적으로 Asia/Seoul 시간대의 날짜를 가져옵니다.
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}
