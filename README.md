# TWLN - Feature Sliced Design Next.js App

Next.js 15와 Feature Sliced Design (FSD) 아키텍처를 기반으로 한 풀스택 웹 애플리케이션입니다.

## 🚀 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Architecture**: Feature Sliced Design (FSD)
- **Authentication**: Supabase Auth (SSR 지원) + 승인 시스템
- **State Management**:
  - Server State: TanStack Query v5
  - Client State: Zustand
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Language**: TypeScript
- **Database**: Supabase PostgreSQL (RLS 보안)

## 🔐 승인 시스템

MVP 버전에서는 승인된 사용자만 접근할 수 있습니다:

- **회원가입**: 사용자 등록 후 승인 대기 상태
- **로그인**: 승인된 사용자만 로그인 가능
- **관리자 대시보드**: 사용자 승인/취소 관리
- **Row Level Security**: 데이터베이스 레벨 보안

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈페이지
│   ├── login/             # 로그인/회원가입 페이지
│   └── admin/             # 관리자 대시보드
├── shared/                # 공유 레이어
│   ├── ui/               # UI 컴포넌트 (shadcn/ui)
│   ├── lib/              # 유틸리티 라이브러리
│   │   ├── supabase/     # Supabase 클라이언트
│   │   ├── providers/    # React 프로바이더
│   │   └── stores/       # Zustand 스토어
│   ├── api/              # API 관련 유틸리티
│   ├── config/           # 설정 파일
│   └── types/            # 공통 타입 정의
│       └── auth.ts       # 승인 시스템 타입
├── entities/              # 엔티티 레이어
│   └── user/             # 사용자 엔티티
├── features/              # 기능 레이어
│   └── auth/             # 인증 기능
│       ├── api/          # 인증 API
│       │   ├── auth-api.ts # 기본 인증 API
│       │   └── approval-api.ts # 승인 시스템 API
│       ├── hooks/        # 인증 훅
│       └── model/        # 인증 모델
├── widgets/               # 위젯 레이어
└── pages/                 # 페이지 레이어
```

## 🛠️ 설치 및 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 설정

1. [Supabase Dashboard](https://supabase.com/dashboard)에서 새 프로젝트 생성
2. `supabase-setup.sql` 파일의 SQL 스크립트 실행
3. 환경 변수 설정:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## ✨ 최근 주요 작업 및 자동화

이 프로젝트에는 최근 다음과 같은 주요 기능 추가 및 개발 환경 개선 작업이 이루어졌습니다.

### 1. 관리자 역할 기반 접근 제어 (RBAC) 강화

기존의 단순 인증 여부 확인 방식에서 벗어나, 데이터베이스에 등록된 사용자에게만 관리자 권한을 부여하는 역할 기반 접근 제어(RBAC) 시스템을 도입하여 보안을 강화했습니다.

- **`admin_users` 테이블 신설**: 관리자 계정 정보를 별도로 관리하는 DB 테이블을 추가했습니다.
- **관리자 확인 API 구현**: 현재 로그인한 사용자가 관리자인지 서버에 확인하는 API(`isUserAdmin`)를 구현했습니다.
- **어드민 페이지 접근 제어**: 관리자만 `/admin` 페이지에 접근할 수 있도록 프론트엔드 로직을 수정하고, 권한이 없을 경우 접근 차단 메시지를 표시합니다.

### 2. 로또 당첨 번호 데이터 자동화 시스템

동행복권에서 제공하는 API를 활용하여, 로또 당첨 번호 데이터를 가져와 자체 데이터베이스에 저장하고 매주 자동으로 업데이트하는 시스템을 구축했습니다.

- **데이터베이스 테이블 설계**: 회차별 로또 당첨 번호, 판매 금액, 당첨자 수 등의 정보를 저장하기 위한 `lotto_draws` 테이블을 설계하고 생성했습니다.
- **과거 데이터 저장 기능 (Backfill)**: 1회부터 현재까지(1192회)의 모든 과거 데이터를 한 번에 가져와 DB에 저장하는 일회성 API(`api/backfill-lotto`)를 구현했습니다.
  - 대용량 데이터를 안정적으로 처리하기 위해 스트리밍 응답 방식을 사용합니다.
- **주간 자동 업데이트 (Cron Job)**: 매주 새로운 추첨 결과를 자동으로 가져와 DB에 추가하는 Cron Job(`api/cron/update-lotto`)을 구현했습니다.
  - **Vercel Cron Jobs**를 활용하여 매주 토요일 밤과 일요일 아침(실패 시 재시도)에 API가 자동으로 실행되도록 `vercel.json`에 설정했습니다.
  - Vercel의 무료 플랜 제한(최대 2개)에 맞게 스케줄을 최적화했습니다.

### 3. 개발 환경 및 빌드 최적화

개발 생산성을 높이고, 일관된 코드 품질을 유지하며, 배포 속도를 향상시키기 위한 다양한 개선 작업을 진행했습니다.

- **커밋 전 코드 자동 검사 (Pre-commit Hook)**
  - **Husky**와 **lint-staged**를 도입하여, `git commit` 실행 시점에 스테이징된 파일에 한해 `ESLint`와 `Prettier`가 자동으로 실행되도록 설정했습니다.
  - 이를 통해 팀 전체의 코드 스타일을 통일하고 잠재적인 오류를 사전에 방지합니다.
- **ESLint 규칙 커스터마이징**: `any` 타입 사용 시 오류 대신 경고만 표시하도록 `@typescript-eslint/no-explicit-any` 규칙을 조정하여 개발 유연성을 확보했습니다.
- **빌드 성능 최적화**: `next.config.ts`를 수정하여 `next build` 과정의 속도를 개선했습니다.
  - 빌드 시 중복으로 실행되던 ESLint 및 TypeScript 검사를 비활성화했습니다. (커밋 시점에 이미 검사)
  - 프로덕션 소스맵(`Source Maps`) 생성을 비활성화하여 빌드 시간과 결과물의 용량을 줄였습니다.

### 4. 시스템 초기 설정 방법 요약

새로운 환경에서 이 시스템을 구동하기 위한 최초 설정 방법입니다.

1.  **DB 테이블 생성**: Supabase SQL Editor에서 `create-admin-table.sql`과 `create-lotto-draws-table.sql` 스크립트를 실행합니다.
2.  **과거 데이터 저장**: 프로젝트를 Vercel에 배포한 후, 브라우저에서 `[배포 주소]/api/backfill-lotto`에 접속하여 과거 로또 데이터를 DB에 모두 저장합니다. (최초 1회 실행, 약 10~15분 소요)

### 3. 초기 관리자 설정

Supabase SQL Editor에서 다음 실행:

```sql
-- 초기 관리자 계정 추가 (실제 이메일로 교체)
INSERT INTO approved_users (email, approved_by) VALUES ('your-email@example.com', 'system');
```

### 4. 개발 서버 실행

```bash
npm run dev
```

## 🔧 주요 설정

### Supabase Auth SSR + 승인 시스템

- `@supabase/ssr` 패키지 사용
- 로그인 시 승인 상태 자동 확인
- 승인되지 않은 사용자 접근 차단
- 관리자 대시보드를 통한 사용자 관리

### TanStack Query v5

- SSR 지원을 위한 `staleTime` 설정
- React Query Devtools 포함
- 승인 상태 실시간 동기화

### Zustand

- 클라이언트 상태 관리
- 인증 상태 및 사용자 정보 관리
- 타입스크립트 지원

### shadcn/ui

- Tailwind CSS v4 기반
- FSD 아키텍처에 맞게 `src/shared/ui/`에 배치
- 재사용 가능한 컴포넌트

## 📚 사용법

### 인증 플로우

1. **회원가입**: `/login` 페이지에서 회원가입
2. **승인 대기**: 관리자 승인 대기 상태
3. **관리자 승인**: `/admin` 페이지에서 사용자 승인
4. **로그인**: 승인된 사용자만 로그인 가능

### 관리자 기능

```typescript
// 관리자 대시보드 접속
// http://localhost:3000/admin

