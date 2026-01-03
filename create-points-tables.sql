-- 포인트 시스템을 위한 테이블 생성 및 수정

-- 1. user_points 테이블 생성
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 0,  -- 현재 포인트 잔액
  total_earned BIGINT DEFAULT 0,      -- 총 획득 포인트
  total_spent BIGINT DEFAULT 0,       -- 총 사용 포인트
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);

-- RLS
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own points" ON user_points;
CREATE POLICY "Users can view own points" ON user_points
  FOR SELECT USING (auth.uid() = user_id);

-- 2. point_transactions 테이블 생성
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL,  -- 'charge', 'use', 'refund', 'bonus', 'expire'
  amount BIGINT NOT NULL,                 -- 변동 포인트 (양수: 충전, 음수: 사용)
  balance_after BIGINT NOT NULL,          -- 거래 후 잔액
  description TEXT,                       -- 거래 설명
  feature_type VARCHAR(50),               -- 사용한 기능 (예: 'stat_analysis', 'ai_recommend')
  reference_id UUID,                      -- 참조 ID (결제 ID, 분석 결과 ID 등)
  expires_at TIMESTAMPTZ,                 -- 포인트 소멸 예정일
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(transaction_type);

-- RLS
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON point_transactions;
CREATE POLICY "Users can view own transactions" ON point_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- 3. point_packages 테이블 생성
CREATE TABLE IF NOT EXISTS point_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  points BIGINT NOT NULL,                 -- 충전되는 포인트
  price BIGINT NOT NULL,                  -- 가격 (원)
  bonus_points BIGINT DEFAULT 0,          -- 보너스 포인트
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 데이터 삽입
INSERT INTO point_packages (name, points, price, bonus_points, display_order) VALUES
  ('베이직', 1000, 1000, 0, 1),
  ('스탠다드', 5000, 5000, 500, 2),
  ('프리미엄', 10000, 10000, 1500, 3),
  ('VIP', 50000, 50000, 10000, 4)
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE point_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view active packages" ON point_packages;
CREATE POLICY "Everyone can view active packages" ON point_packages
  FOR SELECT USING (is_active = true);

-- 4. user_profiles 테이블 컬럼 추가
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_points_used BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferred_numbers INTEGER[],  -- 사용자 선호 번호
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT TRUE;
