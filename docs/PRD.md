# 로또탐정 로또 분석 서비스 PRD (Product Requirements Document)

## 1. 프로젝트 개요

### 1.1 서비스 소개
로또탐정은 로또 당첨번호 데이터를 기반으로 통계 분석, 패턴 분석, 번호 추천 등의 인사이트를 제공하는 유료 SaaS 서비스입니다.

### 1.2 비즈니스 모델
- **프리미엄 기능**: 포인트 기반 과금 모델
- **수익원**: 포인트 충전을 통한 결제 (PG 연동)
- **타겟 고객**: 로또 구매자, 데이터 분석에 관심있는 사용자

### 1.3 핵심 가치 제안
- 과거 1,200회 이상의 로또 당첨 데이터 분석
- AI/통계 기반 번호 추천 및 패턴 분석
- 사용한 만큼만 결제하는 합리적인 가격

---

## 2. 현재 구현 상태

### 2.1 완료된 기능 ✅
- **인증 시스템**
  - 이메일/비밀번호 기반 회원가입/로그인 (Supabase Auth)
  - 비밀번호 찾기/재설정
  - 관리자 승인 시스템 (2단계 인증)
  - 관리자 대시보드

- **로또 데이터 관리**
  - 동행복권 API 연동
  - 로또 당첨번호 자동 업데이트 (크론)
  - 과거 데이터 백필 기능
  - 1~1,204회차 데이터 저장

- **기술 인프라**
  - Next.js 15 (App Router)
  - Supabase (인증 + DB)
  - TanStack Query (서버 상태 관리)
  - Zustand (클라이언트 상태 관리)
  - shadcn/ui (UI 컴포넌트)

### 2.2 미구현 기능 ❌
- 포인트 시스템
- 결제 시스템
- 로또 분석 기능 (UI/UX)
- 로또 검색 기능
- 사용자 대시보드
- 포인트 사용 내역 관리

---

## 3. 구현해야 할 기능

### 3.1 포인트 시스템

#### 3.1.1 포인트 정책
- **신규 가입 보너스**: 1,000P 지급
- **포인트 충전 단위**: 1,000P / 5,000P / 10,000P / 50,000P
- **포인트 환율**: 100원 = 100P (1:1)
- **포인트 유효기간**: 충전일로부터 1년

#### 3.1.2 포인트 차감 정책
| 기능 | 소모 포인트 |
|------|------------|
| 기본 당첨번호 조회 | 무료 (최근 10회) |
| 전체 회차 조회 | 무료 |
| 통계 분석 (기본) | 100P/회 |
| 패턴 분석 | 200P/회 |
| AI 번호 추천 | 500P/회 |
| 당첨 시뮬레이션 | 300P/회 |
| 데이터 엑스포트 (CSV) | 1,000P/회 |

#### 3.1.3 필요한 기능
- 포인트 잔액 조회
- 포인트 충전
- 포인트 사용 내역 조회
- 포인트 소멸 예정 알림
- 관리자 포인트 지급/회수 기능

### 3.2 결제 시스템

#### 3.2.1 결제 방식
- **PG사**: 토스페이먼츠 (Toss Payments) 권장
- **결제 수단**:
  - 신용카드/체크카드
  - 간편결제 (카카오페이, 네이버페이, 토스페이)
  - 계좌이체
  - 가상계좌

#### 3.2.2 결제 플로우
1. 사용자가 포인트 충전 패키지 선택
2. 결제 요청 생성 (주문번호 발급)
3. PG사 결제창 호출
4. 결제 승인/실패 처리
5. 승인 시 포인트 충전 및 영수증 발행
6. 실패 시 에러 처리 및 재시도 안내

#### 3.2.3 필요한 기능
- 결제 요청 API
- 결제 승인 콜백 처리
- 결제 내역 조회
- 환불 처리 (관리자)
- 영수증 발행
- 결제 실패 로그 관리

### 3.3 로또 분석 기능

