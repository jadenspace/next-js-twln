# 로또탐정 - Feature Sliced Design Next.js App

Next.js 15와 Feature Sliced Design (FSD) 아키텍처를 기반으로, 사용자 관리 및 데이터 자동화 시스템을 갖춘 풀스택 웹 애플리케이션입니다.

---

## ✨ 주요 기능 (Key Features)

- **사용자 승인 시스템**: 관리자의 승인을 받은 사용자만 서비스에 접근할 수 있는 폐쇄형 인증 시스템을 갖추고 있습니다.
- **역할 기반 접근 제어 (RBAC)**: 일반 사용자와 관리자 역할을 분리하고, 데이터베이스에 등록된 관리자만 관리자 페이지에 접근할 수 있습니다.
- **로또 데이터 자동화**: 외부 API를 통해 로또 당첨 번호 데이터를 수집하고, 매주 최신 정보로 자동 업데이트하는 Cron Job 시스템을 포함합니다.
- **개발 생산성 자동화**: `Husky`와 `lint-staged`를 통해 커밋 시점에 코드 스타일과 품질을 자동으로 검사하고 교정합니다.

---

## 🚀 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Architecture**: Feature Sliced Design (FSD)
- **Database & Auth**: Supabase (PostgreSQL, Auth, RLS)
- **State Management**:
  - **Server State**: TanStack Query v5
  - **Client State**: Zustand
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Language**: TypeScript
- **Development Automation**: Husky, lint-staged, ESLint, Prettier

---

## ⚙️ 시스템 아키텍처

### Feature-Sliced Design (FSD) 아키텍처

이 프로젝트는 FSD의 원칙에 따라 코드를 계층적으로 분리하여 유지보수성과 확장성을 극대화합니다.

- `src/app`: Next.js의 App Router. 페이지 라우팅 및 레이아웃을 담당합니다.
- `src/shared`: 특정 비즈니스 로직에 의존하지 않는 범용 코드를 포함합니다. (예: UI 컴포넌트, Supabase 클라이언트, 공통 타입)
- `src/entities`: 핵심 비즈니스 엔티티를 정의합니다. (예: `user` 엔티티의 타입 및 모델)
- `src/features`: 사용자와 직접 상호작용하는 기능 단위를 구현합니다. (예: `auth` 기능의 API 호출, 훅, 상태)
- `src/widgets`: 여러 `features`와 `entities`를 조합하여 만드는 독립적인 UI 블록입니다. (예: 헤더, 사이드바)

### Supabase 연동

- **인증 (Authentication)**: `@supabase/ssr`을 사용하여 서버 사이드 렌더링(SSR) 환경에서도 안전하게 사용자 세션을 관리합니다. 이메일/비밀번호 기반 가입 및 로그인을 처리합니다.
- **데이터베이스 (PostgreSQL)**: 사용자 정보, 관리자 목록, 로또 데이터 등을 저장하는 주 데이터베이스로 사용됩니다.
- **행 수준 보안 (Row Level Security, RLS)**: 데이터베이스에 직접적인 보안 규칙을 적용하여, 사용자가 자신의 데이터에만 접근할 수 있도록 통제합니다. (예: `profiles` 테이블)

### 상태 관리 전략

- **TanStack Query (Server State)**: 서버로부터 가져오는 모든 비동기 데이터를 관리합니다. (예: 사용자 목록, 로또 데이터 조회) 캐싱, 재시도, 데이터 동기화 등의 기능을 통해 서버 상태를 효율적으로 관리합니다.
- **Zustand (Client State)**: 클라이언트 측에서만 사용되는 상태나 여러 컴포넌트에서 공유해야 하는 UI 상태를 관리합니다. (예: 현재 로그인된 사용자 정보, UI 테마 등)

---

## 🛠️ 시작하기 (Getting Started)

### 1. 저장소 복제 및 의존성 설치

```bash
git clone [repository-url]
cd lotto-detective
npm install
```

### 2. Supabase 프로젝트 설정

1.  [Supabase Dashboard](https://supabase.com/dashboard)에서 새 프로젝트를 생성합니다.
2.  **SQL Editor** 메뉴로 이동하여 다음 SQL 파일들의 내용을 순서대로 실행합니다.
    - `supabase-setup.sql` (초기 RLS 및 기본 테이블 설정)
    - `create-admin-table.sql` (관리자 테이블 생성)
    - `create-lotto-draws-table.sql` (로또 데이터 테이블 생성)

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고, Supabase 프로젝트의 URL과 `anon` 키를 입력합니다.

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. 개발 서버 실행

```bash
npm run dev
```

---

## 📖 시스템 상세 가이드

### 사용자 인증 및 승인 흐름

1.  **회원가입**: 사용자가 이메일과 비밀번호로 가입하면, Supabase `auth.users` 테이블에 계정이 생성됩니다.
2.  **승인 대기**: 가입 직후 사용자는 '승인 대기' 상태가 되며, 아직 서비스의 핵심 기능에 접근할 수 없습니다.
3.  **관리자 승인**: 관리자 계정으로 로그인하여 `/admin` 페이지에 접근하면, 승인 대기 중인 사용자 목록이 나타납니다. 여기서 '승인' 버튼을 누릅니다.
4.  **로그인 성공**: 관리자의 승인을 받은 사용자는 이제 정상적으로 로그인하여 서비스를 이용할 수 있습니다.

### 로또 데이터 자동화 시스템

1.  **초기 데이터 설정**: 위 `[시작하기]` 가이드에 따라 `create-lotto-draws-table.sql`을 실행합니다.
2.  **과거 데이터 저장 (최초 1회)**: 프로젝트를 Vercel에 배포한 후, 브라우저에서 `[배포 주소]/api/backfill-lotto` URL에 접속합니다. 약 10~15분 동안 1회부터 현재까지의 모든 로또 데이터가 데이터베이스에 저장됩니다.
3.  **주간 자동 업데이트**: `vercel.json`에 설정된 Cron Job이 매주 토요일 밤 10시 30분과 일요일 아침 9시 30분(실패 시 재시도)에 자동으로 실행되어 최신 당첨 번호를 DB에 추가합니다.

---

## 🤖 개발 환경 및 자동화

### 코드 품질 및 스타일 자동화

- **Husky & lint-staged**: `git commit` 시점에, 스테이징된 파일(`*.{js,ts,jsx,tsx}`)에 대해 `ESLint --fix`와 `Prettier --write`를 강제로 실행합니다. 이를 통해 모든 커밋은 일관된 코드 스타일과 품질 기준을 만족하게 됩니다.
- **ESLint**: `eslint.config.mjs`에 프로젝트 맞춤 규칙이 설정되어 있습니다. (예: `@typescript-eslint/no-explicit-any` 규칙을 'warn'으로 조정)

### 빌드 및 배포 최적화

- `next.config.ts` 파일에 다음과 같은 최적화 설정이 적용되어 있습니다.
  - **빌드 시 검사 비활성화**: 커밋 시점에 이미 검사가 이루어지므로, `next build` 과정에서는 ESLint와 TypeScript 검사를 건너뛰어 빌드 속도를 향상시킵니다.
  - **프로덕션 소스맵 비활성화**: `productionBrowserSourceMaps: false` 옵션을 통해 빌드 결과물의 용량을 줄이고 빌드 시간을 단축합니다.

---

## 📝 스크립트

- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run start`: 프로덕션 서버 실행
- `npm run lint`: ESLint 실행

---

## 📄 라이선스

MIT License