-- 사용자 레벨 및 뱃지 시스템을 위한 스키마 확장

-- 1. user_profiles 테이블에 레벨 및 XP 컬럼 추가
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS level INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp INT DEFAULT 0;

-- 2. badges 테이블 생성 (메타데이터)
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  criteria_type VARCHAR(50), -- 'attendance', 'analysis', 'post', 'level'
  criteria_value INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. user_badges 테이블 생성 (획득 현황)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- RLS
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Users can view own awarded badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- 기본 뱃지 데이터 삽입
INSERT INTO badges (name, description, criteria_type, criteria_value) VALUES
  ('성실한 분석가', '출석체크 7회 달성', 'attendance', 7),
  ('분석 입문자', '첫 로또 분석 수행', 'analysis', 1),
  ('패턴의 달인', '패턴 분석 10회 수행', 'analysis', 10),
  ('행운의 조언자', '첫 게시글 작성', 'post', 1),
  ('레벨 10 달성', '레벨 10 도달', 'level', 10)
ON CONFLICT (name) DO NOTHING;
