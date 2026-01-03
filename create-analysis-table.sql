-- 로또 분석 결과 저장을 위한 테이블 생성

CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL,     -- 'stat', 'pattern', 'ai_recommend', 'simulation'
  input_params JSON,                      -- 입력 파라미터 (사용자 선택 옵션)
  result_data JSON NOT NULL,              -- 분석 결과 데이터
  points_spent BIGINT NOT NULL,           -- 소모한 포인트
  is_bookmarked BOOLEAN DEFAULT FALSE,    -- 북마크 여부
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_type ON analysis_results(analysis_type);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_results_bookmarked ON analysis_results(is_bookmarked) WHERE is_bookmarked = TRUE;

-- RLS (Row Level Security)
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analysis results" ON analysis_results;
DROP POLICY IF EXISTS "Users can create analysis results" ON analysis_results;
DROP POLICY IF EXISTS "Users can update own analysis results" ON analysis_results;
DROP POLICY IF EXISTS "Users can delete own analysis results" ON analysis_results;

-- 정책 생성
CREATE POLICY "Users can view own analysis results" ON analysis_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create analysis results" ON analysis_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis results" ON analysis_results
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis results" ON analysis_results
  FOR DELETE USING (auth.uid() = user_id);
