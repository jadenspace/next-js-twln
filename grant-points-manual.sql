-- ============================================
-- 사용자 포인트 수동 지급 SQL 스크립트
-- ============================================
-- Supabase SQL Editor에서 실행하세요.

-- ============================================
-- 1. 이메일로 포인트 지급 (단일 사용자)
-- ============================================
-- 사용 전에 이메일과 포인트를 수정하세요
SELECT add_points(
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),  -- 👈 이메일 수정
  10000,                    -- 👈 포인트 금액 수정
  'bonus',                  -- 거래 타입 (bonus, refund, compensation 등)
  '관리자 수동 지급',         -- 👈 지급 사유 수정
  'admin_manual'            -- 기능 타입
);


-- ============================================
-- 2. 사용자 UUID로 직접 지급
-- ============================================
-- UUID를 알고 있는 경우
SELECT add_points(
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::uuid,  -- 👈 사용자 UUID 입력
  10000,                    -- 👈 포인트 금액 수정
  'bonus',
  '관리자 수동 지급',
  'admin_manual'
);


-- ============================================
-- 3. 여러 사용자에게 일괄 지급
-- ============================================
DO $$
DECLARE
  user_email TEXT;
BEGIN
  -- 👇 이메일 목록 수정
  FOR user_email IN
    SELECT unnest(ARRAY[
      'user1@example.com',
      'user2@example.com',
      'user3@example.com'
    ])
  LOOP
    PERFORM add_points(
      (SELECT id FROM auth.users WHERE email = user_email),
      5000,                 -- 👈 포인트 금액 수정
      'bonus',
      '일괄 이벤트 지급',     -- 👈 지급 사유 수정
      'admin_event'
    );
  END LOOP;

  RAISE NOTICE '포인트 지급 완료';
END $$;


-- ============================================
-- 4. 포인트 차감 (필요시)
-- ============================================
SELECT deduct_points(
  (SELECT id FROM auth.users WHERE email = 'user@example.com'),  -- 👈 이메일 수정
  1000,                     -- 👈 차감할 포인트
  'penalty',                -- 거래 타입
  '관리자 차감',              -- 👈 차감 사유
  'admin_manual'
);


-- ============================================
-- 5. 사용자 포인트 조회
-- ============================================
-- 특정 사용자 조회
SELECT
  u.email,
  u.id as user_id,
  up.balance as 현재포인트,
  up.total_earned as 총획득포인트,
  up.total_spent as 총사용포인트,
  up.updated_at as 마지막업데이트
FROM user_points up
JOIN auth.users u ON u.id = up.user_id
WHERE u.email = 'user@example.com';  -- 👈 이메일 수정

-- 전체 사용자 포인트 현황 (상위 100명)
SELECT
  u.email,
  up.balance,
  up.total_earned,
  up.updated_at
FROM user_points up
JOIN auth.users u ON u.id = up.user_id
ORDER BY up.balance DESC
LIMIT 100;


-- ============================================
-- 6. 포인트 거래 내역 조회
-- ============================================
-- 특정 사용자의 최근 거래 내역
SELECT
  u.email,
  pt.transaction_type,
  pt.amount,
  pt.balance_after,
  pt.description,
  pt.created_at
FROM point_transactions pt
JOIN auth.users u ON u.id = pt.user_id
WHERE u.email = 'user@example.com'  -- 👈 이메일 수정
ORDER BY pt.created_at DESC
LIMIT 20;


-- ============================================
-- 7. 조건부 포인트 지급 (활성 사용자만)
-- ============================================
-- 예: 최근 30일 이내 활동한 사용자에게만 지급
DO $$
DECLARE
  user_record RECORD;
  count INT := 0;
BEGIN
  FOR user_record IN
    SELECT DISTINCT u.id, u.email
    FROM auth.users u
    WHERE u.last_sign_in_at > NOW() - INTERVAL '30 days'
  LOOP
    PERFORM add_points(
      user_record.id,
      3000,                 -- 👈 포인트 금액 수정
      'bonus',
      '활성 사용자 보너스',
      'admin_event'
    );
    count := count + 1;
  END LOOP;

  RAISE NOTICE '총 % 명에게 포인트 지급 완료', count;
END $$;


-- ============================================
-- 참고: 거래 타입 (transaction_type)
-- ============================================
-- 'bonus'        - 보너스
-- 'purchase'     - 구매
-- 'refund'       - 환불
-- 'compensation' - 보상
-- 'penalty'      - 차감/패널티
-- 'transfer'     - 이체
-- 'reward'       - 리워드
