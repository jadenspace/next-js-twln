-- 사용자 역할(Role) 추가

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 특정 사용자(개발자)를 관리자로 설정 (필요시 이메일 수정)
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'admin@twln.com'; -- 예시
