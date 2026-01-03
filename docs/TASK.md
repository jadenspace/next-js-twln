# TWLN 개발 태스크 상세 명세

> PRD 문서를 기반으로 한 구체적인 개발 태스크 목록

## 📋 태스크 개요

총 21개의 메인 태스크를 5개 Phase로 구분하여 진행합니다.

---

## Phase 1: 포인트 시스템 (예상 기간: 1-2주)

### 태스크 1: 데이터베이스 스키마 생성

**파일 생성**:
- `create-points-tables.sql`

**작업 내용**:
1. `user_points` 테이블 생성
   - 컬럼: id, user_id, balance, total_earned, total_spent, created_at, updated_at
   - 인덱스: user_id
   - RLS 정책 설정
2. `point_transactions` 테이블 생성
   - 컬럼: id, user_id, transaction_type, amount, balance_after, description, feature_type, reference_id, expires_at, created_at
   - 인덱스: user_id, created_at, transaction_type
   - RLS 정책 설정
3. `point_packages` 테이블 생성
   - 컬럼: id, name, points, price, bonus_points, is_active, display_order, created_at, updated_at
   - 기본 패키지 데이터 INSERT
4. `user_profiles` 테이블 컬럼 추가
   - last_login_at, total_points_used, preferred_numbers, notification_enabled
5. Supabase에서 SQL 실행 및 검증

**완료 조건**:
- [ ] 모든 테이블이 정상 생성됨
- [ ] RLS 정책이 올바르게 적용됨
- [ ] 인덱스가 생성됨
- [ ] 기본 데이터가 삽입됨

---

### 태스크 2: 포인트 API 구현

**파일 생성/수정**:
- `src/features/points/api/points-api.ts` (신규)
- `src/features/points/types/index.ts` (신규)
- `src/app/api/points/balance/route.ts` (신규)
- `src/app/api/points/transactions/route.ts` (신규)
- `src/app/api/points/use/route.ts` (신규)
- `src/app/api/points/admin/grant/route.ts` (신규)

**작업 내용**:

#### 2.1 타입 정의 (`src/features/points/types/index.ts`)
```typescript
export interface UserPoints {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  transaction_type: 'charge' | 'use' | 'refund' | 'bonus' | 'expire';
  amount: number;
  balance_after: number;
  description: string;
  feature_type?: string;
  reference_id?: string;
  expires_at?: string;
  created_at: string;
}

export interface PointPackage {
  id: string;
  name: string;
  points: number;
  price: number;
  bonus_points: number;
  is_active: boolean;
  display_order: number;
}
```

#### 2.2 포인트 API 함수 (`src/features/points/api/points-api.ts`)
- `getUserPoints(userId: string)` - 사용자 포인트 잔액 조회
- `getPointTransactions(userId: string, limit?: number, offset?: number)` - 포인트 거래 내역 조회
- `usePoints(userId: string, amount: number, featureType: string, description: string)` - 포인트 사용
- `addPoints(userId: string, amount: number, transactionType: string, description: string, expiresAt?: Date)` - 포인트 추가
- `getPointPackages()` - 포인트 패키지 목록 조회
- `initializeUserPoints(userId: string, bonusPoints: number)` - 신규 사용자 포인트 초기화

#### 2.3 API 라우트 구현
1. `GET /api/points/balance` - 포인트 잔액 조회
2. `GET /api/points/transactions` - 거래 내역 조회 (쿼리: limit, offset)
3. `POST /api/points/use` - 포인트 사용 (내부 API, 다른 기능에서 호출)
4. `POST /api/points/admin/grant` - 관리자 포인트 지급

**완료 조건**:
- [ ] 모든 API 함수 구현 완료
- [ ] API 라우트 테스트 완료
- [ ] 에러 핸들링 구현
- [ ] TypeScript 타입 안전성 확보

---

### 태스크 3: 포인트 UI 컴포넌트 구현

**파일 생성/수정**:
- `src/features/points/components/point-balance.tsx` (신규)
- `src/features/points/components/point-history-modal.tsx` (신규)
- `src/features/points/hooks/use-points.ts` (신규)
- `src/app/(dashboard)/layout.tsx` (수정 - 헤더에 포인트 표시)

**작업 내용**:

#### 3.1 포인트 잔액 표시 컴포넌트 (`point-balance.tsx`)
- 현재 포인트 잔액 표시
- 포인트 아이콘 (Lucide React)
- 클릭 시 내역 모달 열기
- 충전 버튼
- 실시간 업데이트 (TanStack Query)

