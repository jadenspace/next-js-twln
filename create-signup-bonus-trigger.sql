-- 신규 가입 보너스 자동 지급 트리거

-- 1. 보너스 지급 함수
CREATE OR REPLACE FUNCTION handle_new_user_bonus()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
      1000, -- 초기 잔액이 1000이라고 가정
      '신규 가입 보너스',
      'signup_bonus',
      NOW() + INTERVAL '1 year'
    );
  EXCEPTION WHEN OTHERS THEN
    -- 오류 발생 시 로그를 남기고 회원가입은 진행되도록 함 (중요)
    RAISE WARNING '신규 회원 보너스 지급 실패: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 트리거 생성
-- auth.users 테이블에 insert 발생 시 실행
DROP TRIGGER IF EXISTS on_auth_user_created_bonus ON auth.users;

CREATE TRIGGER on_auth_user_created_bonus
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_bonus();
