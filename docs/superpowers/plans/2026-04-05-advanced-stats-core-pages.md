# Advanced Stats Core Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the advanced stats `algorithm`, `regression`, and `compatibility` pages so users can understand each metric faster and act on the results more easily.

**Architecture:** Keep the existing stats query and filter flow, and refine only the page-level presentation. Each page will get a clearer summary layer, easier interpretation copy, and tighter action guidance without changing backend calculation logic.

**Tech Stack:** Next.js App Router, React, TypeScript, TanStack Query, existing shared UI components, ESLint

---

## File Structure

- Modify: `src/app/(dashboard)/lotto/analysis/stats/algorithm/page.tsx`
  - Refine analysis-basis section, hot/cold result cards, and generator CTA block.
- Modify: `src/app/(dashboard)/lotto/analysis/stats/regression/page.tsx`
  - Add top summary cards, simplify interpretation copy, and tighten detailed regression list layout.
- Modify: `src/app/(dashboard)/lotto/analysis/stats/compatibility/page.tsx`
  - Add pre-selection guidance, selected-number summary, and clearer split between selected-number partners vs overall top pairs.
- Verify: `npx eslint src/app/(dashboard)/lotto/analysis/stats/algorithm/page.tsx`
- Verify: `npx eslint src/app/(dashboard)/lotto/analysis/stats/regression/page.tsx`
- Verify: `npx eslint src/app/(dashboard)/lotto/analysis/stats/compatibility/page.tsx`

### Task 1: Refine Algorithm Stats Page

**Files:**
- Modify: `src/app/(dashboard)/lotto/analysis/stats/algorithm/page.tsx`
- Test: `src/app/(dashboard)/lotto/analysis/stats/algorithm/page.tsx`

- [ ] **Step 1: Write the failing test**

This page currently has no automated test harness in the repo, so the failing check for this task is lint-backed implementation readiness instead of a component test. First make the expected UI changes explicit in code comments or task notes before editing:

```tsx
// Expected behavior after change:
// 1. Show a short interpretation banner near the top.
// 2. Keep current analysis basis visible.
// 3. Make hot/cold cards explain that results depend on the active range.
// 4. Reduce the long explanation block and keep one clear CTA into manual pattern generation.
```

- [ ] **Step 2: Run a pre-change verification**

Run: `npx eslint src/app/(dashboard)/lotto/analysis/stats/algorithm/page.tsx`
Expected: PASS or only pre-existing warnings. This confirms the file is in a clean enough state before edits.

- [ ] **Step 3: Write minimal implementation**

Apply these changes in `src/app/(dashboard)/lotto/analysis/stats/algorithm/page.tsx`:

```tsx
// Add a short interpretation card near the top of the results section
<Card className="border-amber-200 bg-amber-50/40">
  <CardContent className="flex flex-col gap-2 py-4 text-sm">
    <p className="font-semibold text-amber-700">빠른 해석</p>
    <p className="text-muted-foreground">
      핫 번호는 현재 범위에서 자주 나온 번호이고, 콜드 번호는 상대적으로 덜 나온 번호입니다.
      이 결과는 고정 추천이 아니라 현재 필터 기준의 참고 흐름입니다.
    </p>
  </CardContent>
</Card>

// Keep the basis cards but make labels simpler and easier to scan
<InfoItem label="분석 회차 범위" value={`${filters.startDraw}회 ~ ${filters.endDraw}회`} />
<InfoItem label="총 회차 수" value={`${filters.endDraw - filters.startDraw + 1}회`} />
<InfoItem label="보너스 포함" value={filters.includeBonus ? "포함" : "미포함"} />

// In Hot/Cold cards, add a compact helper line under the description
<p className="text-xs text-muted-foreground">
  현재 필터 범위 기준 결과
</p>

// Replace the long bottom explanation block with a compact action card
<div className="rounded-xl border bg-muted/20 p-4">
  <p className="text-sm font-medium text-foreground">실전 선택은 패턴 조합 생성기에서 진행</p>
  <p className="mt-2 text-xs text-muted-foreground">
    여기서 흐름을 확인한 뒤, 생성기에서 고정수와 제외수를 바로 선택합니다.
  </p>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx eslint src/app/(dashboard)/lotto/analysis/stats/algorithm/page.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/lotto/analysis/stats/algorithm/page.tsx
git commit -m "Improve algorithm stats page clarity"
```

