/**
 * 라우트 테스트용 Supabase 클라이언트 목.
 *
 * `.from(table)` 이후의 어떤 메서드 체인이든 받아들이고, await 하면 테이블별로
 * 미리 정해 둔 결과를 돌려준다. 호출된 메서드와 인자는 `calls` 에 기록되므로
 * 테스트가 "insert 에 어떤 값이 들어갔는지" 를 검사할 수 있다.
 */
export interface RecordedCall {
  table: string;
  method: string;
  args: unknown[];
}

export interface SupabaseMockOptions {
  tables?: Record<string, unknown>;
  rpc?: Record<string, unknown>;
  user?: { id: string; email?: string; email_confirmed_at?: string } | null;
}

export function createSupabaseMock(options: SupabaseMockOptions = {}) {
  const calls: RecordedCall[] = [];
  const tables = options.tables ?? {};
  const rpcResults = options.rpc ?? {};

  const chain = (table: string) => {
    const result = tables[table] ?? { data: null, error: null };
    const proxy: Record<string | symbol, unknown> = new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === "then") {
            return (
              resolve: (value: unknown) => unknown,
              reject: (reason: unknown) => unknown,
            ) => Promise.resolve(result).then(resolve, reject);
          }
          return (...args: unknown[]) => {
            calls.push({ table, method: String(prop), args });
            return proxy;
          };
        },
      },
    );
    return proxy;
  };

  const client = {
    from: (table: string) => chain(table),
    rpc: async (name: string, args: unknown) => {
      calls.push({ table: `rpc:${name}`, method: "rpc", args: [args] });
      return rpcResults[name] ?? { data: null, error: null };
    },
    auth: {
      getUser: async () => ({
        data: { user: options.user ?? null },
        error: null,
      }),
    },
  };

  return { client, calls };
}

/** 특정 테이블에 대해 특정 메서드가 호출됐을 때 넘긴 첫 인자를 찾는다. */
export function findCallArg(
  calls: RecordedCall[],
  table: string,
  method: string,
): unknown {
  return calls.find((c) => c.table === table && c.method === method)?.args[0];
}
