-- yeonhos2@naver.com에게 관리자 권한 부여

-- 1. 기존 데이터 확인
SELECT email, approved_by, is_active, approved_at 
FROM approved_users 
WHERE email = 'yeonhos2@naver.com';

-- 2. 관리자 권한 부여 (자체 승인으로 변경)
UPDATE approved_users 
SET 
  approved_by = 'yeonhos2@naver.com',
  is_active = true,
  approved_at = NOW(),
  updated_at = NOW()
WHERE email = 'yeonhos2@naver.com';

-- 3. 만약 사용자가 없다면 새로 추가
INSERT INTO approved_users (email, approved_by, is_active, approved_at)
VALUES ('yeonhos2@naver.com', 'yeonhos2@naver.com', true, NOW())
ON CONFLICT (email) DO UPDATE SET
  approved_by = 'yeonhos2@naver.com',
  is_active = true,
  approved_at = NOW(),
  updated_at = NOW();

-- 4. 결과 확인
SELECT email, approved_by, is_active, approved_at 
FROM approved_users 
WHERE email = 'yeonhos2@naver.com'; 