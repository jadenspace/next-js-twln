"use client";

import React, { useRef, useMemo, Suspense, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  Environment,
  ContactShadows,
  PerspectiveCamera,
} from "@react-three/drei";
import {
  Physics,
  RigidBody,
  BallCollider,
  MeshCollider,
  CuboidCollider,
  RapierRigidBody,
  CylinderCollider,
} from "@react-three/rapier";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { getLottoBallColor } from "@/features/lotto/lib/lotto-colors";

/**
 * 프로젝트 목표: 한국형 로또 추첨기 (비너스 모델, Air-mix 방식) 3D 시뮬레이션
 * 기술 스택: Three.js + Rapier Physics (@react-three/rapier)
 */

// 개별 로또 볼 컴포넌트
function LottoBall({
  number,
  color,
  isSpinning,
  isCaptured,
  captureIndex,
  isTargeted,
  onCapture,
}: {
  number: number;
  color: string;
  isSpinning: boolean;
  isCaptured: boolean;
  captureIndex: number;
  isTargeted: boolean;
  onCapture: (id: number) => void;
}) {
  const rigidBody = useRef<RapierRigidBody>(null);

  // 물리 속성 설정 (사용자 요청 가이드 반영)
  const mass = 0.01;
  const restitution = 0.8;
  const friction = 0.1;

  useFrame((state) => {
    if (!rigidBody.current || isCaptured) return;

    const pos = rigidBody.current.translation();
    const vel = rigidBody.current.linvel();

    if (isSpinning) {
      // 1. 하단 에어 블로어 (Upward Force) - 타겟 공에 더 강한 상승력
      const distFromCenter = Math.sqrt(pos.x ** 2 + pos.z ** 2);
      if (pos.y < 0.5 && distFromCenter < 1.5) {
        const heightFactor = Math.pow(Math.max(0, 2.0 - pos.y), 2) * 9.6;
        const targetBonus = isTargeted ? 2.0 : 1.0;
        const lift =
          (20.0 + heightFactor + Math.random() * 15.0) * mass * targetBonus;

        rigidBody.current.applyImpulse(
          {
            x: (Math.random() - 0.5) * 3.6 * mass,
            y: lift,
            z: (Math.random() - 0.5) * 3.6 * mass,
          },
          true,
        );
      }

      // 2. 난류 (Turbulence) - 타겟이 아닌 공에만 적용
      const t = state.clock.getElapsedTime();
      const noiseStrength = isTargeted ? 0.1 : pos.y < -1.5 ? 0.96 : 0.36;
      rigidBody.current.applyImpulse(
        {
          x: Math.sin(t * 15 + number) * noiseStrength * mass,
          y: Math.random() * 0.72 * mass,
          z: Math.cos(t * 13 + number) * noiseStrength * mass,
        },
        true,
      );

      // 3. 소용돌이 및 유도 기류 (Vortex & Homing) - 타겟 공 강화
      if (isTargeted && pos.y > 0) {
        // 강화된 호밍: 중앙으로 빠르게 이동 + 상승력 추가
        const homingStrength = 1.8;
        const liftBoost = pos.y < 1.5 ? 2.0 : 0.5;
        rigidBody.current.applyImpulse(
          {
            x: -pos.x * homingStrength * mass,
            y: liftBoost * mass,
            z: -pos.z * homingStrength * mass,
          },
          true,
        );
      } else if (!isTargeted) {
        const swirl = 0.84;
        rigidBody.current.applyImpulse(
          {
            x: -pos.z * swirl * mass,
            y: 0,
            z: pos.x * swirl * mass,
          },
          true,
        );
      }

      // 4. 추출 로직 (Extraction Logic) - 더 넓은 영역, 더 빠른 추출
      if (isTargeted && pos.y > 1.4 && distFromCenter < 1.2) {
        rigidBody.current.applyImpulse({ x: 0, y: 8.0 * mass, z: 0 }, true);
        onCapture(number);
      }
    } else {
      // 대기/종료 시 댐핑 강화
      rigidBody.current.setLinearDamping(3);
      rigidBody.current.setAngularDamping(3);
    }

    // 5. 완벽한 구체 봉쇄 (Hard Containment) - 항상 작동해야 함
    const dist = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
    if (dist > 2.45) {
      const nx = pos.x / dist;
      const ny = pos.y / dist;
      const nz = pos.z / dist;
      rigidBody.current.setTranslation(
        { x: nx * 2.42, y: ny * 2.42, z: nz * 2.42 },
        true,
      );
      rigidBody.current.setLinvel(
        { x: -vel.x * 0.4, y: -vel.y * 0.4, z: -vel.z * 0.4 },
        true,
      );
    }

    // 속도 제한 (항상 작동)
    const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
    const maxSpeed = isSpinning ? 30 : 15;
    if (speed > maxSpeed) {
      rigidBody.current.setLinvel(
        {
          x: (vel.x / speed) * maxSpeed,
          y: (vel.y / speed) * maxSpeed,
          z: (vel.z / speed) * maxSpeed,
        },
        true,
      );
    }
  });

  // 추출된 공의 위치 애니메이션 (상단 가이드 레일)
  if (isCaptured) {
    const targetX = -1.2 + captureIndex * 0.48;
    const targetY = 3.6;
    const targetZ = 0;

    return (
      <group position={[targetX, targetY, targetZ]}>
        <mesh castShadow>
          <sphereGeometry args={[0.2, 24, 24]} />
          <meshStandardMaterial
            color={color}
            metalness={0.4}
            roughness={0.2}
            emissive={color}
            emissiveIntensity={0.2}
          />
          <Text
            position={[0, 0, 0.22]}
            fontSize={0.16}
            color="#000"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="#fff"
          >
            {number}
          </Text>
        </mesh>
        {/* 볼 지지 레일 비주얼 */}
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.4, 0.05, 0.4]} />
          <meshStandardMaterial color="#444" metalness={1} roughness={0.1} />
        </mesh>
      </group>
    );
  }

  return (
    <RigidBody
      ref={rigidBody}
      colliders={false}
      position={[
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5 - 0.5,
        (Math.random() - 0.5) * 1.5,
      ]}
      restitution={restitution}
      friction={friction}
      mass={mass}
      canSleep={false}
      linearDamping={isSpinning ? 0.2 : 2}
      angularDamping={isSpinning ? 0.3 : 2}
    >
      <BallCollider args={[0.18]} />
      <mesh castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.4}
          emissive={color}
          emissiveIntensity={0.15}
        />
        <Text
          position={[0, 0, 0.22]}
          fontSize={0}
          color="black"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="white"
        >
          {number}
        </Text>
      </mesh>
    </RigidBody>
  );
}

