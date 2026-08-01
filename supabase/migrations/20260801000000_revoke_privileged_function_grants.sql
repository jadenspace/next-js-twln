-- 포인트/경험치/승인 함수의 직접 실행 권한을 브라우저 롤에서 회수한다.
--
-- ⚠️ 실행 순서가 중요합니다.
--    1. 먼저 애플리케이션 코드를 배포하십시오. 이 커밋에서 아래 라우트들이
--       사용자 세션 클라이언트 대신 service_role 클라이언트로 RPC 를 호출하도록
--       변경되었습니다:
--         - src/app/api/attendance/check-in/route.ts        (add_points, add_xp)
--         - src/app/api/lotto/analysis/stats/route.ts       (deduct_points, add_xp)
--         - src/app/api/lotto/analysis/simulation/route.ts  (add_xp)
--         - src/app/api/points/admin/grant/route.ts         (add_points)
--         - src/app/api/community/posts/route.ts            (add_xp)
--         - src/app/api/community/posts/[id]/comments/route.ts (add_xp)
--       또한 브라우저에서 approve_user 를 호출하던 코드를 제거하고 서버 라우트
--       (src/app/api/auth/approval/, service_role 로 테이블 직접 갱신)로 옮겼습니다.
--    2. 그 다음 이 마이그레이션을 실행하십시오.
--
--    순서를 뒤집으면 출석 체크와 심화 통계 결제가 즉시 실패합니다.
--
-- 사전 확인: supabase/audit/check-privileged-function-grants.sql 를 먼저 실행해
--           현재 상태를 기록해 두십시오.
--
-- 함수 시그니처를 저장소에서 확인할 수 없으므로(기존 SQL 파일 부재), 이름으로
-- 조회해 오버로드를 포함한 모든 정의에 대해 동적으로 권한을 조정합니다.

do $$
declare
  target_function record;
  browser_role    text;
begin
  for target_function in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('add_points', 'deduct_points', 'add_xp', 'approve_user')
  loop
    -- PUBLIC 기본 권한 제거. 이것을 지우지 않으면 anon/authenticated 에서
    -- 개별 REVOKE 를 해도 PUBLIC 을 통해 여전히 실행할 수 있다.
    execute format('revoke all on function %s from public', target_function.signature);

    foreach browser_role in array array['anon', 'authenticated']
    loop
      if exists (select 1 from pg_roles where rolname = browser_role) then
        execute format(
          'revoke all on function %s from %I',
          target_function.signature,
          browser_role
        );
      end if;
    end loop;

    -- 서버 라우트(service_role 키)만 실행할 수 있도록 남긴다.
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format(
        'grant execute on function %s to service_role',
        target_function.signature
      );
    end if;

    raise notice 'hardened %', target_function.signature;
  end loop;

  if not found then
    raise warning
      '대상 함수를 찾지 못했습니다. public 스키마에 add_points/deduct_points/add_xp/approve_user 가 없거나 다른 스키마에 있습니다.';
  end if;
end
$$;

-- 검증: 아래 결과에서 anon_can_execute 와 authenticated_can_execute 가 모두
--       false, service_role_can_execute 가 true 여야 합니다.
select
  p.proname                                                 as function_name,
  has_function_privilege('anon', p.oid, 'EXECUTE')          as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE')  as service_role_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('add_points', 'deduct_points', 'add_xp', 'approve_user')
order by p.proname;