#### 3.2 포인트 내역 모달 (`point-history-modal.tsx`)
- Dialog 컴포넌트 (shadcn/ui)
- 거래 내역 테이블
  - 날짜/시간
  - 거래 유형
  - 금액 (양수/음수)
  - 설명
  - 잔액
- 필터링 (전체/충전/사용)
- 페이지네이션
- 무한 스크롤 또는 더보기 버튼

#### 3.3 포인트 훅 (`use-points.ts`)
```typescript
export function usePoints() {
  // TanStack Query를 사용한 포인트 데이터 관리
  const { data: pointsData, isLoading } = useQuery({
    queryKey: ['userPoints'],
    queryFn: () => pointsApi.getUserPoints(userId),
  });

  const { data: transactions } = useQuery({
    queryKey: ['pointTransactions'],
    queryFn: () => pointsApi.getPointTransactions(userId),
  });

  const usePointsMutation = useMutation({
    mutationFn: (params) => pointsApi.usePoints(...),
    onSuccess: () => {
      queryClient.invalidateQueries(['userPoints']);
      queryClient.invalidateQueries(['pointTransactions']);
    },
  });

  return { pointsData, transactions, usePoints: usePointsMutation };
}
```

#### 3.4 레이아웃 수정
- 헤더에 포인트 잔액 컴포넌트 추가
- 로그인한 사용자만 표시
- 반응형 디자인 (모바일에서는 축약 표시)

**완료 조건**:
- [ ] 포인트 잔액이 헤더에 표시됨
- [ ] 내역 모달이 정상 작동함
- [ ] 실시간 업데이트 동작 확인
- [ ] 반응형 디자인 적용

---

### 태스크 4: 신규 가입 보너스 자동 지급

**파일 생성/수정**:
- `src/features/auth/api/auth-api.ts` (수정)
- 또는 Supabase Function/Trigger 사용

**작업 내용**:

#### 4.1 방법 A: Supabase Trigger 사용 (권장)
```sql
-- SQL 함수 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- user_points 테이블에 초기 포인트 추가
  INSERT INTO user_points (user_id, balance, total_earned)
  VALUES (NEW.id, 1000, 1000);

  -- point_transactions 테이블에 거래 기록
  INSERT INTO point_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    expires_at
  ) VALUES (
    NEW.id,
    'bonus',
    1000,
    1000,
    '신규 가입 보너스',
    NOW() + INTERVAL '1 year'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

#### 4.2 방법 B: 회원가입 API 수정
- `signUp` 함수에서 회원가입 성공 후 `initializeUserPoints` 호출
- 에러 발생 시 롤백 처리

**완료 조건**:
- [ ] 신규 가입 시 자동으로 1,000P 지급
- [ ] 포인트 거래 내역에 기록됨
- [ ] 에러 케이스 처리 완료

---

## Phase 2: 결제 시스템 (예상 기간: 2주)

### 태스크 5: 결제 데이터베이스 스키마 생성

**파일 생성**:
- `create-payments-table.sql`

**작업 내용**:
1. `payments` 테이블 생성
   - 컬럼: id, user_id, order_id, payment_key, amount, points_amount, payment_method, status, pg_provider, pg_response, receipt_url, refund_reason, refunded_at, completed_at, created_at, updated_at
   - 인덱스: user_id, order_id, status, created_at
   - RLS 정책 설정
2. Supabase에서 SQL 실행

**완료 조건**:
- [ ] payments 테이블 생성 완료
- [ ] RLS 정책 적용
- [ ] 인덱스 생성 완료

---

### 태스크 6: Toss Payments 연동

**작업 내용**:

#### 6.1 Toss Payments 계정 및 API 키 발급
1. Toss Payments 개발자센터 가입
2. 테스트 시크릿 키 발급
3. 클라이언트 키 발급

#### 6.2 환경 변수 설정
```env
# .env.local
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxx
TOSS_SECRET_KEY=test_sk_xxxx
```

#### 6.3 Toss Payments SDK 설치
```bash
npm install @tosspayments/payment-sdk
```

#### 6.4 타입 정의 (`src/features/payments/types/index.ts`)
```typescript
export interface PaymentRequest {
  packageId: string;
  amount: number;
  pointsAmount: number;
}