#### 3.3.1 기본 통계 분석 (100P)
- **번호별 출현 빈도**: 1~45번까지 각 번호의 출현 횟수 및 비율
- **최근 출현 회차**: 각 번호가 마지막으로 출현한 회차
- **연속 미출현 횟수**: 각 번호가 연속으로 미출현한 횟수
- **홀/짝 비율**: 당첨번호의 홀수/짝수 비율
- **구간별 분포**: 1~9, 10~19, 20~29, 30~39, 40~45 구간별 출현 비율
- **번호 합계 분포**: 당첨번호 6개의 합계 분포

#### 3.3.2 패턴 분석 (200P)
- **연속번호 패턴**: 연속된 번호(예: 5, 6, 7) 출현 빈도
- **끝자리 분석**: 끝자리 숫자(0~9)의 출현 패턴
- **AC값 분석**: 숫자 복잡도(Arithmetic Complexity) 분석
- **번호간 간격 분석**: 당첨번호 사이의 간격 패턴
- **고정 조합 분석**: 자주 함께 출현하는 번호 조합 (2개, 3개)
- **요일별 패턴**: 추첨 요일에 따른 번호 패턴 (토요일)

#### 3.3.3 AI 번호 추천 (500P)
- **추천 알고리즘**:
  1. 과거 데이터 기반 머신러닝 모델
  2. 통계 기반 가중치 부여
  3. 최근 트렌드 반영
  4. 사용자 선호 번호 포함 옵션
- **제공 정보**:
  - 5세트의 추천 번호 조합
  - 각 번호별 선택 근거 설명
  - 예상 확률 (참고용)
  - 과거 유사 패턴 회차

#### 3.3.4 당첨 시뮬레이션 (300P)
- 사용자가 선택한 번호로 과거 모든 회차 시뮬레이션
- 당첨 횟수 및 등수별 통계
- 총 투자 금액 대비 수익률 계산
- 최고 당첨 회차 및 금액 표시

#### 3.3.5 데이터 엑스포트 (1,000P)
- CSV 파일 다운로드
- 전체 회차 당첨번호 데이터
- 사용자가 분석한 통계 데이터
- 필터링 옵션 (기간, 회차 범위)

### 3.4 로또 검색 기능

#### 3.4.1 기본 검색 (무료)
- **회차별 검색**: 특정 회차의 당첨번호 조회
- **날짜별 검색**: 특정 날짜의 당첨번호 조회
- **최근 10회 조회**: 무료 제공

#### 3.4.2 고급 검색
- **번호 포함 검색**: 특정 번호가 포함된 회차 검색
- **조건 검색**:
  - 홀/짝 비율 조건
  - 번호 합계 범위
  - 구간별 개수 조건
- **복합 조건 검색**: 여러 조건 AND/OR 조합

### 3.5 사용자 대시보드

#### 3.5.1 마이페이지
- **포인트 정보**
  - 현재 포인트 잔액
  - 충전 버튼
  - 소멸 예정 포인트
- **사용 내역**
  - 포인트 사용/충전 내역 (최근 30일)
  - 필터링 (전체/충전/사용)
  - 페이지네이션
- **결제 내역**
  - 결제 일시, 금액, 수단
  - 영수증 다운로드
- **분석 히스토리**
  - 최근 사용한 분석 기능
  - 즐겨찾기 번호 조합
  - 북마크한 회차

#### 3.5.2 메인 대시보드
- **최신 회차 정보** (무료)
  - 최신 회차 당첨번호
  - 당첨금액, 당첨자 수
  - 다음 추첨일 카운트다운
- **인기 기능 바로가기**
  - 통계 분석
  - AI 번호 추천
  - 당첨 시뮬레이션
- **공지사항/이벤트**

---

## 4. 데이터베이스 스키마 설계

### 4.1 신규 테이블