// 챔버 및 기계 본체 구조물
function VenusMachineBody() {
  return (
    <group>
      {/* 1. 메인 유리 챔버 (Sphere Chamber) */}
      <RigidBody type="fixed" colliders={false}>
        <MeshCollider type="trimesh">
          <mesh>
            <sphereGeometry args={[2.5, 64, 64]} />
            <meshPhysicalMaterial
              transparent
              opacity={0.1}
              transmission={0.9}
              thickness={2}
              roughness={0}
              ior={1.5}
              envMapIntensity={2.5}
              color="#ffffff"
            />
          </mesh>
        </MeshCollider>
        {/* 바닥 정체 방지 콜라이더 */}
        <CuboidCollider
          position={[0, -2.3, 0]}
          args={[1, 0.1, 1]}
          restitution={0.2}
        />
      </RigidBody>

      {/* 2. 상단 추출 튜브 (Extraction Tube) */}
      <group position={[0, 2.5, 0]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
          <meshStandardMaterial color="#222" metalness={1} />
        </mesh>
        {/* 투명 튜브 파이프 */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.4, 0.4, 0.8, 32]} />
          <meshPhysicalMaterial
            transparent
            opacity={0.2}
            transmission={1}
            color="#fff"
          />
        </mesh>
      </group>

      {/* 3. 하단 에어 블로어 베이스 (Air Blower) */}
      <group position={[0, -2.5, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.8, 1.2, 0.6, 32]} />
          <meshStandardMaterial color="#333" metalness={1} />
        </mesh>
        {/* 메인 스탠드 기둥 */}
        <mesh position={[0, -2.5, 0]} receiveShadow>
          <cylinderGeometry args={[1.5, 2, 4, 32]} />
          <meshStandardMaterial color="#111" metalness={1} roughness={0.1} />
        </mesh>
        {/* 대형 원형 기단 */}
        <mesh position={[0, -4.5, 0]} receiveShadow>
          <cylinderGeometry args={[6, 7, 0.8, 64]} />
          <meshStandardMaterial color="#050505" />
        </mesh>
      </group>

      {/* 4. 상단 드로잉 레일 (Drawn Ball Rail) */}
      <group position={[0, 3.4, 0]}>
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[3.2, 0.05, 0.6]} />
          <meshPhysicalMaterial transparent opacity={0.3} color="#fff" />
        </mesh>
        <mesh position={[0, 0.1, 0.3]}>
          <boxGeometry args={[3.2, 0.4, 0.02]} />
          <meshStandardMaterial color="#888" transparent opacity={0.1} />
        </mesh>
        <mesh position={[0, 0.1, -0.3]}>
          <boxGeometry args={[3.2, 0.4, 0.02]} />
          <meshStandardMaterial color="#888" transparent opacity={0.1} />
        </mesh>
      </group>

      {/* 챔버를 가로지르는 메탈 링 (디자인 포인트) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[2.6, 0.05, 16, 100]} />
        <meshStandardMaterial color="#444" metalness={1} />
      </mesh>
    </group>
  );
}

// 추출 센서 영역 체크 및 수집 로직
function ExtractionController({
  drawnNumbers,
  onVisualCapture,
}: {
  drawnNumbers: number[];
  onVisualCapture: (id: number) => void;
}) {
  // 상단 추출 튜브 입구 (Sensor Zone)
  // [0, 2.3, 0] 부근에 위치
  return (
    <RigidBody
      type="fixed"
      colliders={false}
      sensor
      onIntersectionEnter={({ other }) => {
        // 충돌한 객체가 공인 경우 정보를 추출
        // note: Rapier의 userData나 name을 사용하여 공 번호를 식별
      }}
    >
      <CylinderCollider position={[0, 2.3, 0]} args={[0.4, 0.4]} />
    </RigidBody>
  );
}

// 초기 로드 시 카메라 무빙 제어
function IntroCamera({ onComplete }: { onComplete: () => void }) {
  const [active, setActive] = useState(true);

  useFrame((state) => {
    if (!active) return;

    // 타겟 위치: [0, 5, 18]
    // 시작 위치 (캡처 각도): [12, 12, 15]
    const targetPos = new THREE.Vector3(0, 5, 18);
    const step = 0.045; // 조금 더 속도감 있게 시작해서 부드럽게 정지

    state.camera.position.lerp(targetPos, step);
    state.camera.lookAt(0, 0, 0);

    // 훨씬 더 정밀하게 체크하여 '덜컹'이는 느낌 제거
    if (state.camera.position.distanceTo(targetPos) < 0.001) {
      state.camera.position.copy(targetPos);
      state.camera.lookAt(0, 0, 0);
      state.camera.updateProjectionMatrix();
      setActive(false);
      onComplete();
    }
  });

  return null;
}

export function LottoMachine3D({
  isSpinning,
  drawnNumbers,
  onBallDrawn,
}: {
  isSpinning: boolean;
  drawnNumbers: number[];
  onBallDrawn?: (num: number) => void;
}) {
  // 실제 3D 상에서 "추출 완료"된 것으로 간주되는 번호들 관리 (애니메이션 동기화용)
  const [visualExtracted, setVisualExtracted] = useState<number[]>([]);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  // 45개 공 데이터 생성
  const ballsData = useMemo(() => {
    return Array.from({ length: 45 }, (_, i) => ({
      id: i + 1,
      color: getLottoBallColor(i + 1),
    }));
  }, []);

  // 추첨 시작 시간 기록 (초반 무효 처리용)
  const spinningStartTime = useRef<number>(0);

  // 외부(Props)에서 DrawnNumbers가 변할 때 시각적 동기화 초기화
  useEffect(() => {
    if (drawnNumbers.length === 0) {
      setVisualExtracted([]);
    }
  }, [drawnNumbers.length]);

  // 추첨 상태 변화 감지
  useEffect(() => {
    if (isSpinning) {
      spinningStartTime.current = Date.now();
    }
  }, [isSpinning]);

  // 공이 상단 트랩 근처에 도달했을 때의 포획 이벤트 핸들러
  const handleBallCapture = (id: number) => {
    // 1. 최소 0.5초 동안은 믹싱 시간으로 간주하여 추출 무효화
    if (Date.now() - spinningStartTime.current < 500) return;

    // 2. 이미 추출된 번호가 아니고, 현재 뽑아야 할 번호 후보군에 있다면
    if (!visualExtracted.includes(id) && drawnNumbers.includes(id)) {
      setVisualExtracted((prev) => [...prev, id]);
      // 부모에게 실제 추출 성공을 알림
      onBallDrawn?.(id);
    }
  };

  const [isIntroDone, setIsIntroDone] = useState(false);
  const resetCameraToFront = () => {
    const camera = cameraRef.current;
    if (!camera) return;

    camera.position.set(0, 5, 18);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    controlsRef.current?.target.set(0, 0, 0);
    controlsRef.current?.update();
  };

  return (
    <div className="w-full h-[700px] bg-gradient-to-b from-slate-950 via-slate-900 to-black rounded-3xl overflow-hidden shadow-edge border border-white/5 relative">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [12, 12, 15], fov: 28 }}>
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={[12, 12, 15]}
          fov={28}
        />
        <IntroCamera onComplete={() => setIsIntroDone(true)} />
        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 25, 15]}
          angle={0.25}
          penumbra={1}
          intensity={2500}
          castShadow
        />
        <pointLight position={[-8, 10, -5]} intensity={800} color="#00ffff" />
        <pointLight position={[8, 10, -5]} intensity={800} color="#ff3366" />

        <Suspense fallback={null}>
          <Physics gravity={[0, -15, 0]}>
            <VenusMachineBody />

            {/* 45개 공 생성 */}
            {ballsData.map((ball) => {
              const capIndex = visualExtracted.indexOf(ball.id);
              const isCaptured = capIndex !== -1;

              // 현재 추출해야 할 다음 번호 (Target)
              const nextTarget = drawnNumbers.find(
                (n) => !visualExtracted.includes(n),
              );
              const isTargeted = nextTarget === ball.id;

              return (
                <LottoBall
                  key={ball.id}
                  number={ball.id}
                  color={ball.color}
                  isSpinning={isSpinning}
                  isCaptured={isCaptured}
                  captureIndex={capIndex}
                  isTargeted={isTargeted}
                  onCapture={handleBallCapture}
                />
              );
            })}

            {/* 추출 센서 (상단 튜브 입구) */}
            <CuboidCollider
              position={[0, 2.3, 0]}
              args={[0.6, 0.2, 0.6]}
              sensor
              onIntersectionEnter={(payload) => {
                // 특정 공이 센서에 닿으면 캡처 시도
                // (이 데모에서는 LottoBall 내부의 Y좌표 체크로 대체하거나
                //  여기서 payload.other 를 통해 식별 가능)
              }}
            />
          </Physics>

          <Environment preset="studio" />
          <ContactShadows
            position={[0, -7, 0]}
            opacity={0.5}
            scale={20}
            blur={2.5}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enabled={isIntroDone}
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.7}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>

      <button
        type="button"
        onClick={resetCameraToFront}
        className="absolute top-4 right-4 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/80 shadow-md backdrop-blur transition hover:bg-white/20"
      >
        정면 보기
      </button>
    </div>
  );
}
