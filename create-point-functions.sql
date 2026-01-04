-- 포인트 관리 기능을 위한 DB 함수

-- 1. 포인트 지급 함수 (충전, 보너스 등)
CREATE OR REPLACE FUNCTION add_points(
    user_uuid UUID, 
    amount_to_add BIGINT, 
    transaction_type VARCHAR, 
    description_text TEXT,
    feat_type VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    current_balance BIGINT;
    current_total_earned BIGINT;
    new_balance BIGINT;
    result JSON;
BEGIN
    -- 현재 잔액 가져오기 (없으면 생성)
    SELECT balance, total_earned INTO current_balance, current_total_earned
    FROM user_points
    WHERE user_id = user_uuid;

    IF NOT FOUND THEN
        current_balance := 0;
        current_total_earned := 0;
        INSERT INTO user_points (user_id, balance, total_earned)
        VALUES (user_uuid, 0, 0);
    END IF;

    new_balance := current_balance + amount_to_add;

    -- 포인트 업데이트
    UPDATE user_points
    SET balance = new_balance,
        total_earned = current_total_earned + amount_to_add,
        updated_at = NOW()
    WHERE user_id = user_uuid;

    -- 거래 내역 기록
    INSERT INTO point_transactions (
        user_id, 
        transaction_type, 
        amount, 
        balance_after, 
        description, 
        feature_type
    )
    VALUES (
        user_uuid, 
        transaction_type, 
        amount_to_add, 
        new_balance, 
        description_text, 
        feat_type
    );

    result := json_build_object(
        'success', TRUE,
        'new_balance', new_balance
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- SECURITY DEFINER로 RLS 우회

-- 2. 포인트 차감 함수 (기능 사용 등)
CREATE OR REPLACE FUNCTION deduct_points(
    user_uuid UUID, 
    amount_to_deduct BIGINT, 
    transaction_type VARCHAR, 
    description_text TEXT,
    feat_type VARCHAR DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    current_balance BIGINT;
    current_total_spent BIGINT;
    new_balance BIGINT;
    result JSON;
BEGIN
    -- 현재 잔액 가져오기
    SELECT balance, total_spent INTO current_balance, current_total_spent
    FROM user_points
    WHERE user_id = user_uuid;

    IF NOT FOUND OR current_balance < amount_to_deduct THEN
        RETURN json_build_object('success', FALSE, 'error', 'Insufficient points');
    END IF;

    new_balance := current_balance - amount_to_deduct;

    -- 포인트 업데이트
    UPDATE user_points
    SET balance = new_balance,
        total_spent = COALESCE(current_total_spent, 0) + amount_to_deduct,
        updated_at = NOW()
    WHERE user_id = user_uuid;

    -- 거래 내역 기록
    INSERT INTO point_transactions (
        user_id, 
        transaction_type, 
        amount, 
        balance_after, 
        description, 
        feature_type
    )
    VALUES (
        user_uuid, 
        transaction_type, 
        -amount_to_deduct, 
        new_balance, 
        description_text, 
        feat_type
    );

    result := json_build_object(
        'success', TRUE,
        'new_balance', new_balance
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
