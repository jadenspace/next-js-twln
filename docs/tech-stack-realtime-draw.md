# 🚀 실시간 추첨 (3D 로또 머신) 기술 스택 및 원리

이 문서는 "실시간 추첨" 기능의 3D 시뮬레이션 구현에 사용된 기술 스택과 핵심 작동 원리를 설명합니다.

## 1. 기능 개요

"실시간 추첨"은 사용자가 직접 3D로 구현된 로또 추첨기(비너스 모델)를 작동시켜 행운의 번호를 뽑는 인터랙티브 기능입니다. 실제 추첨기의 Air-mix 방식을 모방하여 물리 기반으로 공이 섞이고 추출되는 과정을 시각적으로 보여줌으로써 사용자에게 몰입감 높은 경험을 제공합니다.

- **경로**: `/lotto/generate/random`
- **주요 컴포넌트**: `src/app/(dashboard)/lotto/generate/random/page.tsx`
- **3D 엔진 컴포넌트**: `src/features/lotto/components/lotto-machine-3d.tsx`

## 2. 🛠️ 주요 기술 스택 (Tech Stack)

| 라이브러리 | 역할 | 선택 이유 |
| --- | --- | --- |
| **Three.js** | 3D 렌더링 엔진 | 웹 기반 3D 그래픽의 표준이며, 방대한 커뮤니티와 레퍼런스를 보유하고 있습니다. |
| **@react-three/fiber (R3F)** | React 렌더러 | Three.js를 React의 선언적 컴포넌트 모델로 사용할 수 있게 하여, 복잡한 3D 씬을 컴포넌트 단위로 관리하고 React 생태계(상태 관리, 훅 등)와 완벽하게 통합할 수 있습니다. |
| **@react-three/drei** | R3F 유틸리티 모음 | 카메라 컨트롤(`OrbitControls`), 환경맵(`Environment`), 텍스트(`Text`), 그림자(`ContactShadows`) 등 3D 씬을 구성하는 데 필요한 보편적인 기능들을 미리 만들어진 컴포넌트로 제공하여 개발 생산성을 크게 향상시킵니다. |
| **@react-three/rapier** | 3D 물리 엔진 | WebAssembly 기반의 고성능 물리 엔진 Rapier를 R3F와 쉽게 통합할 수 있도록 해줍니다. `RigidBody`, `Collider` 등을 컴포넌트로 제공하여 로또 볼의 충돌, 중력, 공기 저항 등 복잡한 물리 현상을 효율적으로 시뮬레이션합니다. |

## 3. ⚙️ 핵심 원리 및 아키텍처

### 3.1. 3D 씬과 물리 세계의 결합

- **`<Canvas>` (from R3F)**: 3D 렌더링이 일어나는 전체 캔버스 영역을 정의합니다.
- **`<Physics>` (from Rapier)**: 캔버스 내부에 물리 시뮬레이션이 적용될 영역을 설정합니다. 이 컴포넌트 하위에 있는 `RigidBody`들은 물리 법칙의 영향을 받게 됩니다.

### 3.2. 로또 머신 및 볼 모델링

- **`VenusMachineBody`**: 추첨기의 투명한 구체, 하단 스탠드, 상단 추출 튜브 등을 3D 모델(Geometry)로 만듭니다. 이 컴포넌트는 움직이지 않는 고정된(`type="fixed"`) `RigidBody`로 설정하여 다른 객체들이 부딪힐 수 있는 환경을 제공합니다.
- **`LottoBall`**: 45개의 로또 볼 각각을 나타내는 컴포넌트입니다.
    - 각 볼은 동적인(`type="dynamic"`) `RigidBody`로, 물리 엔진에 의해 위치와 회전이 계산됩니다.
    - `restitution`(탄성), `friction`(마찰), `mass`(질량) 등의 물리 속성을 부여하여 사실적인 움직임을 구현합니다.

### 3.3. Air-Mix 방식 시뮬레이션 (핵심 로직)

