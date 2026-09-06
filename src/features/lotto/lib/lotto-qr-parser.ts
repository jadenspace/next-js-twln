import { QrParsedData, QrParsedGame, GameLabel } from "../types/qr.types";

const GAME_LABELS: GameLabel[] = ["A", "B", "C", "D", "E"];

/**
 * 동행복권 로또 6/45 QR 코드 URL 또는 파라미터 문자열을 파싱합니다.
 *
 * 지원 형식:
 * 1. 전체 URL: https://m.dhlottery.co.kr/qr.do?method=winQr&v=1100m010203040506q070809101112...
 * 2. 간이 URL: http://m.dhlottery.co.kr/?v=1100m...
 * 3. 파라미터 문자열: v=1100m... 또는 1100m010203040506...
 */
export function parseLottoQrUrl(input: string): QrParsedData {
  if (!input || typeof input !== "string") {
    throw new Error("QR 코드 데이터가 비어 있습니다.");
  }

  const trimmed = input.trim();
  let vParam = "";

  // 1. URL에서 v 파라미터 추출
  if (trimmed.includes("v=")) {
    try {
      const match = trimmed.match(/[?&]v=([^&]+)/);
      if (match && match[1]) {
        vParam = decodeURIComponent(match[1]);
      } else {
        const directMatch = trimmed.match(/^v=([^\s&]+)/);
        if (directMatch && directMatch[1]) {
          vParam = decodeURIComponent(directMatch[1]);
        }
      }
    } catch {
      // URL 파싱 실패 시 아래 문자열 직접 처리로 fallback
    }
  }

  // 2. v= 로 시작하지 않지만 4자리 숫자+알파벳 형식으로 시작하는 원시 파라미터 값인 경우
  if (!vParam) {
    // 4자리 숫자로 시작하는지 확인
    if (/^\d{4}[a-zA-Z]/.test(trimmed)) {
      vParam = trimmed;
    }
  }

  if (!vParam) {
    throw new Error(
      "올바른 동행복권 로또 QR 코드 형식이 아닙니다. (예: https://m.dhlottery.co.kr/qr.do?method=winQr&v=...)",
    );
  }

  // 3. 회차 번호 추출 (앞 4자리)
  const drawNoStr = vParam.substring(0, 4);
  const drawNo = parseInt(drawNoStr, 10);
  if (isNaN(drawNo) || drawNo <= 0) {
    throw new Error(`유효하지 않은 로또 회차 번호입니다: ${drawNoStr}`);
  }

  // 4. 게임 데이터 분리 (예: m010203040506q070809101112...)
  const rest = vParam.substring(4);
  const games: QrParsedGame[] = [];

  // 각 게임은 [구분 알파벳 1글자] + [12자리 번호] 로 구성됨
  // 정규식을 통해 [a-zA-Z](\d{12}) 패턴 매칭
  const gameRegex = /([a-zA-Z])(\d{12})/g;
  let match: RegExpExecArray | null;
  let gameIndex = 0;

  while (
    (match = gameRegex.exec(rest)) !== null &&
    gameIndex < GAME_LABELS.length
  ) {
    const rawNumberStr = match[2];
    const numbers: number[] = [];

    for (let i = 0; i < 12; i += 2) {
      const num = parseInt(rawNumberStr.substring(i, i + 2), 10);
      if (isNaN(num) || num < 1 || num > 45) {
        throw new Error(
          `로또 번호는 1부터 45 사이여야 합니다: ${rawNumberStr.substring(i, i + 2)}`,
        );
      }
      numbers.push(num);
    }

    // 오름차순 정렬
    numbers.sort((a, b) => a - b);

    // 6개 번호 중복 확인
    const uniqueNumbers = new Set(numbers);
    if (uniqueNumbers.size !== 6) {
      throw new Error("한 게임 내에 중복된 로또 번호가 존재합니다.");
    }

    games.push({
      label: GAME_LABELS[gameIndex],
      numbers,
    });

    gameIndex++;
  }

  if (games.length === 0) {
    throw new Error(
      "QR 코드에서 게임 번호를 추출할 수 없습니다. 형식을 확인해주세요.",
    );
  }

  return {
    drawNo,
    games,
    rawUrl: input,
  };
}