// 승인 대기 중인 사용자 목록
// 승인된 사용자 목록
// 사용자 승인/취소 기능
```

### 인증 사용하기

```typescript
import { useAuth } from "@/features/auth/hooks/use-auth";

function MyComponent() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>환영합니다, {user?.email}님!</p>
          <button onClick={signOut}>로그아웃</button>
        </div>
      ) : (
        <button
          onClick={() =>
            signIn({ email: "test@example.com", password: "password" })
          }
        >
          로그인
        </button>
      )}
    </div>
  );
}
```

## 🎯 FSD 아키텍처 원칙

1. **레이어 분리**: 각 레이어는 명확한 책임을 가집니다
2. **의존성 방향**: 상위 레이어는 하위 레이어에만 의존할 수 있습니다
3. **공유 코드**: `shared` 레이어를 통해 공통 코드를 관리합니다
4. **기능 중심**: `features` 레이어에서 비즈니스 로직을 구현합니다

## 📝 스크립트

- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run start`: 프로덕션 서버 실행
- `npm run lint`: ESLint 실행

## 🔒 보안 기능

- **Row Level Security (RLS)**: 데이터베이스 레벨 보안
- **승인 시스템**: 관리자 승인 후 접근 가능
- **세션 관리**: SSR 지원 인증
- **타입 안전성**: TypeScript로 타입 보장

## 🤝 기여하기

1. 이슈를 생성하거나 기존 이슈를 확인하세요
2. 새로운 기능 브랜치를 생성하세요
3. FSD 아키텍처 원칙을 따라 코드를 작성하세요
4. PR을 생성하세요

## 📄 라이선스

MIT License
