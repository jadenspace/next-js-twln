-- TWLN MVP 승인 시스템 데이터베이스 설정

-- 1. 승인된 사용자 테이블 생성
CREATE TABLE approved_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 사용자 프로필 테이블 생성
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS (Row Level Security) 활성화
ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. 승인된 사용자 테이블 정책
-- 관리자만 모든 승인된 사용자 조회 가능
CREATE POLICY "관리자는 모든 승인된 사용자 조회 가능" ON approved_users
  FOR SELECT USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM approved_users WHERE is_active = true
  ));

-- 관리자만 승인된 사용자 추가/수정 가능
CREATE POLICY "관리자는 승인된 사용자 관리 가능" ON approved_users
  FOR ALL USING (auth.jwt() ->> 'email' IN (
    SELECT email FROM approved_users WHERE is_active = true
  ));

-- 5. 사용자 프로필 테이블 정책
-- 사용자는 자신의 프로필만 조회/수정 가능
CREATE POLICY "사용자는 자신의 프로필만 조회 가능" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "사용자는 자신의 프로필만 수정 가능" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 6. 함수: 사용자 승인 여부 확인
CREATE OR REPLACE FUNCTION is_user_approved(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM approved_users 
    WHERE email = user_email AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 함수: 사용자 프로필 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 트리거: 새 사용자 가입 시 프로필 자동 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 9. 함수: 사용자 승인 상태 업데이트
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

-- 10. 초기 관리자 계정 추가 (실제 이메일로 교체 필요)
-- 아래 줄의 주석을 해제하고 실제 관리자 이메일로 교체하세요
INSERT INTO approved_users (email, approved_by) VALUES ('yeonhos2@naver.com', 'system');

-- 11. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_approved_users_email ON approved_users(email);
CREATE INDEX idx_approved_users_active ON approved_users(is_active);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_approved ON user_profiles(is_approved); 