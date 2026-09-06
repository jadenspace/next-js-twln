-- approved_users 의 SELECT 를 "본인 행" 으로 제한한다.
--
-- 배경: approved_users 는 회원 이메일 목록이다. git 이력(fix-final-rls.sql)에 남은
-- 마지막 정책은 아래와 같아, anon 키만 있으면 누구나 전체 회원 이메일과
-- approved_by 를 내려받을 수 있었다.
--
--   CREATE POLICY "All users can read the approved_users table"
--     ON public.approved_users FOR SELECT USING (true);
--
-- 이 커밋에서 브라우저가 approved_users 를 직접 읽는 코드를 모두 제거했다.
--   - 관리자 회원 목록: GET /api/auth/approval (requireAdmin, service_role)
--   - 본인 승인 상태:   user_profiles.is_approved (기존과 동일)
--   - 정지 여부 판정:   src/shared/lib/auth/guards.ts (service_role)
-- 서버는 service_role 로 접근하므로 RLS 의 영향을 받지 않는다. 따라서 이 정책을
-- 좁혀도 애플리케이션 동작은 바뀌지 않는다.
--
-- ⚠️ 실행 전 확인
--   1. 먼저 애플리케이션 코드를 배포할 것. 이전 코드가 남아 있으면 관리자 페이지의
--      회원 목록이 비어 보인다.
--   2. 정책 이름은 저장소에 DDL 이 없어 git 이력으로만 확인한 값이다. Supabase 대시보드
--      Authentication → Policies 에서 approved_users 의 현재 정책 목록을 확인하고,
--      이름이 다르면 아래 DROP 문의 이름을 맞춰 수정할 것. (DROP ... IF EXISTS 는
--      이름이 틀리면 조용히 아무 일도 하지 않는다.)

alter table public.approved_users enable row level security;

drop policy if exists "All users can read the approved_users table" on public.approved_users;
drop policy if exists "Users can read own approval row" on public.approved_users;

create policy "Users can read own approval row"
  on public.approved_users
  for select
  to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));