### Task 2: Refine Regression Stats Page

**Files:**
- Modify: `src/app/(dashboard)/lotto/analysis/stats/regression/page.tsx`
- Test: `src/app/(dashboard)/lotto/analysis/stats/regression/page.tsx`

- [ ] **Step 1: Write the failing test**

Define the missing behavior before editing:

```tsx
// Expected behavior after change:
// 1. Show top summary cards for delayed numbers, most delayed number, and most stable number.
// 2. Rename dense terminology into easier Korean labels.
// 3. Make each row compare current lag, average cycle, gap, and volatility in one glance.
// 4. Add a short explanation that regression is a reference rhythm, not a prediction.
```

- [ ] **Step 2: Run a pre-change verification**

Run: `npx eslint src/app/(dashboard)/lotto/analysis/stats/regression/page.tsx`
Expected: PASS or only pre-existing warnings.

- [ ] **Step 3: Write minimal implementation**

Add derived values near the top of `RegressionStatsPage`:

```tsx
const delayedRows = sortedByLag.filter(([num, lag]) => {
  const average = stats?.regression.averageCycles[Number(num)] || 0;
  return lag > average;
});

const mostDelayed = delayedRows[0] ?? null;
const mostStable = [...sortedByLag]
  .sort(([leftNum, leftLag], [rightNum, rightLag]) => {
    const leftAvg = stats?.regression.averageCycles[Number(leftNum)] || 0;
    const rightAvg = stats?.regression.averageCycles[Number(rightNum)] || 0;
    return Math.abs(leftLag - leftAvg) - Math.abs(rightLag - rightAvg);
  })[0] ?? null;
```

Then add summary cards and tighten the row layout:

```tsx
<div className="grid gap-4 md:grid-cols-3">
  <SummaryCard label="평균보다 오래 안 나온 번호 수" value={`${delayedRows.length}개`} />
  <SummaryCard label="가장 많이 밀린 번호" value={mostDelayed ? `${mostDelayed[0]}번` : "-"} />
  <SummaryCard label="가장 안정적인 번호" value={mostStable ? `${mostStable[0]}번` : "-"} />
</div>

// Row body should expose:
// 현재 미출현, 평균 주기, 평균 대비 차이, 표준편차
<div className="grid gap-1 text-right text-xs">
  <span>현재 미출현 {lag}회</span>
  <span>평균 {avg.toFixed(1)}회</span>
  <span>{differenceLabel}</span>
  <span>변동성 {std.toFixed(1)}</span>
</div>
```

Also add a compact guide card:

```tsx
<div className="rounded-lg bg-blue-50 p-4 text-xs text-blue-800">
  회귀는 번호가 다시 출현하기까지의 평균 간격을 보는 지표입니다.
  예측 확정값이 아니라, 현재 흐름이 평균보다 얼마나 벌어졌는지 참고하는 용도입니다.
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx eslint src/app/(dashboard)/lotto/analysis/stats/regression/page.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/lotto/analysis/stats/regression/page.tsx
git commit -m "Improve regression stats page readability"
```

### Task 3: Refine Compatibility Stats Page

**Files:**
- Modify: `src/app/(dashboard)/lotto/analysis/stats/compatibility/page.tsx`
- Test: `src/app/(dashboard)/lotto/analysis/stats/compatibility/page.tsx`

- [ ] **Step 1: Write the failing test**