export interface Payment {
  id: string;
  user_id: string;
  order_id: string;
  payment_key?: string;
  amount: number;
  points_amount: number;
  payment_method?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  pg_provider: string;
  pg_response?: any;
  receipt_url?: string;
  refund_reason?: string;
  refunded_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
```

**완료 조건**:
- [ ] Toss Payments 계정 생성
- [ ] API 키 발급 및 환경 변수 설정
- [ ] SDK 설치 완료
- [ ] 타입 정의 완료

---

### 태스크 7: 결제 API 구현

**파일 생성**:
- `src/features/payments/api/payments-api.ts` (신규)
- `src/app/api/payments/prepare/route.ts` (신규)
- `src/app/api/payments/confirm/route.ts` (신규)
- `src/app/api/payments/webhook/route.ts` (신규)
- `src/app/api/payments/history/route.ts` (신규)

**작업 내용**:

#### 7.1 결제 API 함수 (`payments-api.ts`)
```typescript
// 주문번호 생성 (예: ORDER_20260103_UUID)
function generateOrderId(): string

// 결제 준비 (주문번호 발급 및 DB 저장)
async function preparePayment(userId: string, packageId: string): Promise<{orderId, amount, pointsAmount}>

// 결제 승인 처리
async function confirmPayment(orderId: string, paymentKey: string, amount: number): Promise<void>

// 결제 실패 처리
async function failPayment(orderId: string, errorMessage: string): Promise<void>

// 결제 내역 조회
async function getPaymentHistory(userId: string, limit?: number, offset?: number): Promise<Payment[]>
```

#### 7.2 API 라우트 구현

**`POST /api/payments/prepare`**
- 요청: `{ packageId }`
- 응답: `{ orderId, amount, pointsAmount }`
- 처리:
  1. packageId로 포인트 패키지 조회
  2. 주문번호 생성
  3. payments 테이블에 pending 상태로 INSERT
  4. orderId, amount 반환

**`POST /api/payments/confirm`**
- 요청: `{ orderId, paymentKey, amount }`
- 처리:
  1. orderId로 결제 정보 조회
  2. Toss Payments API 호출하여 결제 승인
  3. 승인 성공 시:
     - payments 테이블 업데이트 (status: completed, payment_key, completed_at, receipt_url)
     - 포인트 충전 (addPoints 호출)
  4. 실패 시:
     - payments 테이블 업데이트 (status: failed)
     - 에러 메시지 반환

**`POST /api/payments/webhook`**
- Toss Payments 웹훅 수신
- 결제 상태 변경 시 자동 호출
- 처리:
  1. 웹훅 서명 검증
  2. 결제 상태에 따라 DB 업데이트
  3. 포인트 충전 (중복 방지 로직 필요)

**`GET /api/payments/history`**
- 쿼리: `limit`, `offset`
- 응답: `{ payments: Payment[], total: number }`
- 사용자 본인의 결제 내역만 조회 (RLS)

#### 7.3 Toss Payments API 연동
```typescript
// Toss Payments 승인 API 호출
async function confirmTossPayment(paymentKey: string, orderId: string, amount: number) {
  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentKey,
      orderId,
      amount,
    }),
  });

  return await response.json();
}
```

**완료 조건**:
- [ ] 모든 API 라우트 구현 완료
- [ ] Toss Payments API 연동 완료
- [ ] 에러 핸들링 구현
- [ ] 웹훅 서명 검증 구현

---

### 태스크 8: 결제 UI/UX 구현

**파일 생성**:
- `src/features/payments/components/payment-packages.tsx` (신규)
- `src/features/payments/components/payment-modal.tsx` (신규)
- `src/features/payments/hooks/use-payment.ts` (신규)
- `src/app/(dashboard)/points/charge/page.tsx` (신규)
- `src/app/(dashboard)/payments/page.tsx` (신규)

**작업 내용**:

#### 8.1 포인트 충전 페이지 (`/points/charge`)
- 포인트 패키지 목록 표시
- 각 패키지:
  - 이름
  - 포인트 금액
  - 가격
  - 보너스 포인트
  - 선택 버튼
- 선택 시 결제 모달 열기

#### 8.2 결제 모달 (`payment-modal.tsx`)
- 선택한 패키지 정보 표시
- 결제 수단 선택 (추후 Toss UI 위젯 사용)
- 결제 진행 상태 표시
- 결제 완료/실패 피드백

#### 8.3 결제 훅 (`use-payment.ts`)
```typescript
export function usePayment() {
  const prepareMutation = useMutation({
    mutationFn: (packageId) => paymentsApi.preparePayment(packageId),
  });

  const confirmMutation = useMutation({
    mutationFn: (params) => paymentsApi.confirmPayment(...),
    onSuccess: () => {
      // 포인트 잔액 갱신
      queryClient.invalidateQueries(['userPoints']);
      // 성공 토스트 표시
    },
  });

  async function handlePayment(packageId: string) {
    // 1. 결제 준비
    const { orderId, amount, pointsAmount } = await prepareMutation.mutateAsync(packageId);

    // 2. Toss Payments 결제창 호출
    const tossPayments = await loadTossPayments(clientKey);
    await tossPayments.requestPayment('카드', {
      amount,
      orderId,
      orderName: `${pointsAmount}P 충전`,
      successUrl: `${window.location.origin}/payments/success`,
      failUrl: `${window.location.origin}/payments/fail`,
    });
  }

  return { handlePayment, isLoading: prepareMutation.isLoading };
}
```

#### 8.4 결제 성공/실패 페이지
- `/payments/success?orderId=xxx&paymentKey=xxx&amount=xxx`
  - 쿼리 파라미터로 결제 정보 수신
  - confirm API 호출
  - 성공 메시지 표시
  - 대시보드로 리다이렉트
- `/payments/fail?code=xxx&message=xxx`
  - 실패 사유 표시
  - 재시도 버튼

#### 8.5 결제 내역 페이지 (`/payments`)
- 결제 내역 테이블
  - 날짜/시간
  - 주문번호
  - 충전 포인트
  - 결제 금액
  - 결제 수단
  - 상태
  - 영수증 다운로드 버튼
- 페이지네이션

**완료 조건**:
- [ ] 결제 UI 구현 완료
- [ ] Toss Payments 결제창 연동
- [ ] 결제 성공/실패 처리 완료
- [ ] 결제 내역 조회 페이지 구현
- [ ] 반응형 디자인 적용

---

## Phase 3: 로또 분석 기능 (예상 기간: 3-4주)

### 태스크 9: 분석 데이터베이스 스키마 생성

**파일 생성**:
- `create-analysis-tables.sql`

**작업 내용**:
1. `analysis_results` 테이블 생성
2. RLS 정책 설정
3. 인덱스 생성

**완료 조건**:
- [ ] 테이블 생성 완료
- [ ] RLS 정책 적용
- [ ] 인덱스 생성

---

### 태스크 10: 통계 분석 기능

**파일 생성**:
- `src/features/lotto/api/analysis-api.ts` (신규)
- `src/features/lotto/utils/stats-calculator.ts` (신규)
- `src/app/api/lotto/analysis/stats/route.ts` (신규)
- `src/app/(dashboard)/lotto/analysis/stats/page.tsx` (신규)
- `src/features/lotto/components/stats-charts.tsx` (신규)

**작업 내용**:

#### 10.1 통계 계산 유틸리티 (`stats-calculator.ts`)
```typescript
// 번호별 출현 빈도 계산
function calculateNumberFrequency(draws: LottoDraw[]): Record<number, number>

