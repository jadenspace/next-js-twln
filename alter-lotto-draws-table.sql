-- 로또 당첨 데이터 테이블에 새 필드 추가
-- 새로운 API 스키마에 맞춰 컬럼 추가

-- 1등 당첨 정보 (누락된 컬럼 추가)
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS first_accum_amnt BIGINT;

-- 자동/수동/반자동 1등 당첨 수
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS win_type_auto INT DEFAULT 0;
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS win_type_manual INT DEFAULT 0;
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS win_type_semi_auto INT DEFAULT 0;

-- 2등 당첨 정보
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS rnk2_win_nope INT DEFAULT 0;
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS rnk2_win_amt BIGINT DEFAULT 0;
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS rnk2_sum_win_amt BIGINT DEFAULT 0;

-- 3등 당첨 정보
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS rnk3_win_nope INT DEFAULT 0;
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS rnk3_win_amt BIGINT DEFAULT 0;
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS rnk3_sum_win_amt BIGINT DEFAULT 0;

-- 4등 당첨 정보
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS rnk4_win_nope INT DEFAULT 0;
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS rnk4_win_amt BIGINT DEFAULT 0;
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS rnk4_sum_win_amt BIGINT DEFAULT 0;

-- 5등 당첨 정보
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS rnk5_win_nope INT DEFAULT 0;
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS rnk5_win_amt BIGINT DEFAULT 0;
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS rnk5_sum_win_amt BIGINT DEFAULT 0;

-- 전체 통계
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS sum_win_nope INT DEFAULT 0; -- 전체 당첨 게임 수
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS rlvt_epsd_sum_ntsl_amt BIGINT DEFAULT 0; -- 해당 회차 총 지급 당첨금
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS whol_epsd_sum_ntsl_amt BIGINT DEFAULT 0; -- 누적 총 금액

-- 기타 정보
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS gm_sq_no INT DEFAULT 0; -- 내부 게임 시퀀스 번호
ALTER TABLE lotto_draws ADD COLUMN IF NOT EXISTS excel_rnk VARCHAR(10); -- 최고 당첨 등수

-- 기존 컬럼명 변경 (tot_sell_amnt는 새 API에서 제공하지 않으므로 nullable로 변경)
ALTER TABLE lotto_draws ALTER COLUMN tot_sell_amnt DROP NOT NULL;

COMMENT ON COLUMN lotto_draws.win_type_auto IS '자동 1등 당첨 수';
COMMENT ON COLUMN lotto_draws.win_type_manual IS '수동 1등 당첨 수';
COMMENT ON COLUMN lotto_draws.win_type_semi_auto IS '반자동 1등 당첨 수';
COMMENT ON COLUMN lotto_draws.rlvt_epsd_sum_ntsl_amt IS '해당 회차 총 지급 당첨금';
COMMENT ON COLUMN lotto_draws.whol_epsd_sum_ntsl_amt IS '누적 총 금액';
