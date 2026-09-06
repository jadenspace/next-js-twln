import { LottoDraw } from "../types";
import {
  QrParsedData,
  QrCheckResult,
  GameCheckResult,
  LottoRank,
} from "../types/qr.types";
import { formatWon } from "./format-won";

/**
 * 파싱된 QR 게임 데이터와 회차 당첨 정보를 비교하여 당첨 결과를 생성합니다.
 */
export function checkLottoQrResult(
  parsed: QrParsedData,
  drawData: LottoDraw | null,
): QrCheckResult {
  // 추첨 데이터가 아직 없거나 발표 전인 경우
  if (!drawData) {
    return {
      drawNo: parsed.drawNo,
      isDrawPending: true,
      games: parsed.games.map((game) => ({
        label: game.label,
        numbers: game.numbers,
        matchedNumbers: [],
        bonusMatched: false,
        matchCount: 0,
        rank: "fail",
        prizeAmount: 0,
        formattedPrize: "추첨 전",
      })),
      totalPrize: 0,
      highestRank: "fail",
      winningGamesCount: 0,
    };
  }

  const winningNumbers = [
    drawData.drwt_no1,
    drawData.drwt_no2,
    drawData.drwt_no3,
    drawData.drwt_no4,
    drawData.drwt_no5,
    drawData.drwt_no6,
  ];
  const winningSet = new Set(winningNumbers);
  const bonusNumber = drawData.bnus_no;

  // 등수별 당첨금 파싱 (기본 고정값 포함)
  const rank1Prize = parseInt(drawData.first_win_amnt || "0", 10) || 0;
  const rank2Prize = parseInt(drawData.rnk2_win_amt || "0", 10) || 0;
  const rank3Prize = parseInt(drawData.rnk3_win_amt || "0", 10) || 0;
  const rank4Prize = parseInt(drawData.rnk4_win_amt || "50000", 10) || 50000;
  const rank5Prize = parseInt(drawData.rnk5_win_amt || "5000", 10) || 5000;

  let totalPrize = 0;
  let winningGamesCount = 0;
  let highestRankNum = 99; // 1이 최고

  const gameResults: GameCheckResult[] = parsed.games.map((game) => {
    const matchedNumbers = game.numbers.filter((num) => winningSet.has(num));
    const bonusMatched = game.numbers.includes(bonusNumber);
    const matchCount = matchedNumbers.length;

    let rank: LottoRank = "fail";
    let prizeAmount = 0;

    if (matchCount === 6) {
      rank = 1;
      prizeAmount = rank1Prize;
    } else if (matchCount === 5 && bonusMatched) {
      rank = 2;
      prizeAmount = rank2Prize;
    } else if (matchCount === 5) {
      rank = 3;
      prizeAmount = rank3Prize;
    } else if (matchCount === 4) {
      rank = 4;
      prizeAmount = rank4Prize;
    } else if (matchCount === 3) {
      rank = 5;
      prizeAmount = rank5Prize;
    } else {
      rank = "fail";
      prizeAmount = 0;
    }

    if (rank !== "fail") {
      totalPrize += prizeAmount;
      winningGamesCount++;
      if (typeof rank === "number" && rank < highestRankNum) {
        highestRankNum = rank;
      }
    }

    const formattedPrize =
      rank === "fail"
        ? "낙첨"
        : prizeAmount > 0
          ? `${formatWon(prizeAmount)}원`
          : "당첨";

    return {
      label: game.label,
      numbers: game.numbers,
      matchedNumbers,
      bonusMatched,
      matchCount,
      rank,
      prizeAmount,
      formattedPrize,
    };
  });

  const highestRank: LottoRank =
    highestRankNum <= 5 ? (highestRankNum as LottoRank) : "fail";

  return {
    drawNo: parsed.drawNo,
    drawDate: drawData.drw_no_date,
    isDrawPending: false,
    winningNumbers,
    bonusNumber,
    games: gameResults,
    totalPrize,
    highestRank,
    winningGamesCount,
  };
}