// 홀/짝 비율 계산
function calculateOddEvenRatio(draws: LottoDraw[]): { odd: number, even: number }

// 구간별 분포 계산
function calculateRangeDistribution(draws: LottoDraw[]): Record<string, number>

// 번호 합계 분포 계산
function calculateSumDistribution(draws: LottoDraw[]): Record<number, number>

// 최근 출현 회차 계산
function calculateLastAppearance(draws: LottoDraw[]): Record<number, number>

// 연속 미출현 횟수 계산
function calculateConsecutiveAbsence(draws: LottoDraw[]): Record<number, number>
```

#### 10.2 통계 분석 API (`POST /api/lotto/analysis/stats`)
- 요청: `{ startDrawNo?, endDrawNo? }` (선택적 범위 지정)
- 처리:
  1. 사용자 포인트 확인 (100P 이상)
  2. 로또 데이터 조회 (범위 또는 전체)
  3. 통계 계산
  4. 포인트 차감 (usePoints 호출)
  5. 분석 결과 저장 (analysis_results 테이블)
  6. 결과 반환

#### 10.3 통계 분석 페이지 (`/lotto/analysis/stats`)
- 분석 옵션 선택 UI
  - 전체 회차 / 특정 범위
  - 최근 N회 (10, 20, 50, 100)
- 분석 실행 버튼 (100P 표시)
- 결과 차트 표시:
  - 번호별 출현 빈도 (막대 그래프)
  - 홀/짝 비율 (원 그래프)
  - 구간별 분포 (막대 그래프)
  - 번호 합계 분포 (라인 그래프)
  - 최근 출현 회차 테이블
  - 연속 미출현 횟수 테이블
- 북마크 버튼
- 공유/이미지 저장 버튼

#### 10.4 차트 컴포넌트 (`stats-charts.tsx`)
- Recharts 라이브러리 사용
- 반응형 차트
- 툴팁 표시
- 범례

**완료 조건**:
- [ ] 통계 계산 로직 구현 완료
- [ ] API 구현 및 테스트 완료
- [ ] 포인트 차감 동작 확인
- [ ] 차트 UI 구현 완료
- [ ] 분석 결과 저장 확인

---

### 태스크 11: 패턴 분석 기능

**파일 생성**:
- `src/features/lotto/utils/pattern-analyzer.ts` (신규)
- `src/app/api/lotto/analysis/pattern/route.ts` (신규)
- `src/app/(dashboard)/lotto/analysis/pattern/page.tsx` (신규)
- `src/features/lotto/components/pattern-charts.tsx` (신규)

**작업 내용**:

#### 11.1 패턴 분석 유틸리티 (`pattern-analyzer.ts`)
```typescript
// 연속번호 패턴 분석
function analyzeConsecutiveNumbers(draws: LottoDraw[]): {
  twoConsecutive: number,
  threeConsecutive: number,
  fourConsecutive: number,
}

