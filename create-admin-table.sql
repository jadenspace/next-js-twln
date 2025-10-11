-- 관리자 권한을 별도 테이블로 관리

-- 1. 관리자 테이블 생성
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  is_active BOOLEAN DEFAULT true
);

-- 2. 초기 관리자 추가
INSERT INTO admin_users (email, role, created_by) 
VALUES ('yeonhos2@naver.com', 'admin', 'system')
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  is_active = true,
  created_at = NOW();

-- 3. 관리자 권한 확인 함수 생성
CREATE OR REPLACE FUNCTION is_admin_user(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE email = user_email AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 관리자 추가 함수
CREATE OR REPLACE FUNCTION add_admin_user(admin_email TEXT, added_by_email TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_users (email, role, created_by)
  VALUES (admin_email, 'admin', added_by_email)
  ON CONFLICT (email) DO UPDATE SET
    is_active = true,
    role = 'admin',
    created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 관리자 제거 함수
CREATE OR REPLACE FUNCTION remove_admin_user(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE admin_users 
  SET is_active = false 
  WHERE email = admin_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 현재 관리자 목록 확인
SELECT email, role, created_at, is_active 
FROM admin_users 
WHERE is_active = true 
ORDER BY created_at DESC; 