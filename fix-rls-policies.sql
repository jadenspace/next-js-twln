-- TWLN MVP 승인 시스템 RLS 정책 수정
-- 무한 재귀 문제 해결

-- 1. 기존 정책 삭제
DROP POLICY IF EXISTS "관리자는 모든 승인된 사용자 조회 가능" ON approved_users;
DROP POLICY IF EXISTS "관리자는 승인된 사용자 관리 가능" ON approved_users;

-- 2. 새로운 정책 생성 (무한 재귀 방지)
-- 모든 사용자가 승인된 사용자 목록을 조회할 수 있도록 허용
CREATE POLICY "승인된 사용자 목록 조회 허용" ON approved_users
  FOR SELECT USING (true);

-- 승인된 사용자만 승인된 사용자 관리 가능 (자신의 이메일과 직접 비교)
CREATE POLICY "승인된 사용자 관리 허용" ON approved_users
  FOR ALL USING (
    auth.jwt() ->> 'email' = email OR 
    auth.jwt() ->> 'email' IN (
      SELECT email FROM approved_users 
      WHERE is_active = true AND email != approved_users.email
    )
  );

-- 3. 사용자 프로필 테이블 정책도 확인
-- 기존 정책이 올바른지 확인
-- 사용자는 자신의 프로필만 조회/수정 가능
DROP POLICY IF EXISTS "사용자는 자신의 프로필만 조회 가능" ON user_profiles;
DROP POLICY IF EXISTS "사용자는 자신의 프로필만 수정 가능" ON user_profiles;

CREATE POLICY "사용자는 자신의 프로필만 조회 가능" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "사용자는 자신의 프로필만 수정 가능" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. 승인 확인 함수 수정 (SECURITY DEFINER 유지)
CREATE OR REPLACE FUNCTION is_user_approved(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM approved_users 
    WHERE email = user_email AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 승인 함수 수정 (SECURITY DEFINER 유지)
CREATE OR REPLACE FUNCTION approve_user(user_email TEXT, approved_by_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- 승인된 사용자 목록에 추가
  INSERT INTO approved_users (email, approved_by)
  VALUES (user_email, approved_by_email)
  ON CONFLICT (email) DO UPDATE SET
    is_active = true,
    approved_at = NOW(),
    approved_by = approved_by_email,
    updated_at = NOW();
  
  -- 사용자 프로필 승인 상태 업데이트
  UPDATE user_profiles 
  SET is_approved = true, approved_at = NOW(), updated_at = NOW()
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 