// 끝자리 분석
function analyzeLastDigits(draws: LottoDraw[]): Record<number, number>

// AC값 계산
function calculateAC(numbers: number[]): number

// 번호간 간격 분석
function analyzeNumberGaps(draws: LottoDraw[]): Record<number, number>

// 고정 조합 분석 (2개)
function analyzeFixedPairs(draws: LottoDraw[]): Array<{ pair: [number, number], count: number }>

// 고정 조합 분석 (3개)
function analyzeFixedTriplets(draws: LottoDraw[]): Array<{ triplet: [number, number, number], count: number }>
```

#### 11.2 패턴 분석 API (`POST /api/lotto/analysis/pattern`)
- 요청: `{ startDrawNo?, endDrawNo? }`
- 처리 (200P 차감)
- 결과 반환

#### 11.3 패턴 분석 페이지
- 분석 옵션 선택
- 결과 표시:
  - 연속번호 출현 빈도
  - 끝자리 분포 히트맵
  - AC값 분포
  - 번호 간격 분포
  - 자주 나오는 2개 조합 (Top 20)
  - 자주 나오는 3개 조합 (Top 20)

**완료 조건**:
- [ ] 패턴 분석 로직 구현
- [ ] API 구현 및 테스트
- [ ] UI 구현 완료

---

### 태스크 12: 당첨 시뮬레이션 기능

**파일 생성**:
- `src/features/lotto/utils/simulator.ts` (신규)
- `src/app/api/lotto/analysis/simulation/route.ts` (신규)
- `src/app/(dashboard)/lotto/analysis/simulation/page.tsx` (신규)

**작업 내용**:

#### 12.1 시뮬레이션 유틸리티 (`simulator.ts`)
```typescript
interface SimulationResult {
  totalDraws: number;
  wins: {
    first: number;
    second: number;
    third: number;
    fourth: number;
    fifth: number;
  };
  totalInvestment: number;
  totalReturn: number;
  roi: number;
  bestWin: {
    drawNo: number;
    rank: number;
    amount: number;
  };
}

// 사용자 번호와 과거 회차 비교
function simulateLottery(userNumbers: number[], draws: LottoDraw[]): SimulationResult
```

#### 12.2 시뮬레이션 API (`POST /api/lotto/analysis/simulation`)
- 요청: `{ numbers: number[] }`
- 처리 (300P 차감)
- 전체 회차 시뮬레이션 실행
- 결과 반환

#### 12.3 시뮬레이션 페이지
- 번호 선택 UI (1~45, 6개 선택)
- 자동 번호 선택 버튼
- 시뮬레이션 실행 버튼 (300P)
- 결과 표시:
  - 총 회차 수
  - 등수별 당첨 횟수
  - 총 투자 금액
  - 총 수익 금액
  - ROI
  - 최고 당첨 회차 및 금액
  - 등수별 당첨 회차 목록 (접을 수 있는 아코디언)

**완료 조건**:
- [ ] 시뮬레이션 로직 구현
- [ ] API 구현
- [ ] UI 구현

---

### 태스크 13: AI 번호 추천 기능

**파일 생성**:
- `src/features/lotto/utils/ai-recommender.ts` (신규)
- `src/app/api/lotto/analysis/recommend/route.ts` (신규)
- `src/app/(dashboard)/lotto/analysis/recommend/page.tsx` (신규)

**작업 내용**:

#### 13.1 AI 추천 알고리즘 (`ai-recommender.ts`)
```typescript
interface RecommendedSet {
  numbers: number[];
  reasons: string[];
  confidence: number;
  similarDraws: number[];
}