`@react-three/fiber`의 **`useFrame`** 훅을 사용하여 매 프레임마다 각 `LottoBall`에 힘을 가해 공기 혼합(Air-mix) 방식을 시뮬레이션합니다.

1.  **상승 기류 (Upward Force)**: 추첨기 하단에서 불어오는 바람을 모방하여 각 볼에 상향 임펄스(`applyImpulse`)를 가합니다.
2.  **난기류 (Turbulence)**: `Math.sin`, `Math.cos` 등을 활용한 노이즈를 추가하여 공의 움직임을 불규칙하고 예측 불가능하게 만듭니다.
3.  **소용돌이 (Vortex)**: 공들이 중앙으로 모이면서 회전하도록 와류(swirl) 힘을 적용합니다.
4.  **타겟 유도 (Homing)**: 추첨이 시작되면 미리 정해진 6개의 `target` 번호에 약간의 추가적인 힘을 가해 상단 추출구로 더 잘 이끌리도록 유도합니다. 이는 시뮬레이션의 재미와 의도된 결과 도출을 위한 게임적 허용입니다.

### 3.4. 번호 추출 및 상태 관리

1.  **추출 로직**: `LottoBall` 컴포넌트 내부에서 특정 `y`좌표(높이) 이상으로 올라가고, `isTargeted` 상태일 경우 `onCapture` 콜백을 호출하여 추출되었음을 알립니다.
2.  **상태 동기화**:
    - 부모 컴포넌트(`RandomGeneratePage`)가 `isSpinning`, `drawnNumbers` (추출 대상 번호) 등의 상태를 관리합니다.
    - 이 상태는 `LottoMachine3D` 컴포넌트에 `props`로 전달됩니다.
    - 3D 씬 내부에서 공이 추출되면 `onBallDrawn` 콜백을 통해 부모에게 알려 상태를 업데이트하고, UI(추첨 결과 모달 등)에 반영합니다.

### 3.5. 렌더링 및 시각 효과

- **조명**: `spotLight`, `pointLight`, `ambientLight`를 조합하여 입체감과 사실적인 분위기를 연출합니다.
- **그림자**: `castShadow`와 `ContactShadows`를 사용하여 깊이감을 더합니다.
- **환경**: `Environment` 컴포넌트로 스튜디오 조명 환경을 적용하여 유리나 금속 재질의 반사를 사실적으로 표현합니다.
- **카메라**: `PerspectiveCamera`와 `OrbitControls`를 사용하여 사용자가 씬을 둘러볼 수 있게 하고, `IntroCamera` 컴포넌트를 통해 초기 등장 시 부드러운 카메라 애니메이션을 연출합니다.

## 4. 📂 코드 구조

- **`RandomGeneratePage.tsx` (페이지 컴포넌트)**
    - 추첨 시작/중지, 초기화 등 UI 로직 담당
    - 추첨 상태(`isSpinning`, `drawnNumbers` 등) 관리
    - `LottoMachine3D` 컴포넌트를 렌더링하고 상태와 콜백을 전달
    - 추첨 완료 후 결과 모달(`Dialog`) 표시

- **`LottoMachine3D.tsx` (3D 씬 컴포넌트)**
    - 3D 씬의 모든 요소를 포함하는 메인 컨테이너
    - `Canvas`, `Physics` 컴포넌트 설정
    - 45개의 `LottoBall`과 `VenusMachineBody`를 생성하고 렌더링
    - 조명, 카메라, 환경 등 씬의 전반적인 설정 담당

- **`LottoBall.tsx` (개별 공 컴포넌트 - `lotto-machine-3d.tsx` 내부에 정의됨)**
    - 단일 로또 볼의 3D 모델과 물리적 동작 로직 포함
    - `useFrame` 훅을 통해 매 프레임 물리 연산 수행

이처럼 React의 컴포넌트 기반 아키텍처와 R3F 생태계를 활용하여 복잡한 3D 물리 시뮬레이션을 선언적이고 재사용 가능한 컴포넌트로 나누어 구현함으로써, 유지보수성과 개발 효율성을 높였습니다.
