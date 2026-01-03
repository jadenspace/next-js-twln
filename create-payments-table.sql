-- 결제(무통장 입금) 시스템을 위한 테이블 생성

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id VARCHAR(100) UNIQUE NOT NULL,  -- 주문번호 (YYYYMMDD-RANDOM)
  
  -- 결제 정보
  amount BIGINT NOT NULL,                 -- 결제 금액 (원)
  points_amount BIGINT NOT NULL,          -- 충전될 포인트
  payment_method VARCHAR(50) DEFAULT 'bank_transfer', -- 'bank_transfer'
  
  -- 무통장 입금 정보
  depositor_name VARCHAR(100),            -- 입금자명
  bank_name VARCHAR(100),                 -- 입금 은행 (선택)
  account_number VARCHAR(100),            -- 입금 계좌 (참고용)
  
  -- 상태 관리
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'cancelled', 'refunded'
  
  -- 감사 정보
  completed_at TIMESTAMPTZ,               -- 승인/완료 일시
  cancelled_at TIMESTAMPTZ,               -- 취소 일시
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (재생성 시 오류 방지)
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

-- 정책 생성
-- 1. 사용자는 자신의 결제 내역만 조회 가능
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- 2. 사용자는 자신의 결제 요청(입금 대기)을 생성 가능
CREATE POLICY "Users can create payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- (관리자 정책은 별도 admin 테이블/로직이나 Supabase 대시보드에서 관리, 
--  혹은 service_role 키를 사용하는 API 라우트에서 처리하므로 여기서는 사용자 조회/생성만 허용)