#### 4.1.1 user_points (사용자 포인트)
```sql
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 0,  -- 현재 포인트 잔액
  total_earned BIGINT DEFAULT 0,      -- 총 획득 포인트
  total_spent BIGINT DEFAULT 0,       -- 총 사용 포인트
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 인덱스
CREATE INDEX idx_user_points_user_id ON user_points(user_id);
```

#### 4.1.2 point_transactions (포인트 거래 내역)
```sql
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL,  -- 'charge', 'use', 'refund', 'bonus', 'expire'
  amount BIGINT NOT NULL,                 -- 변동 포인트 (양수: 충전, 음수: 사용)
  balance_after BIGINT NOT NULL,          -- 거래 후 잔액
  description TEXT,                       -- 거래 설명
  feature_type VARCHAR(50),               -- 사용한 기능 (예: 'stat_analysis', 'ai_recommend')
  reference_id UUID,                      -- 참조 ID (결제 ID, 분석 결과 ID 등)
  expires_at TIMESTAMPTZ,                 -- 포인트 소멸 예정일
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX idx_point_transactions_type ON point_transactions(transaction_type);
```

#### 4.1.3 payments (결제 내역)
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id VARCHAR(100) UNIQUE NOT NULL,  -- 주문번호 (PG사 전달용)
  payment_key VARCHAR(200),               -- PG사 결제 키
  amount BIGINT NOT NULL,                 -- 결제 금액 (원)
  points_amount BIGINT NOT NULL,          -- 충전될 포인트
  payment_method VARCHAR(50),             -- 결제 수단
  status VARCHAR(20) NOT NULL,            -- 'pending', 'completed', 'failed', 'refunded'
  pg_provider VARCHAR(50),                -- PG사 (예: 'toss')
  pg_response JSON,                       -- PG사 응답 원본
  receipt_url TEXT,                       -- 영수증 URL
  refund_reason TEXT,                     -- 환불 사유
  refunded_at TIMESTAMPTZ,                -- 환불 일시
  completed_at TIMESTAMPTZ,               -- 결제 완료 일시
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
```

#### 4.1.4 analysis_results (분석 결과 저장)
```sql
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL,     -- 'stat', 'pattern', 'ai_recommend', 'simulation'
  input_params JSON,                      -- 입력 파라미터 (사용자 선택 옵션)
  result_data JSON NOT NULL,              -- 분석 결과 데이터
  points_spent BIGINT NOT NULL,           -- 소모한 포인트
  is_bookmarked BOOLEAN DEFAULT FALSE,    -- 북마크 여부
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX idx_analysis_results_type ON analysis_results(analysis_type);
CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at DESC);
CREATE INDEX idx_analysis_results_bookmarked ON analysis_results(is_bookmarked) WHERE is_bookmarked = TRUE;
```

#### 4.1.5 point_packages (포인트 충전 패키지)
```sql
CREATE TABLE point_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  points BIGINT NOT NULL,                 -- 충전되는 포인트
  price BIGINT NOT NULL,                  -- 가격 (원)
  bonus_points BIGINT DEFAULT 0,          -- 보너스 포인트
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 데이터 삽입
INSERT INTO point_packages (name, points, price, bonus_points, display_order) VALUES
  ('베이직', 1000, 1000, 0, 1),
  ('스탠다드', 5000, 5000, 500, 2),
  ('프리미엄', 10000, 10000, 1500, 3),
  ('VIP', 50000, 50000, 10000, 4);
```

### 4.2 기존 테이블 수정

#### 4.2.1 user_profiles 테이블 컬럼 추가
```sql
ALTER TABLE user_profiles
ADD COLUMN last_login_at TIMESTAMPTZ,
ADD COLUMN total_points_used BIGINT DEFAULT 0,
ADD COLUMN preferred_numbers INT ARRAY,  -- 사용자 선호 번호
ADD COLUMN notification_enabled BOOLEAN DEFAULT TRUE;
```

---

## 5. API 설계

### 5.1 포인트 API

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/api/points/balance` | GET | 포인트 잔액 조회 | User |
| `/api/points/transactions` | GET | 포인트 거래 내역 조회 | User |
| `/api/points/charge` | POST | 포인트 충전 요청 | User |
| `/api/points/use` | POST | 포인트 사용 (내부 API) | Internal |
| `/api/points/admin/grant` | POST | 관리자 포인트 지급 | Admin |

