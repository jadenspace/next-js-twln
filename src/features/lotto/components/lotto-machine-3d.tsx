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

/**
 * 프로젝트 목표: 한국형 로또 추첨기 (비너스 모델, Air-mix 방식) 3D 시뮬레이션
 * 기술 스택: Three.js + Rapier Physics (@react-three/rapier)
 */

// 로또 당첨 색상 기준
const LOTTO_COLORS = {
  yellow: "#fbc400", // 1-10
  blue: "#69c8f2", // 11-20
  red: "#ff7272", // 21-30
  gray: "#aaaaaa", // 31-40
  green: "#b0d840", // 41-45
};

function getBallColor(num: number) {
  if (num <= 10) return LOTTO_COLORS.yellow;
  if (num <= 20) return LOTTO_COLORS.blue;
  if (num <= 30) return LOTTO_COLORS.red;
  if (num <= 40) return LOTTO_COLORS.gray;
  return LOTTO_COLORS.green;
}

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

    if (isSpinning) {
      const pos = rigidBody.current.translation();
      const vel = rigidBody.current.linvel();

      // 1. 하단 에어 블로어 (Upward Force)
      const distFromCenter = Math.sqrt(pos.x ** 2 + pos.z ** 2);
      if (pos.y < -0.5 && distFromCenter < 1.4) {
        const heightFactor = Math.pow(Math.max(0, 1.5 - pos.y), 2) * 6.0;
        const lift = (12.0 + heightFactor + Math.random() * 8.0) * mass;

        rigidBody.current.applyImpulse(
          {
            x: (Math.random() - 0.5) * 2 * mass,
            y: lift,
            z: (Math.random() - 0.5) * 2 * mass,
          },
          true,
        );
      }

      // 2. 난류 (Turbulence) - Perlin Noise 느낌의 랜덤 기류
      const t = state.clock.getElapsedTime();
      const noiseX = Math.sin(t * 10 + number) * 0.2;
      const noiseZ = Math.cos(t * 12 + number) * 0.2;

      rigidBody.current.applyImpulse(
        {
          x: noiseX * mass,
          y: Math.random() * 0.5 * mass,
          z: noiseZ * mass,
        },
        true,
      );

      // 3. 소용돌이 (Vortex)
      const swirl = 0.6;
      rigidBody.current.applyImpulse(
        {
          x: -pos.z * swirl * mass,
          y: 0,
          z: pos.x * swirl * mass,
        },
        true,
      );

      // 4. 추출 로직 (Extraction Logic)
      // 이번에 뽑힐 공(isTargeted)이 상단 추출구(y > 2.2) 근처에 우연히 진입하면 포획
      if (isTargeted && pos.y > 2.1 && distFromCenter < 0.6) {
        onCapture(number);
      }

      // 5. 완벽한 구체 봉쇄 (Hard Containment)
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
          { x: -vel.x * 0.5, y: -vel.y * 0.5, z: -vel.z * 0.5 },
          true,
        );
      }

      // 속도 제한
      const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
      if (speed > 22) {
        rigidBody.current.setLinvel(
          {
            x: (vel.x / speed) * 22,
            y: (vel.y / speed) * 22,
            z: (vel.z / speed) * 22,
          },
          true,
        );
      }
    } else {
      rigidBody.current.setLinearDamping(3);
      rigidBody.current.setAngularDamping(3);
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
            color="white"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.01}
            outlineColor="black"
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
          position={[0, 0, 0.19]}
          fontSize={0.14}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="black"
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
              opacity={0.08}
              transmission={1}
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

export function LottoMachine3D({
  isSpinning,
  drawnNumbers,
}: {
  isSpinning: boolean;
  drawnNumbers: number[];
}) {
  // 실제 3D 상에서 "추출 완료"된 것으로 간주되는 번호들 관리 (애니메이션 동기화용)
  const [visualExtracted, setVisualExtracted] = useState<number[]>([]);

  // 45개 공 데이터 생성
  const ballsData = useMemo(() => {
    return Array.from({ length: 45 }, (_, i) => ({
      id: i + 1,
      color: getBallColor(i + 1),
    }));
  }, []);

  // 외부(Props)에서 DrawnNumbers가 변할 때 시각적 동기화 초기화
  useEffect(() => {
    if (drawnNumbers.length === 0) {
      setVisualExtracted([]);
    }
  }, [drawnNumbers]);

  // 공이 상단 트랩 근처에 도달했을 때의 포획 이벤트 핸들러
  const handleBallCapture = (id: number) => {
    // 이미 추출된 번호가 아니고, 현재 뽑아야 할 번호 후보군에 있다면
    if (!visualExtracted.includes(id) && drawnNumbers.includes(id)) {
      setVisualExtracted((prev) => [...prev, id]);
    }
  };

  return (
    <div className="w-full h-[700px] bg-gradient-to-b from-slate-950 via-slate-900 to-black rounded-3xl overflow-hidden shadow-edge border border-white/5 relative">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 6, 18], fov: 28 }}>
        <PerspectiveCamera makeDefault position={[0, 5, 18]} fov={28} />
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
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.7}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>

      {/* 실시간 추첨 상태 UI */}
      <div className="absolute top-10 left-10 pointer-events-none">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-3xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-glow" />
            <h4 className="text-white/80 font-bold text-xs tracking-[0.2em] uppercase">
              Venus Simulation
            </h4>
          </div>
          <div className="flex gap-2.5">
            {visualExtracted.map((num) => (
              <div
                key={`status-${num}`}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-xl ring-2 ring-white/10"
                style={{ backgroundColor: getBallColor(num) }}
              >
                {num}
              </div>
            ))}
            {Array.from({ length: 6 - visualExtracted.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-10 h-10 rounded-full border border-dashed border-white/10 flex items-center justify-center text-white/10 text-xs"
              >
                ?
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 바닥 정보 데코레이션 */}
      <div className="absolute bottom-8 right-10 text-right pointer-events-none">
        <p className="text-white/20 text-[10px] font-medium tracking-widest uppercase">
          Air-Mix System v2.0
        </p>
        <p className="text-white/10 text-[9px] mt-1 font-mono italic">
          Physical Chaos & Fluid Dynamics Active
        </p>
      </div>
    </div>
  );
}
