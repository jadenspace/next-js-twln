-- 진단 전용 스크립트 (읽기 전용, 아무것도 변경하지 않습니다)
--
-- 목적: 포인트/경험치/승인을 조작하는 SECURITY DEFINER 함수를
--       브라우저 세션(anon / authenticated 롤)에서 직접 호출할 수 있는지 확인한다.
--
-- 배경: 이 함수들은 대상 사용자를 인자(user_uuid)로 받는다. authenticated 롤에
--       EXECUTE 권한이 있으면, 로그인한 사용자가 브라우저 콘솔에서
--       supabase.rpc('add_points', { user_uuid: <자기 ID>, amount_to_add: 99999999, ... })
--       를 호출해 포인트를 무제한 발행할 수 있다.
--
-- Supabase Dashboard > SQL Editor 에 붙여넣고 실행하십시오.

-- [1] 핵심 질문: 브라우저 롤이 이 함수를 실행할 수 있는가?
--     anon_can_execute / authenticated_can_execute 가 하나라도 true 이면 취약하다.
select
  p.proname                                            as function_name,
  pg_get_function_identity_arguments(p.oid)            as arguments,
  p.prosecdef                                          as is_security_definer,
  has_function_privilege('anon', p.oid, 'EXECUTE')          as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE')  as service_role_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'add_points',
    'deduct_points',
    'add_xp',
    'approve_user',
    'increment_view_count'
  )
order by p.proname;

-- [2] 실제 ACL 원본. proacl 이 NULL 이면 명시적 GRANT 가 없다는 뜻이고,
--     PostgreSQL 기본값에 따라 EXECUTE 가 PUBLIC 에 부여된 상태다(= 취약).
select
  p.proname                       as function_name,
  p.proacl                        as raw_acl,
  case
    when p.proacl is null then 'DEFAULT: EXECUTE granted to PUBLIC — 취약'
    else 'explicit ACL — 위 [1] 결과로 판단'
  end                             as interpretation
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('add_points', 'deduct_points', 'add_xp', 'approve_user')
order by p.proname;

-- [3] 함수 본문 확인. add_points/deduct_points 가 user_uuid 를 auth.uid() 로
--     제한하는지, deduct_points 가 잔액을 원자적으로(UPDATE ... WHERE balance >= x)
--     차감하는지 직접 읽어보십시오.
select
  p.proname                    as function_name,
  pg_get_functiondef(p.oid)    as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('add_points', 'deduct_points', 'add_xp', 'approve_user')
order by p.proname;