### 5.2 결제 API

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/api/payments/prepare` | POST | 결제 준비 (주문번호 발급) | User |
| `/api/payments/confirm` | POST | 결제 승인 처리 | User |
| `/api/payments/webhook` | POST | PG사 웹훅 수신 | Public |
| `/api/payments/history` | GET | 결제 내역 조회 | User |
| `/api/payments/refund` | POST | 환불 처리 | Admin |

### 5.3 로또 분석 API

| 엔드포인트 | 메서드 | 설명 | 포인트 |
|-----------|--------|------|--------|
| `/api/lotto/search` | GET | 로또 검색 (기본) | 무료 |
| `/api/lotto/recent` | GET | 최근 회차 조회 | 무료 |
| `/api/lotto/analysis/stats` | POST | 통계 분석 | 100P |
| `/api/lotto/analysis/pattern` | POST | 패턴 분석 | 200P |
| `/api/lotto/analysis/recommend` | POST | AI 번호 추천 | 500P |
| `/api/lotto/analysis/simulation` | POST | 당첨 시뮬레이션 | 300P |
| `/api/lotto/export` | POST | 데이터 엑스포트 | 1000P |
| `/api/lotto/analysis/history` | GET | 분석 히스토리 | 무료 |

### 5.4 사용자 API

| 엔드포인트 | 메서드 | 설명 | 권한 |
|-----------|--------|------|------|
| `/api/user/dashboard` | GET | 대시보드 데이터 | User |
| `/api/user/profile` | GET/PUT | 프로필 조회/수정 | User |
| `/api/user/preferences` | PUT | 선호 설정 저장 | User |

---

## 6. UI/UX 요구사항

### 6.1 페이지 구조

```
/                           -- 메인 랜딩 페이지 (비로그인 사용자용)
/login                      -- 로그인/회원가입
/dashboard                  -- 사용자 대시보드 (로그인 후)
/lotto/search               -- 로또 검색
/lotto/analysis             -- 로또 분석 메인
  /lotto/analysis/stats     -- 통계 분석
  /lotto/analysis/pattern   -- 패턴 분석
  /lotto/analysis/recommend -- AI 추천
  /lotto/analysis/simulation -- 시뮬레이션
/points                     -- 포인트 관리
  /points/charge            -- 포인트 충전
  /points/history           -- 사용 내역
