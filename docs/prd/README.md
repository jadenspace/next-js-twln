# 로또탐정 PRD (Product Requirements Document)

> **바이브코딩으로 만든 풀스택 서비스 + 실전 노하우 전수**

---

## 🎯 이 문서의 목적

이 PRD는 **바이브코딩(Vibe Coding)**으로 실제 서비스를 완성한 과정과 노하우를 공유합니다.

- 📦 **쇼케이스**: 바이브코딩으로 이런 수준의 서비스를 만들 수 있다
- 📚 **노하우 전수**: 같은 실수를 반복하지 않도록 삽질 경험 공유
- 🔄 **재현 가이드**: 이 문서를 따라 비슷한 서비스를 만들 수 있음

---

## 📁 문서 구조

### 기반 문서
| 문서 | 설명 |
|------|------|
| [01-overview.md](./01-overview.md) | 프로젝트 개요 & 바이브코딩 동기 |
| [02-tech-stack.md](./02-tech-stack.md) | 기술 스택 & FSD 아키텍처 |
| [03-database-schema.md](./03-database-schema.md) | DB 설계 & ERD & RLS 노하우 |
| [04-auth-system.md](./04-auth-system.md) | 인증/인가 & 미들웨어 |
| [05-api-specification.md](./05-api-specification.md) | API 명세서 |
| [06-user-flows.md](./06-user-flows.md) | 사용자 시나리오 |

### 페이지별 PRD
| 페이지 | 문서 |
|--------|------|
| 랜딩 | [pages/landing.md](./pages/landing.md) |
| 인증 | [pages/auth.md](./pages/auth.md) |
| 로또 분석 | [pages/lotto-analysis.md](./pages/lotto-analysis.md) |
| 번호 생성기 | [pages/lotto-generate.md](./pages/lotto-generate.md) |
| 마이페이지 | [pages/mypage.md](./pages/mypage.md) |
| 포인트 | [pages/points.md](./pages/points.md) |
| 결제 | [pages/payments.md](./pages/payments.md) |
| 리포트 | [pages/reports.md](./pages/reports.md) |
| 관리자 | [pages/admin.md](./pages/admin.md) |

### 기능 심화
| 기능 | 문서 |
|------|------|
| 게이미피케이션 | [features/gamification.md](./features/gamification.md) |
| 로또 알고리즘 | [features/lotto-algorithm.md](./features/lotto-algorithm.md) |
| 3D 시뮬레이션 | [features/3d-simulation.md](./features/3d-simulation.md) |
| Cron 자동화 | [features/cron-automation.md](./features/cron-automation.md) |

### 🎯 바이브코딩 가이드 (핵심!)
| 주제 | 문서 |
|------|------|
| 시작 전 준비 | [vibe-coding-guide/01-before-start.md](./vibe-coding-guide/01-before-start.md) |
| 프롬프트 패턴 | [vibe-coding-guide/02-prompt-patterns.md](./vibe-coding-guide/02-prompt-patterns.md) |
| 흔한 함정들 | [vibe-coding-guide/03-common-pitfalls.md](./vibe-coding-guide/03-common-pitfalls.md) |
| 디버깅 팁 | [vibe-coding-guide/04-debugging-tips.md](./vibe-coding-guide/04-debugging-tips.md) |
| 도메인 지식 | [vibe-coding-guide/05-domain-knowledge.md](./vibe-coding-guide/05-domain-knowledge.md) |

---

## ⚡ 바이브코딩 핵심 인사이트 (TL;DR)

| 영역 | 문제 | 해결책 | 교훈 |
|-----|-----|-------|-----|
| **UI** | AI Purple Problem | shadcn/ui + 디자인 스킬 | 디자인 시스템 먼저 |
| **DB** | 구조 이해 부족 | SQL 파일 분리 관리 | 복붙 실행 편하게 |
| **RLS** | 권한 오류 속출 | 정책별 테스트 | 처음부터 꼼꼼히 |
| **3D** | 결과물 불만족 | 구체적 레퍼런스 | 프롬프트가 핵심 |
| **도메인** | 잘못된 이해 | 직접 검증 | 본인이 알아야 함 |

---

## 🚀 빠른 시작

1. [01-overview.md](./01-overview.md)로 프로젝트 이해
2. [02-tech-stack.md](./02-tech-stack.md)로 기술 스택 파악
3. [vibe-coding-guide/](./vibe-coding-guide/)로 바이브코딩 노하우 학습
4. 원하는 페이지/기능 문서 참고

---

## 📊 프로젝트 통계

- **개발 기간**: 바이브코딩으로 약 2주
- **주요 기술**: Next.js 15, Supabase, TanStack Query
- **페이지 수**: 13+
- **API 엔드포인트**: 25+
- **DB 테이블**: 12+
