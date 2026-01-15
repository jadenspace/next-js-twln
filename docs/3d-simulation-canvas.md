# 3D 로또 추천 시뮬레이션 Canvas 문서

이 문서는 `src/features/lotto/components/lotto-machine-3d.tsx`에 구현된 3D 로또 추첨 시뮬레이션 기능에 대한 상세 명세서입니다. 이 문서를 통해 동일한 기능을 다른 환경에서도 완벽하게 재구현할 수 있도록 기술적인 세부 사항을 다룹니다.

## 1. 개요 및 기술 스택

이 컴포넌트는 실제 로또 추첨기(비너스 모델, Air-mix 방식)를 3D 물리 엔진을 사용하여 시뮬레이션합니다. 공기 역학적 움직임, 공의 충돌, 추출 과정이 물리적으로 계산되어 시각화됩니다.

- **Framework**: React (Next.js)
- **3D Engine**: Three.js (@react-three/fiber)
- **Physics Engine**: Rapier (@react-three/rapier)
- **Helpers**: @react-three/drei (Controls, Text, Environment)

## 2. 컴포넌트 구조

전체 시뮬레이션은 크게 세 가지 주요 컴포넌트로 구성됩니다.

### 2.1 `LottoMachine3D` (Main Container)

전체 Scene을 구성하고 상태를 관리하는 메인 컴포넌트입니다.

- **역할**: Canvas 초기화, 조명 설정, 물리 월드 설정, 공 생성 및 상태 관리.
- **주요 Props**:
  - `isSpinning` (boolean): 추첨 진행 여부 (공이 섞이기 시작함).
  - `drawnNumbers` (number[]): 당첨된 번호 배열 (로직상에서 미리 정해진 결과).
  - `onBallDrawn` (function): 공이 시각적으로 추출되었을 때 호출되는 콜백.

### 2.2 `LottoBall` (Individual Object)

개별 로또 공의 물리적 동작과 렌더링을 담당합니다.

- **역할**: 물리 엔진에 의한 이동, 회전, 공기 저항, 추출 애니메이션 처리.
- **상태**:
  - `Normal`: 물리 엔진의 영향을 받아 자유롭게 움직이는 상태.
  - `Targeted`: 추출될 예정인 공으로, 추출구(상단) 쪽으로 유도되는 힘을 받음.
  - `Captured`: 추출이 완료되어 상단 레일에 고정된 상태 (물리 엔진 비활성화).

### 2.3 `VenusMachineBody` (Environment)

추첨기의 외형과 충돌체를 정의합니다.

- **구성**: 유리 챔버(Sphere), 공기 유입구(Bottom), 추출 튜브(Top), 거치대(Rail).
- **물리**: 유리 챔버는 `MeshCollider(trimesh)`를 사용하여 공들이 내부에서만 움직이도록 가둠.

---

## 3. 물리 시뮬레이션 로직 (상세 구현 가이드)

가장 핵심적인 부분인 `LottoBall`의 `useFrame` 내부 로직입니다. 이 로직은 매 프레임마다 공에 힘(Impulse)과 속도(Velocity)를 적용하여 Air-mix 효과를 냅니다.

### 3.1 물리 속성 (Physics Properties)

- **Mass**: 0.01 (가벼운 탁구공 느낌)
- **Restitution (반발계수)**: 0.8 (잘 튀어오름)
- **Friction (마찰계수)**: 0.1 (미끄러움)

### 3.2 힘의 적용 (Air-mix Algorithm)

공기 흐름은 다음 4가지 힘의 조합으로 구현됩니다.

#### A. 하단 에어 블로어 (Upward Force)

바닥 중앙에서 강력한 바람이 불어 공을 띄웁니다.

- **조건**: 공의 위치가 바닥(y < 0.5)이고 중앙(distance < 1.5)일 때.
- **힘의 크기**: 기본 20.0 + 높이에 반비례하는 계수 + 랜덤 노이즈.
- **타겟 보너스**: 추출 대상(`isTargeted`)인 공은 2배의 상승력을 받아 위로 올라갈 확률을 높임.

#### B. 난류 (Turbulence)

불규칙한 공기 흐름을 표현합니다.

- **로직**: `Math.sin`, `Math.cos`와 시간(Time)을 조합하여 불규칙한 x, z 축 힘을 생성.
- **강도**:
  - 바닥 부근(y < -1.5): 강한 난류 (0.96)
  - 일반: 약한 난류 (0.36)
  - 타겟: 매우 약한 난류 (0.1) - 추출구로 직행하기 위함.

