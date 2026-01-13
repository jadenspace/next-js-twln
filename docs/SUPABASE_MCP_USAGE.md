# Supabase MCP 사용 가이드

이 문서는 프로젝트에 설정된 Supabase MCP (Model Context Protocol) 서버를 사용하는 방법을 설명합니다.
MCP를 사용하면 Claude Desktop이나 Cursor와 같은 AI 도구가 Supabase 데이터베이스에 직접 접근하여 테이블 조회, 쿼리 실행 등을 수행할 수 있습니다.

## 1. 설정 확인 (Setup)

`package.json`에 MCP 서버를 실행하기 위한 스크립트가 추가되었습니다.

### 필수 환경 변수

`.env.local` 파일에 다음 변수들이 설정되어 있어야 합니다:

- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key (admin 권한)
- `SUPABASE_ACCESS_TOKEN`: Supabase Personal Access Token (필수)

### 토큰 발급 방법

1. [Supabase Dashboard > Account > Access Tokens](https://supabase.com/dashboard/account/tokens) 페이지로 이동합니다.
2. **Generate New Token**을 클릭하여 새로운 토큰을 생성합니다.
3. 생성된 토큰을 복사하여 `.env.local` 파일에 다음과 같이 추가합니다:

```env
SUPABASE_ACCESS_TOKEN=sbp_...
```

### 실행 테스트 (주의)

터미널에서 `npm run mcp`를 직접 실행하면 **아무런 반응이 없거나 멈춘 것처럼 보일 수 있습니다.**
이는 MCP 서버가 **JSON-RPC 통신을 대기**하고 있는 정상적인 상태입니다. (Stdio 모드)

- 사용자가 직접 입력을 타이핑하는 도구가 아닙니다.
- **Ctrl + C**를 눌러 종료하고, 아래 **AI 클라이언트 연동** 단계를 진행해 주세요.


## 2. AI 클라이언트 연동

### A. Claude Desktop 설정

Claude Desktop 앱에서 Supabase를 사용하려면 설정 파일을 수정해야 합니다.

1. 터미널을 열고 다음 명령어로 설정 파일을 엽니다 (VS Code 예시):
   ```bash
   code ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```
   *파일이 없다면 생성해주세요.*

2. `mcpServers` 항목에 아래 내용을 추가합니다.

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npm",
      "args": ["run", "mcp"],
      "cwd": "/Users/gm_yeonho/jadenspace/next-js-twln"
    }
  }
}
```

3. Claude Desktop을 완전히 종료 후 다시 시작합니다.

### B. Cursor 설정

Cursor에서도 MCP를 지원합니다.

1. **Cursor Settings** (단축키 `Cmd + ,`)를 엽니다.
2. **Features** > **MCP** 섹션으로 이동합니다.
3. **+ Add New MCP Server** 버튼을 클릭합니다.
4. 다음 정보를 입력합니다:
   - **Name**: `supabase`
   - **Type**: `command`
   - **Command**: `npm run mcp`
5. 만약 실행되지 않는다면, 절대 경로를 포함하여 다음과 같이 입력해 보세요:
   - **Command**: `/bin/bash` (또는 zsh 경로)
   - **Args**: `-c "cd /Users/gm_yeonho/jadenspace/next-js-twln && npm run mcp"`

## 3. 사용 가능한 기능

연동이 완료되면 AI에게 다음과 같은 요청을 할 수 있습니다:

- "Users 테이블의 구조를 보여줘"
- "최근 가입한 5명의 사용자 리스트를 뽑아줘"
- "Lotto Draws 테이블에 새로운 데이터를 추가하는 SQL을 작성하고 실행해줘"

## 문제 해결

- **권한 오류**: `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY`가 올바르게 설정되어 있는지 확인하세요. `ANON_KEY`로는 일부 관리자 기능이 제한될 수 있습니다.
- **실행 오류**: `npm run mcp`를 직접 실행했을 때 `env-cmd` 관련 에러가 발생한다면 `npm install`을 다시 실행해 보세요.
