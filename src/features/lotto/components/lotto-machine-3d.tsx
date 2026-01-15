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
 * - 구형 챔버
 * - 바닥 에어 블로어에서 바람이 나와 공들을 위로 띄움
 * - 상단 배출 튜브
 */

// Web Crypto API 기반 난수 생성
function getCryptoRandom(): number {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
  }
  return Math.random();
}

// 추첨 상태 머신
type DrawState = "IDLE" | "MIXING" | "EXTRACTING" | "COMPLETE";

// 바닥 에어 블로어 (시각적 표현)
function AirBlower({ isActive }: { isActive: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current && isActive) {
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 8) * 0.1;
      ringRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group position={[0, -2.25, 0]}>
      {/* 바닥 에어 구멍 (평면적 디자인으로 복구) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.7, 32]} />
        <meshStandardMaterial
          color={isActive ? "#444" : "#333"}
          metalness={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>

      {isActive && (
        <mesh
          ref={ringRef}
          position={[0, 0.1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial
            color="#88ccff"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
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
  onCapture: (num: number) => void;
}) {
  const rigidBody = useRef<RapierRigidBody>(null);
  const startTime = useRef<number>(0);

  const mass = 0.01;
  const restitution = 0.4;
  const friction = 0.15;

  useFrame((state) => {
    if (!rigidBody.current || isCaptured) return;

    const pos = rigidBody.current.translation();
    const vel = rigidBody.current.linvel();
    const t = state.clock.getElapsedTime();
    const distFromCenter = Math.sqrt(pos.x ** 2 + pos.z ** 2);

    if (isSpinning) {
      if (startTime.current === 0) {
        startTime.current = t;
      }

      const elapsed = t - startTime.current;
      const windRampUp = Math.min(elapsed / 4.0, 1.0);

      const isInWindZone = pos.y < 0.5 && distFromCenter < 1.0;

      if (isInWindZone) {
        const centerFactor = Math.max(0, 1.0 - distFromCenter / 1.0);
        const heightFactor = Math.max(0, 1.0 - (pos.y + 2.0) / 2.5);

        const baseLift = 60.0 * centerFactor * heightFactor * windRampUp;
        const randomLift = getCryptoRandom() * 32.0 * windRampUp;
        const totalLift = (baseLift + randomLift) * mass;

        rigidBody.current.applyImpulse(
          {
            x: (getCryptoRandom() - 0.5) * 0.5 * mass * windRampUp,
            y: totalLift,
            z: (getCryptoRandom() - 0.5) * 0.5 * mass * windRampUp,
          },
          true,
        );
      } else {
        const outsideFactor = Math.max(0, (distFromCenter - 1.0) / 1.5);
        const heightGravity = Math.max(0, pos.y + 1.0) * 0.5;
        const gravityBoost =
          (outsideFactor + heightGravity) * 3.0 * mass * windRampUp;

        rigidBody.current.applyImpulse({ x: 0, y: -gravityBoost, z: 0 }, true);

        if (distFromCenter > 1.2) {
          rigidBody.current.applyImpulse(
            {
              x: -pos.x * 0.15 * mass,
              y: 0,
              z: -pos.z * 0.15 * mass,
            },
            true,
          );
        }
      }

      const turbulenceStrength = isInWindZone
        ? pos.y < -1.0
          ? 0.15
          : 0.08
        : 0.03;
      rigidBody.current.applyImpulse(
        {
          x:
            Math.sin(t * 8 + number * 0.7) *
            turbulenceStrength *
            mass *
            windRampUp,
          y: getCryptoRandom() * 0.15 * mass * windRampUp,
          z:
            Math.cos(t * 7 + number * 0.5) *
            turbulenceStrength *
            mass *
            windRampUp,
        },
        true,
      );

      if (distFromCenter < 1.5 && pos.y < 0.5) {
        const swirlStrength =
          0.15 * windRampUp * Math.max(0, 1.0 - distFromCenter / 1.5);
        rigidBody.current.applyImpulse(
          {
            x: -pos.z * swirlStrength * mass,
            y: 0,
            z: pos.x * swirlStrength * mass,
          },
          true,
        );
      }

      // 타겟 공: 상단으로 유도
      if (isTargeted) {
        rigidBody.current.applyImpulse(
          {
            x: -pos.x * 0.5 * mass,
            y: 3.0 * mass,
            z: -pos.z * 0.5 * mass,
          },
          true,
        );

        // 충분히 올라갔으면 추출
        if (pos.y > 2.0) {
          onCapture(number);
        }
      }
    } else {
      rigidBody.current.setLinearDamping(3);
      rigidBody.current.setAngularDamping(3);
      startTime.current = 0;
    }

    // 구형 챔버 봉쇄
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

    // 속도 제한
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

  // 추출된 공 - 상단 레일에 배치
  if (isCaptured) {
    const targetX = -1.2 + captureIndex * 0.48;
    const targetY = 3.5;
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
            emissiveIntensity={0.3}
          />
        </mesh>
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
        (getCryptoRandom() - 0.5) * 3,
        (getCryptoRandom() - 0.5) * 2 - 0.5,
        (getCryptoRandom() - 0.5) * 3,
      ]}
      restitution={restitution}
      friction={friction}
      mass={mass}
      canSleep={false}
      linearDamping={isSpinning ? 0.15 : 2}
      angularDamping={isSpinning ? 0.3 : 2}
      userData={{ ballNumber: number }}
    >
      <BallCollider args={[0.18]} />
      <mesh castShadow>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial
          color={color}
          roughness={0.15}
          metalness={0.5}
          emissive={color}
          emissiveIntensity={0.12}
        />
      </mesh>
      <Text
        position={[0, 0, 0.2]}
        fontSize={0.13}
        color="#111"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#fff"
      >
        {number}
      </Text>
      <Text
        position={[0, 0, -0.2]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.13}
        color="#111"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.015}
        outlineColor="#fff"
      >
        {number}
      </Text>
    </RigidBody>
  );
}

// 구형 챔버 및 기계 본체
function VenusMachineBody() {
  return (
    <group>
      {/* 1. 구형 유리 챔버 */}
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
        <CuboidCollider
          position={[0, -2.3, 0]}
          args={[1, 0.1, 1]}
          restitution={0.2}
        />
      </RigidBody>

      {/* 2. 상단 추출 튜브 */}
      <group position={[0, 2.5, 0]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
          <meshStandardMaterial color="#222" metalness={1} />
        </mesh>
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

      {/* 3. 하단 베이스 (연결부 복구) */}
      <group position={[0, -2.5, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.8, 1.2, 0.6, 32]} />
          <meshStandardMaterial color="#333" metalness={1} roughness={0.2} />
        </mesh>
        <mesh position={[0, -2.5, 0]} receiveShadow>
          <cylinderGeometry args={[1.5, 2, 4, 32]} />
          <meshStandardMaterial color="#111" metalness={1} roughness={0.1} />
        </mesh>
        <mesh position={[0, -4.5, 0]} receiveShadow>
          <cylinderGeometry args={[6, 7, 0.8, 64]} />
          <meshStandardMaterial color="#050505" />
        </mesh>
      </group>

      {/* 4. 상단 드로잉 레일 */}
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
    </group>
  );
}

