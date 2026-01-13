-- === 최종 통합 RLS 정책 설정 스크립트 ===
-- 이 스크립트는 다음 테이블들의 RLS를 재설정하여 API 통신 오류(403/500) 및 무한 재귀 문제를 해결합니다.
-- 대상 테이블: admin_users, approved_users, lotto_draws, user_profiles, payments

-- 1. Helper 함수: is_admin() 정의
-- SECURITY DEFINER를 사용하여 RLS 무한 재귀를 방지합니다.
-- 이 함수는 admin_users 테이블을 참조합니다.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- 현재 로그인한 사용자의 이메일이 admin_users 테이블에 있고 active 상태인지 확인
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE email = auth.jwt() ->> 'email' 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. admin_users (관리자 목록)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can see their own admin status" ON public.admin_users;
DROP POLICY IF EXISTS "Admins can manage admin_users" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users viewable by self" ON public.admin_users;

-- 정책 생성
-- 본인은 본인의 상태 조회 가능
CREATE POLICY "Users can see their own admin status" ON public.admin_users
  FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- 관리자는 모든 관리자 정보 관리 가능 (is_admin() 함수 사용)
CREATE POLICY "Admins can manage admin_users" ON public.admin_users
  FOR ALL USING (is_admin());


-- 3. approved_users (승인 회원 목록)
ALTER TABLE public.approved_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All users can read the approved_users table" ON public.approved_users;
DROP POLICY IF EXISTS "Admins can manage approved_users" ON public.approved_users;
DROP POLICY IF EXISTS "승인된 사용자 목록 조회 허용" ON public.approved_users;

-- 모든 사용자(비로그인 포함 여부는 앱 정책에 따름, 여기선 로그인된 사용자 기준)가 조회 가능
-- 만약 비로그인 접근도 필요하다면 USING (true) 사용
CREATE POLICY "All users can read the approved_users table" ON public.approved_users
  FOR SELECT USING (true);

-- 관리자만 수정 가능
CREATE POLICY "Admins can manage approved_users" ON public.approved_users
  FOR ALL USING (is_admin());


-- 4. lotto_draws (로또 결과 데이터)
-- API 통신 오류의 주요 원인이 될 수 있음 (RLS 켜짐 + 정책 없음 = 차단)
ALTER TABLE public.lotto_draws ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read lotto_draws" ON public.lotto_draws;
DROP POLICY IF EXISTS "Admins write lotto_draws" ON public.lotto_draws;

-- 누구나 조회 가능 (API 통신 원활화)
CREATE POLICY "Public read lotto_draws" ON public.lotto_draws
  FOR SELECT USING (true);

-- 쓰기는 관리자만 가능
-- 주의: Cron Job이 API 키(Service Role Key)를 사용하지 않고 일반 클라이언트로 접속하면 이 정책에 막힐 수 있습니다.
-- Cron Job 코드를 수정하거나, 서버 사이드 클라이언트를 사용해야 합니다.
CREATE POLICY "Admins write lotto_draws" ON public.lotto_draws
  FOR ALL USING (is_admin());


-- 5. user_profiles (사용자 프로필)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;

-- 본인 프로필 조회/수정
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 관리자는 모든 프로필 조회
CREATE POLICY "Admins can view all user profiles" ON public.user_profiles
  FOR SELECT USING (is_admin());


-- 6. payments (결제 정보)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;

-- 사용자: 본인 것 조회 및 생성
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 관리자: 모든 권한
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR UPDATE USING (is_admin());


-- 확인용: 현재 관리자 목록 출력
SELECT * FROM admin_users;
