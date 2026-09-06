export type GameLabel = "A" | "B" | "C" | "D" | "E";

export interface QrParsedGame {
  label: GameLabel;
  numbers: number[];
  type?: "auto" | "semi" | "manual";
}

export interface QrParsedData {
  drawNo: number;
  games: QrParsedGame[];
  rawUrl: string;
}

export type LottoRank = 1 | 2 | 3 | 4 | 5 | "fail";

export interface GameCheckResult {
  label: GameLabel;
  numbers: number[];
  matchedNumbers: number[];
  bonusMatched: boolean;
  matchCount: number;
  rank: LottoRank;
  prizeAmount: number;
  formattedPrize: string;
}

export interface QrCheckResult {
  drawNo: number;
  drawDate?: string;
  isDrawPending: boolean;
  winningNumbers?: number[];
  bonusNumber?: number;
  games: GameCheckResult[];
  totalPrize: number;
  highestRank: LottoRank;
  winningGamesCount: number;
}
