-- 출석체크 기능 테이블 생성

CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, check_in_date)  -- 하루에 한 번만 가능
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_id ON attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_date ON attendance_logs(check_in_date);

-- RLS
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own attendance" ON attendance_logs;
CREATE POLICY "Users can view own attendance" ON attendance_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own attendance" ON attendance_logs;
CREATE POLICY "Users can create own attendance" ON attendance_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