// 인트로 카메라
function IntroCamera({ onComplete }: { onComplete: () => void }) {
  const [active, setActive] = useState(true);

  useFrame((state) => {
    if (!active) return;

    // 모바일인 경우 더 멀리서 봄
    const isMobile = state.size.width < 768;
    const targetZ = isMobile ? 24 : 18;
    const targetY = isMobile ? 4 : 5;
    const targetPos = new THREE.Vector3(0, targetY, targetZ);
    const step = 0.04;

    state.camera.position.lerp(targetPos, step);
    state.camera.lookAt(0, 0, 0);

    if (state.camera.position.distanceTo(targetPos) < 0.01) {
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
  onReady,
}: {
  isSpinning: boolean;
  drawnNumbers: number[];
  onBallDrawn?: (num: number) => void;
  onReady?: () => void;
}) {
  const [visualExtracted, setVisualExtracted] = useState<number[]>([]);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const ballsData = useMemo(() => {
    return Array.from({ length: 45 }, (_, i) => ({
      id: i + 1,
      color: getLottoBallColor(i + 1),
    }));
  }, []);

  const spinningStartTime = useRef<number>(0);

  // 자동 추출 타이머
  useEffect(() => {
    if (!isSpinning || drawnNumbers.length === 0) return;
    if (visualExtracted.length >= drawnNumbers.length) return;

    const timer = setTimeout(() => {
      const nextBall = drawnNumbers.find(
        (num) => !visualExtracted.includes(num),
      );

      if (nextBall) {
        setVisualExtracted((prev) => [...prev, nextBall]);
        onBallDrawn?.(nextBall);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isSpinning, drawnNumbers, visualExtracted, onBallDrawn]);

  useEffect(() => {
    if (drawnNumbers.length === 0) {
      setVisualExtracted([]);
    }
  }, [drawnNumbers.length]);

  useEffect(() => {
    if (isSpinning) {
      spinningStartTime.current = Date.now();
      setVisualExtracted([]);
    }
  }, [isSpinning]);

  const handleBallCapture = (id: number) => {
    // 타이머 기반 추출로 변경됨
  };

  const [isIntroDone, setIsIntroDone] = useState(false);

  useEffect(() => {
    if (isIntroDone) {
      onReady?.();
    }
  }, [isIntroDone, onReady]);

  const resetCameraToFront = () => {
    const camera = cameraRef.current;
    if (!camera) return;

    const isMobile = window.innerWidth < 768;
    const targetZ = isMobile ? 24 : 18;
    const targetY = isMobile ? 4 : 5;

    camera.position.set(0, targetY, targetZ);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    controlsRef.current?.target.set(0, 0, 0);
    controlsRef.current?.update();
  };

  return (
    <div className="relative w-full h-[450px] md:h-[700px] bg-gradient-to-b from-slate-950 via-slate-900 to-black rounded-2xl md:rounded-3xl overflow-hidden shadow-edge border border-white/5">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [15, 15, 20], fov: 35 }}>
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          position={[15, 15, 20]}
          fov={35}
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
            <AirBlower isActive={isSpinning} />

            {ballsData.map((ball) => {
              const capIndex = visualExtracted.indexOf(ball.id);
              const isCaptured = capIndex !== -1;
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
          </Physics>

          <Environment preset="studio" />
          <ContactShadows
            position={[0, -7, 0]}
            opacity={0.5}
            scale={30}
            blur={2}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enabled={isIntroDone}
          enableZoom={true}
          enablePan={false}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 6}
          minDistance={10}
          maxDistance={35}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* 상태 표시 */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        {isSpinning && visualExtracted.length < 6 && (
          <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-medium text-emerald-400 backdrop-blur animate-pulse">
            교반 중...
          </div>
        )}
        {visualExtracted.length >= 6 && (
          <div className="rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-medium text-amber-400 backdrop-blur">
            추첨 완료
          </div>
        )}
      </div>

      {/* 카운터 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold text-white backdrop-blur">
        {visualExtracted.length} / 6
      </div>

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