#### C. 소용돌이 (Vortex) vs 유도 기류 (Homing)

- **일반 공 (Vortex)**: 중앙을 축으로 회전하는 힘(`-pos.z`, `pos.x`)을 가하여 소용돌이를 만듦.
- **타겟 공 (Homing)**: 상단(y > 0)에 위치하면 소용돌이를 멈추고 중앙(x=0, z=0)으로 끌어당기는 힘(`-pos.x`, `-pos.z`)을 가해 추출 튜브로 유도.

#### D. 속도 제한 (Speed Limit)

- 물리 시뮬레이션의 발산을 막기 위해 최대 속도를 제한합니다.
- `isSpinning` 상태일 때 Max Speed: 30
- 대기 상태일 때 Max Speed: 15

### 3.3 추출 및 봉쇄 로직

#### 강제 봉쇄 (Hard Containment)

물리 엔진의 오차로 공이 유리를 뚫고 나가는 것을 방지합니다.

- 원점으로부터 거리가 2.45를 초과하면 강제로 위치를 반지름 내부(2.42)로 보정하고 속도를 반전시킵니다.

#### 추출 판정 (Extraction)

- **조건**: `isTargeted` 상태이면서, 높이가 1.4 이상이고, 중앙에서의 거리가 1.2 미만일 때.
- **동작**: 수직 상승 Impulse를 가하고 `onCapture` 콜백을 실행.

---

## 4. 시각적 구현 (Rendering)

### 4.1 조명 (Lighting)

- **AmbientLight**: 기본 밝기 (0.5)
- **SpotLight**: 상단에서 내려비추는 주광원 (강한 Shadow 생성)
- **PointLight**: 좌우에서 색상 조명(Cyan, Pink)을 주어 사이버틱한 분위기 연출.

### 4.2 재질 (Material)

- **유리 챔버**: `MeshPhysicalMaterial`
  - `transmission`: 0.9 (투명도)
  - `roughness`: 0 (매끄러움)
  - `ior`: 1.5 (굴절률)
- **공 (Ball)**: `MeshStandardMaterial`
  - `roughness`: 0.2
  - `metalness`: 0.4
  - `emissive`: 공의 색상 (약하게 발광)

### 4.3 카메라 연출 (Intro Camera)

- 초기 로드 시 카메라가 `[12, 12, 15]`에서 `[0, 5, 18]`로 부드럽게 이동(Lerp)하여 역동적인 뷰를 제공합니다.

---

## 5. 데이터 흐름 (Integreation Flow)

1. **초기화**: `LottoMachine3D` 마운트 시 45개의 공 생성.
2. **시작**: `isSpinning`이 `true`가 되면 물리 댐핑(Damping)이 풀리고 공들이 튀어오름.
3. **타겟팅**: 외부에서 `drawnNumbers` 배열이 업데이트되면, 아직 추출되지 않은(visualExtracted에 없는) 번호를 찾아 `nextTarget`으로 설정.
4. **유도**: 해당 번호(`LottoBall`)는 `isTargeted`가 되어 상단 중앙으로 유도됨.
5. **추출**: 물리적 조건이 충족되면 추출되어 상단 레일(`Captured` 상태)로 이동.
6. **완료**: `onBallDrawn` 호출로 부모에게 알림.

## 6. 코드 스니펫 (참고용)

### 핵심 물리 루프 (LottoBall)

```typescript
useFrame((state) => {
  // ... (초기 세팅)

  if (isSpinning) {
    // 1. Air Blower
    if (pos.y < 0.5 && distFromCenter < 1.5) {
      // 위로 솟구치는 힘 + 랜덤성
    }

    // 2. Turbulence
    // 노이즈 함수기반 랜덤 움직임

    // 3. Vortex or Homing
    if (isTargeted && pos.y > 0) {
      // 중앙으로 강하게 당김 (Homing)
    } else {
      // 회전 (Swirl)
    }

    // 4. Extraction
    if (isTargeted && pos.y > 1.4 && distFromCenter < 1.2) {
      // 추출 성공 처리
    }
  }

  // 5. Containment (유리벽 뚫림 방지)
  if (dist > 2.45) {
    // 위치 강제 보정
  }
});
```
