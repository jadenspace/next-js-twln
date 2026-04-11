# 자주 빠지는 함정들

> **"다들 비슷한 곳에서 삽질한다"**

---

## 🎨 1. AI Purple Problem (UI 과다 꾸밈)

### 증상
- 보라색, 분홍색, 네온 그라데이션 남발
- 폰트 크기가 너무 큼 (text-2xl 기본)
- 불필요한 애니메이션과 그림자
- 한 화면에 색상 5개 이상

### 예방법
```
디자인 규칙:
- shadcn/ui 기본 스타일만 사용
- 색상: 흑백 + 포인트 1개만
- 그라데이션: 사용 금지
- 폰트: text-sm 기본
- 애니메이션: hover 효과만 허용
```

### 수정 프롬프트
```
UI가 너무 화려해. 다음 규칙으로 단순화해줘:
1. 모든 그라데이션 제거
2. 배경은 slate-900 단색
3. 텍스트 색상은 white, slate-400만
4. 폰트 크기 한 단계씩 줄여줘
```

---

## 🔐 2. RLS 권한 문제

### 증상
- 데이터가 안 보임 (SELECT 정책 누락)
- 저장이 안 됨 (INSERT 정책 누락)
- 401/403 에러
- "Database error saving new user"

### 예방법
```sql
-- 테이블 생성 시 바로 RLS 설정
CREATE TABLE my_table (...);

ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- SELECT + INSERT + UPDATE + DELETE 모두
CREATE POLICY "Users can view own" ON my_table
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own" ON my_table
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 디버깅 팁
```
Supabase SQL Editor에서 직접 확인:
SELECT * FROM my_table; -- RLS 적용
SELECT * FROM my_table; -- RLS 우회 (service role로)
```

---

## 📊 3. 도메인 로직 오류

### 증상
- 로또 번호가 0~44로 생성됨 (1~45여야 함)
- 중복 번호 허용됨
- AC값 계산 공식 틀림
- 당첨 등수 판정 오류

### 예방법
- 도메인 규칙 문서화해서 프롬프트에 포함
- 결과 직접 검증
- 테스트 케이스 요청

### 검증 프롬프트
```
방금 만든 로또 생성기 테스트해줘.
확인 사항:
1. 모든 번호가 1~45 사이인지
2. 중복 번호 없는지
3. 6개 정확히 생성되는지
```

---

## ⚡ 4. 성능 문제

### 증상
- 페이지 로딩 느림
- 번들 사이즈 큼
- 불필요한 리렌더링
- API 호출 과다

### 원인 & 해결
| 원인 | 해결 |
|-----|-----|
| barrel imports | `optimizePackageImports` 설정 |
| 3D 라이브러리 | `next/dynamic`으로 lazy load |
| 매번 API 호출 | TanStack Query 캐싱 |
| 큰 컴포넌트 | 코드 스플리팅 |

---

## 🔄 5. 상태 관리 혼란

### 증상
- useState, Redux, Context, Zustand 섞임
- 같은 데이터 여러 곳에서 관리
- 서버 데이터와 클라이언트 데이터 혼재

### 해결책
```
상태 관리 규칙:
- 서버 데이터: TanStack Query만
- 클라이언트 상태: Zustand만
- 폼 상태: React Hook Form 또는 useState
- 전역 상태로 만들지 말 것: 폼 입력값, 모달 open/close
```

---

## 🚫 6. 테스트 없이 진행

### 증상
- 배포 후 발견되는 버그
- 엣지 케이스 미처리
- 에러 핸들링 누락

### 예방법
```
구현 후 매번 확인해줘:
1. 정상 케이스 동작
2. 빈 데이터일 때
3. 에러 발생 시
4. 로딩 상태
```

---

## 📋 체크리스트

배포 전 확인:
- [ ] UI 색상 3개 이하
- [ ] 폰트 크기 적절
- [ ] RLS 정책 모두 설정
- [ ] 도메인 규칙 검증
- [ ] 로딩/에러 상태 처리
- [ ] 번들 사이즈 확인
