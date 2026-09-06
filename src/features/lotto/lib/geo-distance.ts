/**
 * 하버사인 공식(Haversine Formula)을 사용하여 두 위도/경도 좌표 간의 직선 거리(km)를 계산합니다.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const R = 6371; // 지구 반경 (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // 소수점 둘째 자리까지
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * 거리(km)를 사용자 친화적인 한국어 단위로 포맷팅합니다.
 * 예: 0.45 -> "450m", 2.34 -> "2.3km"
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}