/payments                   -- 결제 내역
/mypage                     -- 마이페이지
/admin                      -- 관리자 대시보드
```

### 6.2 주요 컴포넌트

#### 6.2.1 포인트 표시 컴포넌트
- 헤더에 항상 표시
- 현재 포인트 잔액
- 충전 버튼 바로가기
- 클릭 시 상세 내역 모달

#### 6.2.2 분석 결과 컴포넌트
- 차트 라이브러리: Recharts 또는 Chart.js
- 시각화: 막대 그래프, 원 그래프, 히트맵
- 데이터 테이블 (정렬/필터링)
- 공유 기능 (이미지 저장)
- 북마크 기능

#### 6.2.3 결제 모달
- 패키지 선택 UI
- PG사 결제창 통합
- 결제 진행 상태 표시
- 결제 완료/실패 피드백

### 6.3 반응형 디자인
- 모바일 우선 설계
- 태블릿/데스크톱 대응
- Tailwind CSS 브레이크포인트 활용

---

## 7. 기술 스택

### 7.1 프론트엔드
- **프레임워크**: Next.js 15 (App Router)
- **UI 라이브러리**: shadcn/ui
- **차트**: Recharts
- **상태 관리**:
  - Zustand (클라이언트)
  - TanStack Query (서버)
- **폼 관리**: React Hook Form + Zod

### 7.2 백엔드
- **런타임**: Next.js API Routes
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Supabase Auth
- **PG 연동**: Toss Payments SDK

### 7.3 배포 및 인프라
- **호스팅**: Vercel
- **DB**: Supabase
- **크론**: Vercel Cron 또는 Supabase Functions
- **파일 저장**: Supabase Storage (엑스포트 파일)

---

## 8. 개발 우선순위

### Phase 1: 포인트 시스템 (1-2주)
1. 데이터베이스 스키마 생성
2. 포인트 API 구현
3. 포인트 UI 컴포넌트
4. 신규 가입 보너스 자동 지급

### Phase 2: 결제 시스템 (2주)
1. Toss Payments 연동
2. 결제 API 구현
3. 결제 UI/UX
4. 웹훅 처리 및 테스트

### Phase 3: 로또 분석 기능 (3-4주)
1. 통계 분석 API 및 UI
2. 패턴 분석 API 및 UI
3. 당첨 시뮬레이션 API 및 UI
4. AI 번호 추천 (머신러닝 모델)

### Phase 4: 사용자 경험 개선 (1-2주)
1. 사용자 대시보드
2. 분석 히스토리 및 북마크
3. 데이터 엑스포트
4. 알림 및 공지사항

### Phase 5: 관리자 기능 확장 (1주)
1. 포인트 관리 기능
2. 결제 관리 및 환불
3. 사용 통계 대시보드

---

## 9. 성공 지표 (KPI)

### 9.1 비즈니스 지표
- **회원 가입 수**: 월 목표 1,000명
- **유료 전환율**: 가입자 대비 20% 이상
- **ARPU** (Average Revenue Per User): 월 10,000원
- **재구매율**: 60% 이상

### 9.2 사용자 참여 지표
- **DAU** (Daily Active Users): 500명
- **기능별 사용률**:
  - 통계 분석 50%
  - AI 추천 30%
  - 시뮬레이션 20%
- **평균 세션 시간**: 10분 이상

### 9.3 기술 지표
- **API 응답 시간**: 95% 요청이 2초 이내
- **에러율**: 1% 미만
- **결제 성공률**: 95% 이상

---

## 10. 리스크 및 대응 방안

### 10.1 기술적 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| PG 연동 실패 | 높음 | 샌드박스 환경에서 충분한 테스트, 대체 PG사 준비 |
| 대용량 데이터 처리 지연 | 중간 | 쿼리 최적화, 인덱스 설정, 캐싱 전략 |
| 동시 접속 급증 | 중간 | Vercel Auto-scaling, DB 커넥션 풀 설정 |

### 10.2 비즈니스 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|-----------|
| 유료 전환율 저조 | 높음 | 무료 체험 포인트 제공, 이벤트 진행 |
| 경쟁 서비스 출현 | 중간 | 차별화된 AI 기능, 사용자 경험 개선 |
| 법적 규제 | 낮음 | 도박이 아닌 통계 서비스임을 명시 |

---

## 11. 향후 확장 계획

### 11.1 단기 (3-6개월)
- 모바일 앱 개발 (React Native)
- 카카오톡 알림 연동
- 정기 구독 모델 추가

### 11.2 중기 (6-12개월)
- 다른 복권 지원 (연금복권, 스피또)
- 커뮤니티 기능 (사용자 간 번호 공유)
- API 외부 제공 (B2B)

### 11.3 장기 (12개월 이상)
- 글로벌 시장 진출
- 블록체인 기반 투명성 제공
- 파트너십 (편의점, 복권 판매점)

---

## 부록

### A. 참고 사이트
- 동행복권 공식 사이트: https://www.dhlottery.co.kr
- 로또 분석 사이트 예시:
  - 나눔로또
  - 로또랩
  - 로또분석왕

### B. 관련 법규
- 복권 및 복권기금법
- 전자금융거래법
- 개인정보보호법

---

**문서 버전**: 1.0
**최종 수정일**: 2026-01-03
**작성자**: 로또탐정 개발팀
