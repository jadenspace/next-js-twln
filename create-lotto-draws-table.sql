-- 로또 당첨 데이터 저장을 위한 테이블 (새 API 스키마 반영)
CREATE TABLE IF NOT EXISTS lotto_draws (
    -- 기본 정보
    drw_no INT PRIMARY KEY,          -- 회차
    drw_no_date DATE NOT NULL,       -- 추첨일
    gm_sq_no INT DEFAULT 0,          -- 내부 게임 시퀀스 번호
    
    -- 당첨 번호
    drwt_no1 INT NOT NULL,           -- 당첨번호 1
    drwt_no2 INT NOT NULL,           -- 당첨번호 2
    drwt_no3 INT NOT NULL,           -- 당첨번호 3
    drwt_no4 INT NOT NULL,           -- 당첨번호 4
    drwt_no5 INT NOT NULL,           -- 당첨번호 5
    drwt_no6 INT NOT NULL,           -- 당첨번호 6
    bnus_no INT NOT NULL,            -- 보너스 번호
    
    -- 1등 당첨 정보
    first_przwner_co INT,            -- 1등 당첨인원 (게임 수)
    first_win_amnt BIGINT,           -- 1등 1게임당 당첨금액
    first_accum_amnt BIGINT,         -- 1등 총 당첨금액
    win_type_auto INT DEFAULT 0,     -- 자동 1등 당첨 수
    win_type_manual INT DEFAULT 0,   -- 수동 1등 당첨 수
    win_type_semi_auto INT DEFAULT 0,-- 반자동 1등 당첨 수
    
    -- 2등 당첨 정보
    rnk2_win_nope INT DEFAULT 0,     -- 2등 당첨 게임 수
    rnk2_win_amt BIGINT DEFAULT 0,   -- 2등 1게임당 당첨금
    rnk2_sum_win_amt BIGINT DEFAULT 0,-- 2등 총 당첨금
    
    -- 3등 당첨 정보
    rnk3_win_nope INT DEFAULT 0,     -- 3등 당첨 게임 수
    rnk3_win_amt BIGINT DEFAULT 0,   -- 3등 1게임당 당첨금
    rnk3_sum_win_amt BIGINT DEFAULT 0,-- 3등 총 당첨금
    
    -- 4등 당첨 정보
    rnk4_win_nope INT DEFAULT 0,     -- 4등 당첨 게임 수
    rnk4_win_amt BIGINT DEFAULT 0,   -- 4등 1게임당 당첨금
    rnk4_sum_win_amt BIGINT DEFAULT 0,-- 4등 총 당첨금
    
    -- 5등 당첨 정보
    rnk5_win_nope INT DEFAULT 0,     -- 5등 당첨 게임 수
    rnk5_win_amt BIGINT DEFAULT 0,   -- 5등 1게임당 당첨금
    rnk5_sum_win_amt BIGINT DEFAULT 0,-- 5등 총 당첨금
    
    -- 전체 통계
    sum_win_nope INT DEFAULT 0,      -- 전체 당첨 게임 수
    rlvt_epsd_sum_ntsl_amt BIGINT DEFAULT 0, -- 해당 회차 총 지급 당첨금
    whol_epsd_sum_ntsl_amt BIGINT DEFAULT 0, -- 누적 총 금액
    tot_sell_amnt BIGINT,            -- 총판매금액 (구 API에서만 제공, nullable)
    
    -- 기타
    excel_rnk VARCHAR(10),           -- 최고 당첨 등수
    created_at TIMESTAMPTZ DEFAULT NOW() -- 데이터 저장 시각
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_lotto_draws_date ON lotto_draws(drw_no_date DESC);
