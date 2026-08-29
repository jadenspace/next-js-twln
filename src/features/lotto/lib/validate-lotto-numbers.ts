/**
 * 로또 번호 입력 검증: 1~45 범위의 서로 다른 정수 6개인지 확인합니다.
 */
export function validateLottoNumbers(input: unknown): input is number[] {
  return (
    Array.isArray(input) &&
    input.length === 6 &&
    input.every(
      (n) => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 45,
    ) &&
    new Set(input).size === 6
  );
}
