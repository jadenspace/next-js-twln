-- XP 추가 및 레벨업 처리를 위한 함수

CREATE OR REPLACE FUNCTION add_xp(user_uuid UUID, xp_to_add INT)
RETURNS JSON AS $$
DECLARE
    current_xp INT;
    current_level INT;
    xp_needed INT;
    leveled_up BOOLEAN := FALSE;
    result JSON;
BEGIN
    -- 현재 정보 가져오기
    SELECT xp, level INTO current_xp, current_level
    FROM user_profiles
    WHERE id = user_uuid;

    -- XP 업데이트
    current_xp := current_xp + xp_to_add;
    
    -- 레벨업 체크 (예: 다음 레벨 필요 XP = current_level * 100)
    xp_needed := current_level * 100;
    
    WHILE current_xp >= xp_needed LOOP
        current_level := current_level + 1;
        current_xp := current_xp - xp_needed;
        xp_needed := current_level * 100;
        leveled_up := TRUE;
    END LOOP;

    -- 결과 저장
    UPDATE user_profiles
    SET xp = current_xp,
        level = current_level,
        updated_at = NOW()
    WHERE id = user_uuid;

    result := json_build_object(
        'new_xp', current_xp,
        'new_level', current_level,
        'leveled_up', leveled_up
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;