Define expected UX changes before editing:

```tsx
// Expected behavior after change:
// 1. Show overall top pairs and a short usage guide even before a number is selected.
// 2. After selection, show a compact summary card for the selected number.
// 3. Separate "selected-number partners" from "overall top pairs" more clearly.
// 4. Make the partner cards easier to scan on mobile.
```

- [ ] **Step 2: Run a pre-change verification**

Run: `npx eslint src/app/(dashboard)/lotto/analysis/stats/compatibility/page.tsx`
Expected: PASS or only pre-existing warnings.

- [ ] **Step 3: Write minimal implementation**

Add a selected-number summary helper near the top:

```tsx
const selectedPartners = targetNum ? getBestPartners(targetNum) : [];
const topPartner = selectedPartners[0] ?? null;
const averagePartnerCount =
  selectedPartners.length > 0
    ? (
        selectedPartners.reduce((sum, partner) => sum + Number(partner.count), 0) /
        selectedPartners.length
      ).toFixed(1)
    : null;
```

Then restructure the page body:

```tsx
// Add a guide card visible before selection
<Card className="border-dashed bg-muted/20">
  <CardContent className="py-4 text-sm text-muted-foreground">
    번호를 고르면 그 번호와 자주 같이 나온 파트너를 보여줍니다.
    오른쪽 Top 조합은 선택 여부와 무관한 전체 기준 조합입니다.
  </CardContent>
</Card>

// Add a selected-number summary block when targetNum exists
<div className="grid gap-3 md:grid-cols-3">
  <SummaryCard label="선택 번호" value={`${targetNum}번`} />
  <SummaryCard label="가장 강한 파트너" value={topPartner ? `${topPartner.num}번` : "-"} />
  <SummaryCard label="상위 파트너 평균 동반 출현" value={averagePartnerCount ? `${averagePartnerCount}회` : "-"} />
</div>
```

Tighten card labels:

```tsx
<CardTitle>선택 번호 파트너 Top 10</CardTitle>
<CardDescription>선택한 번호와 자주 같이 나온 번호 순위</CardDescription>

<CardTitle>전체 기준 Top 10 조합</CardTitle>
<CardDescription>선택 번호와 무관한 전체 동반 출현 상위 조합</CardDescription>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx eslint src/app/(dashboard)/lotto/analysis/stats/compatibility/page.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/(dashboard)/lotto/analysis/stats/compatibility/page.tsx
git commit -m "Improve compatibility stats page guidance"
```

### Task 4: Final Verification

**Files:**
- Verify: `src/app/(dashboard)/lotto/analysis/stats/algorithm/page.tsx`
- Verify: `src/app/(dashboard)/lotto/analysis/stats/regression/page.tsx`
- Verify: `src/app/(dashboard)/lotto/analysis/stats/compatibility/page.tsx`

- [ ] **Step 1: Run combined lint verification**

Run:

```bash
npx eslint src/app/(dashboard)/lotto/analysis/stats/algorithm/page.tsx src/app/(dashboard)/lotto/analysis/stats/regression/page.tsx src/app/(dashboard)/lotto/analysis/stats/compatibility/page.tsx
```

Expected: PASS

- [ ] **Step 2: Review changed files**

Run:

```bash
git diff -- src/app/(dashboard)/lotto/analysis/stats/algorithm/page.tsx src/app/(dashboard)/lotto/analysis/stats/regression/page.tsx src/app/(dashboard)/lotto/analysis/stats/compatibility/page.tsx
```

Expected: Diff shows only the planned UX and copy changes.

- [ ] **Step 3: Commit final integration**

```bash
git add src/app/(dashboard)/lotto/analysis/stats/algorithm/page.tsx src/app/(dashboard)/lotto/analysis/stats/regression/page.tsx src/app/(dashboard)/lotto/analysis/stats/compatibility/page.tsx
git commit -m "Refine advanced stats core pages"
```