// 추천 알고리즘 (통계 기반)
function generateRecommendations(
  draws: LottoDraw[],
  preferredNumbers?: number[],
  count: number = 5
): RecommendedSet[]
```

**알고리즘 로직**:
1. 최근 출현 빈도 가중치
2. 연속 미출현 횟수 가중치
3. 홀/짝 균형
4. 구간별 균형
5. 고정 조합 패턴
6. 사용자 선호 번호 포함 (선택)
7. 랜덤성 추가 (과적합 방지)

#### 13.2 AI 추천 API (`POST /api/lotto/analysis/recommend`)
- 요청: `{ preferredNumbers?: number[], count?: number }`
- 처리 (500P 차감)
- 추천 생성
- 결과 반환

#### 13.3 AI 추천 페이지
- 선호 번호 선택 (선택 사항)
- 추천 세트 개수 선택 (1~10, 기본 5)
- 추천 실행 버튼 (500P)
- 결과 표시:
  - 5세트의 추천 번호
  - 각 번호별 선택 근거
  - 신뢰도 점수
  - 과거 유사 패턴 회차
  - QR 코드 생성 (복권 구매용)
  - 저장/즐겨찾기 버튼

**완료 조건**:
- [ ] AI 추천 알고리즘 구현
- [ ] API 구현
- [ ] UI 구현
- [ ] QR 코드 생성 기능

---

### 태스크 14: 로또 검색 기능

**파일 생성**:
- `src/features/lotto/api/search-api.ts` (신규)
- `src/app/api/lotto/search/route.ts` (신규)
- `src/app/(dashboard)/lotto/search/page.tsx` (신규)
- `src/features/lotto/components/search-form.tsx` (신규)
- `src/features/lotto/components/search-results.tsx` (신규)

**작업 내용**:

#### 14.1 검색 API (`search-api.ts`)
```typescript
// 회차별 검색
function searchByDrawNo(drawNo: number): Promise<LottoDraw | null>

// 날짜별 검색
function searchByDate(date: string): Promise<LottoDraw | null>

// 번호 포함 검색
function searchByNumbers(numbers: number[]): Promise<LottoDraw[]>

// 조건 검색
interface SearchConditions {
  oddCount?: number;
  evenCount?: number;
  sumMin?: number;
  sumMax?: number;
  ranges?: Record<string, number>; // 예: { '1-10': 2, '11-20': 1 }
}
function searchByConditions(conditions: SearchConditions): Promise<LottoDraw[]>
```

#### 14.2 검색 API 라우트 (`GET /api/lotto/search`)
- 쿼리 파라미터:
  - `drawNo` - 회차 번호
  - `date` - 날짜 (YYYY-MM-DD)
  - `numbers` - 포함 번호 (쉼표 구분)
  - `conditions` - JSON 조건
- 무료 기능

#### 14.3 검색 페이지 (`/lotto/search`)
- 검색 폼:
  - 회차 검색 탭
  - 날짜 검색 탭
  - 번호 검색 탭
  - 고급 검색 탭 (조건)
- 검색 결과 표시:
  - 회차 정보
  - 당첨번호
  - 보너스번호
  - 당첨금액
  - 당첨자 수
- 최근 검색 기록 (로컬스토리지)

**완료 조건**:
- [ ] 검색 API 구현
- [ ] 검색 UI 구현
- [ ] 결과 표시 UI
- [ ] 최근 검색 기록 기능

---

## Phase 4: 사용자 경험 개선 (예상 기간: 1-2주)

### 태스크 15: 메인 대시보드 구현

**파일 생성/수정**:
- `src/app/(dashboard)/dashboard/page.tsx` (신규)
- `src/features/lotto/components/latest-draw-card.tsx` (신규)
- `src/features/dashboard/components/quick-links.tsx` (신규)
- `src/features/dashboard/components/stats-summary.tsx` (신규)

**작업 내용**:

#### 15.1 대시보드 레이아웃
- 3-컬럼 그리드 (데스크톱) / 1-컬럼 (모바일)
- 섹션:
  1. 최신 회차 정보
  2. 포인트 정보 카드
  3. 인기 기능 바로가기
  4. 최근 분석 히스토리
  5. 공지사항/이벤트

#### 15.2 최신 회차 카드 (`latest-draw-card.tsx`)
- 최신 회차 번호
- 추첨일
- 당첨번호 (큰 숫자 표시)
- 보너스번호
- 1등 당첨금
- 다음 추첨일 카운트다운

#### 15.3 인기 기능 바로가기
- 카드 스타일 버튼
  - 통계 분석 (100P)
  - AI 추천 (500P)
  - 시뮬레이션 (300P)
  - 검색 (무료)
- 각 기능 설명 및 아이콘

#### 15.4 통계 요약
- 총 회차 수
- 가장 많이 나온 번호 Top 5
- 가장 적게 나온 번호 Top 5

**완료 조건**:
- [ ] 대시보드 레이아웃 구현
- [ ] 모든 섹션 컴포넌트 구현
- [ ] 실시간 데이터 표시
- [ ] 반응형 디자인

---

### 태스크 16: 마이페이지 구현

**파일 생성**:
- `src/app/(dashboard)/mypage/page.tsx` (신규)
- `src/features/user/components/profile-section.tsx` (신규)
- `src/features/user/components/points-section.tsx` (신규)
- `src/features/user/components/payment-history-section.tsx` (신규)
- `src/features/user/components/settings-section.tsx` (신규)

**작업 내용**:

#### 16.1 프로필 섹션
- 이메일 표시
- 가입일
- 마지막 로그인
- 비밀번호 변경 버튼

#### 16.2 포인트 섹션
- 현재 포인트 잔액 (크게 표시)
- 총 획득 포인트
- 총 사용 포인트
- 소멸 예정 포인트
- 충전 버튼
- 최근 포인트 내역 (최근 10건)
- 전체 보기 버튼

#### 16.3 결제 내역 섹션
- 최근 결제 내역 (최근 5건)
- 전체 보기 버튼

#### 16.4 설정 섹션
- 알림 설정 (on/off)
- 선호 번호 설정 (최대 10개)

**완료 조건**:
- [ ] 모든 섹션 구현
- [ ] 설정 저장 기능
- [ ] 반응형 디자인

---

### 태스크 17: 분석 히스토리 및 북마크 기능

**파일 생성**:
- `src/app/(dashboard)/lotto/history/page.tsx` (신규)
- `src/features/lotto/api/history-api.ts` (신규)
- `src/app/api/lotto/analysis/history/route.ts` (신규)

**작업 내용**:

#### 17.1 히스토리 API
```typescript
// 분석 히스토리 조회
function getAnalysisHistory(userId: string, filters?: {
  analysisType?: string,
  isBookmarked?: boolean,
  limit?: number,
  offset?: number
}): Promise<AnalysisResult[]>

