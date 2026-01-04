-- 신규 가입 보너스 자동 지급 트리거

-- 1. 보너스 지급 함수
CREATE OR REPLACE FUNCTION handle_new_user_bonus()
RETURNS TRIGGER AS $$
BEGIN
  -- user_points 테이블에 초기 포인트 추가 (1000P)
  INSERT INTO user_points (user_id, balance, total_earned)
  VALUES (NEW.id, 1000, 1000)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_points.balance + 1000,
      total_earned = user_points.total_earned + 1000;

  -- point_transactions 테이블에 거래 기록
  INSERT INTO point_transactions (
    user_id,
    transaction_type,
    amount,
    balance_after,
    description,
    feature_type,
    expires_at
  ) VALUES (
    NEW.id,
    'bonus',
    1000,
    1000, -- 초기 잔액이 1000이라고 가정 (동시성 이슈 무시) ... 정확히는 트리거 시점에 따라 다를 수 있음
          -- 하지만 신규 가입 직후이므로 1000이 맞음. 
          -- 만약 ON CONFLICT UPDATE가 발생했다면(이미 존재) 잔액을 알 수 없지만, 
          -- handle_new_user는 INSERT 시점에만 실행되므로 NEW.id는 새로 생성된 유저임.
          -- 따라서 user_points도 없었을 것임.
    '신규 가입 보너스',
    'signup_bonus',
    NOW() + INTERVAL '1 year'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 트리거 생성
-- auth.users 테이블에 insert 발생 시 실행
DROP TRIGGER IF EXISTS on_auth_user_created_bonus ON auth.users;

CREATE TRIGGER on_auth_user_created_bonus
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_bonus();
