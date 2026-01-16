/**
 * DP 조합 계산기 테스트
 */

import { DPCombinationCounter } from "../services/dp-combination-counter";

const counter = new DPCombinationCounter();

console.log("=== Phase 2: DP 조합 계산기 테스트 ===\n");

// 테스트 1: 소수 개수
console.log("📊 테스트 1: 소수 개수");
const primeTest1 = counter.countPrimeCombinations(2, 4, []);
console.log(`소수 2-4개: ${primeTest1.toLocaleString()}개`);
console.log(`예상: 약 4-5백만개 (검증 필요)\n`);

// 테스트 2: 3의 배수 개수
console.log("📊 테스트 2: 3의 배수 개수");
const mult3Test1 = counter.countMultiplesOf3Combinations(2, 2, []);
console.log(`3의 배수 정확히 2개: ${mult3Test1.toLocaleString()}개`);
console.log(`계산: C(15,2) × C(30,4) = 105 × 27,405 = 2,877,525`);
console.log(`결과: ${mult3Test1 === 2877525 ? "✅ 정확!" : "❌ 오류"}\n`);

// 테스트 3: 5의 배수 개수
console.log("📊 테스트 3: 5의 배수 개수");
const mult5Test1 = counter.countMultiplesOf5Combinations(1, 1, []);
console.log(`5의 배수 정확히 1개: ${mult5Test1.toLocaleString()}개`);
console.log(`계산: C(9,1) × C(36,5) = 9 × 376,992 = 3,392,928`);
console.log(`결과: ${mult5Test1 === 3392928 ? "✅ 정확!" : "❌ 오류"}\n`);

// 테스트 4: 고정 번호와 함께
console.log("📊 테스트 4: 고정 번호와 소수");
const primeFixed = counter.countPrimeCombinations(1, 3, [1, 2, 3]);
console.log(`고정: [1,2,3], 소수 1-3개: ${primeFixed.toLocaleString()}개`);
console.log(`검증: 고정된 번호 중 소수는 2,3 (2개)`);
console.log(`남은 3개 선택에서 소수 -1 ~ 1개 필요\n`);

// 테스트 5: 소수 + 3의 배수 교집합
console.log("📊 테스트 5: 소수 + 3의 배수 (교집합)");
const combined = counter.countPrimeAndMult3Combinations([2, 3], [2, 3], []);
console.log(`소수 2-3개 AND 3의 배수 2-3개: ${combined.toLocaleString()}개`);
console.log(`주의: 3은 소수이자 3의 배수\n`);

// 캐시 통계
console.log("📊 캐시 통계");
const stats = counter.getCacheStats();
console.log(`소수 캐시: ${stats.primeCount}개`);
console.log(`3의 배수 캐시: ${stats.mult3Count}개`);
console.log(`5의 배수 캐시: ${stats.mult5Count}개`);

console.log("\n✅ Phase 2 DP 계산 테스트 완료!");
