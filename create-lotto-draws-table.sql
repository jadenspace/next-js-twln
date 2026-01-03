-- 로또 당첨 데이터 저장을 위한 테이블
CREATE TABLE IF NOT EXISTS lotto_draws (
    drw_no INT PRIMARY KEY,          -- 회차
    drw_no_date DATE NOT NULL,       -- 추첨일
    tot_sell_amnt BIGINT,            -- 총판매금액
    first_win_amnt BIGINT,           -- 1등 당첨금액
    first_przwner_co INT,            -- 1등 당첨인원
    first_accum_amnt BIGINT,         -- 1등 누적금액
    drwt_no1 INT NOT NULL,           -- 당첨번호 1
    drwt_no2 INT NOT NULL,           -- 당첨번호 2
    drwt_no3 INT NOT NULL,           -- 당첨번호 3
    drwt_no4 INT NOT NULL,           -- 당첨번호 4
    drwt_no5 INT NOT NULL,           -- 당첨번호 5
    drwt_no6 INT NOT NULL,           -- 당첨번호 6
    bnus_no INT NOT NULL,            -- 보너스 번호
    created_at TIMESTAMPTZ DEFAULT NOW() -- 데이터 저장 시각
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_lotto_draws_date ON lotto_draws(drw_no_date DESC);