// 북마크 토글
function toggleBookmark(resultId: string): Promise<void>

// 분석 결과 삭제
function deleteAnalysisResult(resultId: string): Promise<void>
```

#### 17.2 히스토리 페이지 (`/lotto/history`)
- 필터링:
  - 전체 / 통계 / 패턴 / AI 추천 / 시뮬레이션
  - 북마크만 보기
- 분석 결과 카드:
  - 분석 유형 아이콘
  - 날짜/시간
  - 요약 정보
  - 소모 포인트
  - 북마크 버튼
  - 삭제 버튼
  - 다시 보기 버튼 (상세 모달)
- 페이지네이션

#### 17.3 분석 결과 상세 모달
- 저장된 분석 결과 표시
- 북마크 토글
- 공유 기능
- 다시 분석 버튼 (새로운 포인트 차감)

**완료 조건**:
- [ ] 히스토리 API 구현
- [ ] 히스토리 페이지 구현
- [ ] 북마크 기능 구현
- [ ] 상세 모달 구현

---

### 태스크 18: 데이터 엑스포트 기능

**파일 생성**:
- `src/features/lotto/utils/csv-exporter.ts` (신규)
- `src/app/api/lotto/export/route.ts` (신규)
- `src/app/(dashboard)/lotto/export/page.tsx` (신규)

**작업 내용**:

#### 18.1 CSV 생성 유틸리티 (`csv-exporter.ts`)
```typescript
// 로또 데이터를 CSV로 변환
function generateLottoCSV(draws: LottoDraw[]): string

