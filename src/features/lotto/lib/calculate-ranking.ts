/**
 * 로또 당첨 등위 계산 유틸리티
 */

export type LottoRank = 1 | 2 | 3 | 4 | 5 | 0;

/**
 * 당첨 등위 계산
 * @param numbers 사용자 번호 (6개)
 * @param winningNumbers 당첨 번호 (6개)
 * @param bonusNumber 보너스 번호
 * @returns 등위 (1~5), 0은 낙첨
 */
export function calculateRanking(
  numbers: number[],
  winningNumbers: number[],
  bonusNumber: number,
): LottoRank {
  // 일치하는 번호 개수 계산
  const matchCount = numbers.filter((n) => winningNumbers.includes(n)).length;

  // 보너스 번호 일치 여부
  const hasBonusMatch = numbers.includes(bonusNumber);

  // 등위 판정
  if (matchCount === 6) {
    return 1; // 1등: 6개 번호 일치
  } else if (matchCount === 5 && hasBonusMatch) {
    return 2; // 2등: 5개 번호 + 보너스 번호 일치
  } else if (matchCount === 5) {
    return 3; // 3등: 5개 번호 일치
  } else if (matchCount === 4) {
    return 4; // 4등: 4개 번호 일치
  } else if (matchCount === 3) {
    return 5; // 5등: 3개 번호 일치
  }

  return 0; // 낙첨
}

/**
 * 여러 번호 조합의 당첨 결과 집계
 */
export interface RankingResults {
  total: number;
  rank_1: number;
  rank_2: number;
  rank_3: number;
  rank_4: number;
  rank_5: number;
  no_win: number;
}

export function aggregateRankings(
  numbersList: number[][],
  winningNumbers: number[],
  bonusNumber: number,
): RankingResults {
  const results: RankingResults = {
    total: numbersList.length,
    rank_1: 0,
    rank_2: 0,
    rank_3: 0,
    rank_4: 0,
    rank_5: 0,
    no_win: 0,
  };

  for (const numbers of numbersList) {
    const rank = calculateRanking(numbers, winningNumbers, bonusNumber);

    switch (rank) {
      case 1:
        results.rank_1++;
        break;
      case 2:
        results.rank_2++;
        break;
      case 3:
        results.rank_3++;
        break;
      case 4:
        results.rank_4++;
        break;
      case 5:
        results.rank_5++;
        break;
      default:
        results.no_win++;
    }
  }

  return results;
}
