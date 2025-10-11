# 🎨 MUI 사용자를 위한 shadcn/ui 완전 가이드

> **MUI에서 shadcn/ui로 전환하는 모든 것을 알아보세요**

---

## 📋 목차

1. [shadcn/ui란 무엇인가?](#shadcnui란-무엇인가)
2. [MUI vs shadcn/ui 핵심 차이점](#mui-vs-shadcnui-핵심-차이점)
3. [설치 및 설정](#설치-및-설정)
4. [컴포넌트 사용법](#컴포넌트-사용법)
5. [커스터마이징 방법](#커스터마이징-방법)
6. [실제 프로젝트 적용 예제](#실제-프로젝트-적용-예제)
7. [마이그레이션 가이드](#마이그레이션-가이드)
8. [FAQ](#faq)

---

## 🤔 shadcn/ui란 무엇인가?

### 핵심 개념

**shadcn/ui는 컴포넌트 라이브러리가 아닙니다!**

- **MUI**: `npm install @mui/material`로 패키지 설치 후 사용
- **shadcn/ui**: 코드를 복사해서 프로젝트에 직접 넣는 방식 (Copy & Paste)

### 철학의 차이

| 구분             | MUI                        | shadcn/ui                    |
| ---------------- | -------------------------- | ---------------------------- |
| **접근 방식**    | 완성된 라이브러리 사용     | 코드를 복사해서 커스터마이징 |
| **의존성**       | MUI 패키지에 의존          | Radix UI + Tailwind CSS      |
| **커스터마이징** | Theme Provider로 전역 설정 | 각 컴포넌트 파일을 직접 수정 |
| **번들 크기**    | 전체 라이브러리 포함       | 사용하는 컴포넌트만 포함     |

---

## 🔄 MUI vs shadcn/ui 핵심 차이점

### 1. 설치 방식

```bash
# MUI 방식
npm install @mui/material @emotion/react @emotion/styled

# shadcn/ui 방식
npx shadcn@latest add button
```

### 2. 컴포넌트 위치

```
# MUI
node_modules/@mui/material/Button/Button.js  # 숨겨진 파일

# shadcn/ui
src/components/ui/button.tsx  # 직접 접근 가능한 파일
```

### 3. 사용법 비교

```typescript
// MUI 방식
import { Button, Card, CardContent, CardHeader, CardTitle } from '@mui/material';

<Button variant="contained" color="primary" size="large">
  클릭하세요
</Button>

<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
  </CardHeader>
  <CardContent>
    내용
  </CardContent>
</Card>

// shadcn/ui 방식
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

<Button variant="default" size="lg">
  클릭하세요
</Button>

<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
  </CardHeader>
  <CardContent>
    내용
  </CardContent>
</Card>
```

---

## 🛠️ 설치 및 설정

### 1. 프로젝트 초기화

```bash
# Next.js 프로젝트 생성 (이미 있다면 생략)
npx create-next-app@latest my-app --typescript --tailwind --eslint

# shadcn/ui 초기화
npx shadcn@latest init
```

### 2. 설정 파일 확인

`components.json` 파일이 생성됩니다:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### 3. 필수 의존성 설치

```bash
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
```

---

## 🎯 컴포넌트 사용법

### 기본 컴포넌트 추가

```bash
# 단일 컴포넌트
npx shadcn@latest add button

# 여러 컴포넌트 한번에
npx shadcn@latest add button card input select textarea
```

### Button 컴포넌트

```typescript
// MUI Button variants
<Button variant="contained" color="primary">Primary</Button>
<Button variant="contained" color="secondary">Secondary</Button>
<Button variant="outlined" color="primary">Outlined</Button>
<Button variant="text" color="primary">Text</Button>

// shadcn/ui Button variants
<Button variant="default">Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="destructive">Destructive</Button>
```

### Form 컴포넌트들

```typescript
// Input
<Input placeholder="이메일을 입력하세요" type="email" />

// Textarea
<Textarea placeholder="메시지를 입력하세요" />

// Select
<Select>
  <SelectTrigger>
    <SelectValue placeholder="옵션을 선택하세요" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">옵션 1</SelectItem>
    <SelectItem value="option2">옵션 2</SelectItem>
  </SelectContent>
</Select>

// Checkbox
<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">이용약관에 동의합니다</Label>
</div>

// Switch
<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">비행기 모드</Label>
</div>
```

---

## 🎨 커스터마이징 방법

### 1. 새로운 Variant 추가

```typescript
// src/components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline:
          "border bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // 새로운 variant 추가
        gradient:
          "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600",
        custom:
          "bg-custom-color text-custom-foreground hover:bg-custom-color/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3",
        lg: "h-10 rounded-md px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
```

### 2. CSS 변수를 통한 테마 커스터마이징

```css
/* src/app/globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 47.4% 11.2%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  /* ... 기타 다크 모드 변수들 */
}
```

### 3. 복합 컴포넌트 만들기

```typescript
// src/components/ui/data-table.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataTableProps {
  title: string;
  data: any[];
  onAdd?: () => void;
  onSearch?: (value: string) => void;
}

export function DataTable({ title, data, onAdd, onSearch }: DataTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{title}</CardTitle>
          {onAdd && (
            <Button onClick={onAdd}>
              추가
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {onSearch && (
          <Input
            placeholder="검색..."
            onChange={(e) => onSearch(e.target.value)}
            className="mb-4"
          />
        )}
        {/* 테이블 내용 */}
      </CardContent>
    </Card>
  );
}
```

---

## 🚀 실제 프로젝트 적용 예제

### 1. 로그인 폼

```typescript
// MUI 방식
import {
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@mui/material';

<Card>
  <CardHeader>
    <CardTitle>로그인</CardTitle>
  </CardHeader>
  <CardContent>
    <TextField
      label="이메일"
      type="email"
      fullWidth
      margin="normal"
    />
    <TextField
      label="비밀번호"
      type="password"
      fullWidth
      margin="normal"
    />
    <Button
      variant="contained"
      fullWidth
      size="large"
      sx={{ mt: 2 }}
    >
      로그인
    </Button>
  </CardContent>
</Card>

// shadcn/ui 방식
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>로그인</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="email">이메일</Label>
      <Input id="email" type="email" placeholder="이메일을 입력하세요" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="password">비밀번호</Label>
      <Input id="password" type="password" placeholder="비밀번호를 입력하세요" />
    </div>
    <Button className="w-full" size="lg">
      로그인
    </Button>
  </CardContent>
</Card>
```

### 2. 데이터 테이블

```typescript
// MUI 방식
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

<TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>이름</TableCell>
        <TableCell>이메일</TableCell>
        <TableCell>상태</TableCell>
        <TableCell>액션</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {users.map((user) => (
        <TableRow key={user.id}>
          <TableCell>{user.name}</TableCell>
          <TableCell>{user.email}</TableCell>
          <TableCell>
            <Chip
              label={user.status}
              color={user.status === 'active' ? 'success' : 'default'}
            />
          </TableCell>
          <TableCell>
            <IconButton onClick={() => editUser(user.id)}>
              <Edit />
            </IconButton>
            <IconButton onClick={() => deleteUser(user.id)}>
              <Delete />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>

// shadcn/ui 방식
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2 } from "lucide-react";

<Card>
  <CardHeader>
    <CardTitle>사용자 목록</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>액션</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                {user.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => editUser(user.id)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteUser(user.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

---

## 🔄 마이그레이션 가이드

### 1단계: 프로젝트 설정

```bash
# 1. shadcn/ui 초기화
npx shadcn@latest init

# 2. 필요한 컴포넌트들 추가
npx shadcn@latest add button card input label textarea select checkbox switch table badge
```

### 2단계: 점진적 마이그레이션

```typescript
// 기존 MUI 컴포넌트를 shadcn/ui로 하나씩 교체
// 예: Button 컴포넌트부터 시작

// Before (MUI)
import { Button } from '@mui/material';
<Button variant="contained" color="primary">클릭</Button>

// After (shadcn/ui)
import { Button } from '@/components/ui/button';
<Button variant="default">클릭</Button>
```

### 3단계: 스타일 통일

```typescript
// MUI의 sx prop 대신 className 사용
// Before
<Button sx={{ borderRadius: 2, px: 3 }}>버튼</Button>

// After
<Button className="rounded-lg px-3">버튼</Button>
```

### 4단계: 테마 시스템 구축

```typescript
// MUI의 Theme Provider 대신 CSS 변수 사용
// globals.css에서 색상 시스템 정의
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* ... */
}
```

---

## 📊 성능 비교

| 항목             | MUI                      | shadcn/ui               |
| ---------------- | ------------------------ | ----------------------- |
| **번들 크기**    | ~200KB (전체 라이브러리) | ~50KB (사용 컴포넌트만) |
| **트리 쉐이킹**  | 제한적                   | 완전 지원               |
| **커스터마이징** | Theme Provider 필요      | 직접 파일 수정          |
| **의존성**       | Emotion, MUI 패키지들    | Radix UI, Tailwind CSS  |

---

## 🎯 언제 shadcn/ui를 선택해야 할까?

### ✅ shadcn/ui가 좋은 경우

- **완전한 커스터마이징**이 필요한 경우
- **번들 크기**를 최소화하고 싶은 경우
- **Tailwind CSS**를 사용하는 경우
- **컴포넌트 코드를 직접 제어**하고 싶은 경우
- **접근성**이 중요한 경우 (Radix UI 기반)

### ❌ MUI가 더 좋은 경우

- **빠른 프로토타이핑**이 필요한 경우
- **복잡한 테마 시스템**이 필요한 경우
- **데이터 그리드** 같은 복잡한 컴포넌트가 필요한 경우
- **팀이 MUI에 익숙**한 경우

---

## 🔧 유용한 명령어들

```bash
# 컴포넌트 추가
npx shadcn@latest add [component-name]

# 사용 가능한 컴포넌트 목록 확인
npx shadcn@latest add

# 기존 파일 덮어쓰기
npx shadcn@latest add button --overwrite

# 특정 스타일로 초기화
npx shadcn@latest init --style=default --color=blue
```

---

## 📚 추가 리소스

### 공식 문서

- [shadcn/ui 공식 사이트](https://ui.shadcn.com/)
- [Radix UI 문서](https://www.radix-ui.com/)
- [Tailwind CSS 문서](https://tailwindcss.com/)

### 유용한 컴포넌트들

```bash
# 폼 관련
npx shadcn@latest add form input label textarea select checkbox radio-group switch

# 레이아웃
npx shadcn@latest add card separator sheet sidebar

# 데이터 표시
npx shadcn@latest add table badge avatar progress

# 피드백
npx shadcn@latest add alert dialog toast popover tooltip

# 네비게이션
npx shadcn@latest add breadcrumb navigation-menu pagination tabs
```

---

## ❓ FAQ

### Q: MUI의 sx prop과 같은 기능이 있나요?

A: Tailwind CSS의 className을 사용합니다. 더 복잡한 스타일링이 필요하면 CSS-in-JS 라이브러리를 추가로 사용할 수 있습니다.

### Q: MUI의 Theme Provider와 같은 기능이 있나요?

A: CSS 변수를 사용합니다. 다크 모드도 CSS 변수로 쉽게 구현할 수 있습니다.

### Q: 복잡한 데이터 테이블은 어떻게 구현하나요?

A: TanStack Table과 같은 라이브러리를 shadcn/ui 컴포넌트와 조합해서 사용합니다.

### Q: 아이콘은 어떻게 사용하나요?

A: Lucide React를 기본으로 사용하며, 다른 아이콘 라이브러리도 쉽게 추가할 수 있습니다.

### Q: 애니메이션은 어떻게 처리하나요?

A: Tailwind CSS의 transition 클래스나 Framer Motion을 사용합니다.

---

## 🎉 결론

shadcn/ui는 MUI와는 다른 철학을 가진 컴포넌트 시스템입니다. 완전한 커스터마이징과 작은 번들 크기를 원한다면 shadcn/ui가 훌륭한 선택이 될 것입니다.

**핵심은 "라이브러리를 사용하는 것이 아니라, 코드를 소유하는 것"입니다.**

---

_이 가이드가 MUI에서 shadcn/ui로의 전환에 도움이 되길 바랍니다! 🚀_