// 분석 결과를 CSV로 변환
function generateAnalysisCSV(analysisResult: any): string
```

#### 18.2 엑스포트 API (`POST /api/lotto/export`)
- 요청: `{ startDrawNo?, endDrawNo?, includeStats?: boolean }`
- 처리 (1000P 차감)
- CSV 파일 생성
- Supabase Storage에 저장
- 다운로드 URL 반환

#### 18.3 엑스포트 페이지 (`/lotto/export`)
- 엑스포트 옵션:
  - 전체 회차 / 특정 범위
  - 기본 데이터만 / 통계 포함
- 엑스포트 실행 버튼 (1000P)
- 파일 다운로드 링크

**완료 조건**:
- [ ] CSV 생성 로직 구현
- [ ] 파일 저장 기능 구현
- [ ] 다운로드 기능 구현
- [ ] UI 구현

---

## Phase 5: 관리자 기능 확장 (예상 기간: 1주)

### 태스크 19: 관리자 포인트 관리 기능

**파일 생성/수정**:
- `src/app/(dashboard)/admin/points/page.tsx` (신규)
- `src/features/admin/components/point-management.tsx` (신규)

**작업 내용**:

#### 19.1 포인트 관리 페이지
- 사용자 검색 (이메일)
- 사용자 포인트 정보 표시
- 포인트 지급/회수 폼:
  - 금액 입력
  - 사유 입력
  - 지급/회수 버튼
- 포인트 거래 내역 (관리자 액션만)

**완료 조건**:
- [ ] 포인트 관리 UI 구현
- [ ] 지급/회수 기능 구현
- [ ] 내역 조회 기능

---

### 태스크 20: 결제 관리 및 환불 기능

**파일 생성/수정**:
- `src/app/(dashboard)/admin/payments/page.tsx` (신규)
- `src/features/admin/api/admin-payments-api.ts` (신규)
- `src/app/api/payments/refund/route.ts` (신규)

**작업 내용**:

#### 20.1 결제 관리 페이지
- 전체 결제 내역 조회
- 필터링:
  - 상태 (전체/완료/실패/환불)
  - 날짜 범위
  - 사용자 검색
- 결제 상세 정보 모달
- 환불 처리 버튼

#### 20.2 환불 API (`POST /api/payments/refund`)
- 요청: `{ paymentId, reason }`
- 처리:
  1. Toss Payments 환불 API 호출
  2. payments 테이블 업데이트 (status: refunded)
  3. 포인트 회수 (음수 거래 추가)

**완료 조건**:
- [ ] 결제 관리 UI 구현
- [ ] 환불 API 구현
- [ ] 환불 처리 테스트 완료

---

### 태스크 21: 사용 통계 대시보드

**파일 생성**:
- `src/app/(dashboard)/admin/stats/page.tsx` (신규)
- `src/features/admin/api/admin-stats-api.ts` (신규)
- `src/app/api/admin/stats/route.ts` (신규)

**작업 내용**:

#### 21.1 통계 API
```typescript
interface AdminStats {
  users: {
    total: number;
    active: number;
    pending: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  points: {
    totalIssued: number;
    totalUsed: number;
    balance: number;
  };
  features: {
    stats: number;
    pattern: number;
    recommend: number;
    simulation: number;
  };
}

function getAdminStats(): Promise<AdminStats>
```

#### 21.2 통계 대시보드 페이지
- KPI 카드:
  - 총 회원 수
  - 활성 사용자 (최근 7일)
  - 총 매출
  - 이번 달 매출
- 차트:
  - 일별 매출 추이 (라인 차트)
  - 기능별 사용 비율 (원 그래프)
  - 포인트 충전/사용 추이
- 최근 활동 로그

**완료 조건**:
- [ ] 통계 API 구현
- [ ] 대시보드 UI 구현
- [ ] 차트 표시 완료

---

## 추가 고려사항

### 성능 최적화
- [ ] 로또 데이터 조회 쿼리 최적화 (인덱스 활용)
- [ ] 분석 결과 캐싱 (동일 조건 재분석 방지)
- [ ] 이미지 최적화 (Next.js Image)
- [ ] 코드 스플리팅 (동적 import)

### 보안
- [ ] API 레이트 리밋 (너무 많은 요청 방지)
- [ ] 결제 웹훅 서명 검증
- [ ] XSS/CSRF 방지
- [ ] 환경 변수 보안 (Secret 키 노출 방지)

### 테스트
- [ ] 단위 테스트 (유틸리티 함수)
- [ ] 통합 테스트 (API 라우트)
- [ ] E2E 테스트 (주요 플로우)
- [ ] 결제 샌드박스 테스트

### 문서화
- [ ] API 문서 작성 (Swagger/OpenAPI)
- [ ] 사용자 가이드
- [ ] 관리자 매뉴얼
- [ ] 개발자 온보딩 문서

### 배포
- [ ] Vercel 프로덕션 배포
- [ ] 환경 변수 설정 (프로덕션)
- [ ] 도메인 연결
- [ ] SSL 인증서 설정
- [ ] Supabase 프로덕션 인스턴스 마이그레이션
- [ ] 크론 작업 설정 (로또 업데이트)

---

## 마일스톤

| Phase | 완료 예정일 | 주요 산출물 |
|-------|------------|------------|
| Phase 1 | 1주차 종료 | 포인트 시스템 완료 |
| Phase 2 | 3주차 종료 | 결제 시스템 완료 |
| Phase 3 | 7주차 종료 | 로또 분석 기능 완료 |
| Phase 4 | 9주차 종료 | 사용자 경험 개선 완료 |
| Phase 5 | 10주차 종료 | 전체 시스템 완료 |

---

**문서 버전**: 1.0
**최종 수정일**: 2026-01-03
**작성자**: TWLN 개발팀
