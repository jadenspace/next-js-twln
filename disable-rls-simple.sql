-- 간단한 해결책: RLS 비활성화
-- 애플리케이션 레벨에서 보안 처리

-- 1. RLS 비활성화
ALTER TABLE approved_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 삭제
DROP POLICY IF EXISTS "관리자는 모든 승인된 사용자 조회 가능" ON approved_users;
DROP POLICY IF EXISTS "관리자는 승인된 사용자 관리 가능" ON approved_users;
DROP POLICY IF EXISTS "사용자는 자신의 프로필만 조회 가능" ON user_profiles;
DROP POLICY IF EXISTS "사용자는 자신의 프로필만 수정 가능" ON user_profiles; 