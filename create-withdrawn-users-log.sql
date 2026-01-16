-- 탈퇴한 사용자의 정보를 기록하기 위한 테이블 생성
-- 탈퇴 시점의 포인트 잔액 등을 보관하여 추후 문의 등에 대응

create table if not exists withdrawn_users_log (
  id uuid default gen_random_uuid() primary key,
  original_user_id uuid not null, -- 실제 사용자 테이블에서는 삭제되므로 FK가 아님
  email text,
  final_point_balance int default 0,
  withdrawn_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reason text,
  client_ip text,
  user_agent text
);

-- RLS 정책 설정 (선택 사항: 관리자만 볼 수 있도록)
alter table withdrawn_users_log enable row level security;

create policy "Admins can view withdrawn logs"
  on withdrawn_users_log
  for select
  to service_role
  using (true);

-- 주석 추가
comment on table withdrawn_users_log is '탈퇴한 사용자의 주요 정보를 보관하는 로그 테이블';
comment on column withdrawn_users_log.original_user_id is '삭제된 사용자의 원본 UUID';
comment on column withdrawn_users_log.final_point_balance is '탈퇴 시점의 잔여 포인트';
