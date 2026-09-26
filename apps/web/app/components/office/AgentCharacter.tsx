'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { DEPT_THEMES } from './OfficeWaypoints';
import type { BehaviorState } from './AgentBehaviorController';

interface AgentCharacterProps {
  role: string;
  name: string;
  title: string;
  department: string;
  state: BehaviorState;
  currentPos: [number, number, number];
  facingTarget?: [number, number, number];
  message?: string;
  distance?: number; // for LOD
}

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  const bigint = parseInt(c, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255].map((v) => v / 255) as [number, number, number];
}

function shadeColor(hex: string, percent: number): string {
  const [r, g, b] = hexToRgb(hex);
  const rr = Math.min(255, Math.max(0, r * 255 + percent));
  const gg = Math.min(255, Math.max(0, g * 255 + percent));
  const bb = Math.min(255, Math.max(0, b * 255 + percent));
  return `rgb(${Math.round(rr)}, ${Math.round(gg)}, ${Math.round(bb)})`;
}

const STATE_MESSAGES: Partial<Record<BehaviorState, string>> = {
  coffee_break: 'Ngopi dulu...',
  gaming_ps5: 'Main PS5 🎮',
  playing_billiard: 'Billiard 🎱',
  playing_guitar: 'Gitar 🎸',
  playing_piano: 'Piano 🎹',
  playing_drums: 'Drum 🥁',
  chatting: 'Ngobrol...',
  pacing: 'Mikir...',
  meeting: 'Meeting',
};

export function AgentCharacter({
  role,
  name,
  title,
  department,
  state,
  currentPos,
  facingTarget,
  message,
  distance = 0,
}: AgentCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const timeRef = useRef(Math.random() * 10);
  const prevPos = useRef<[number, number, number]>([...currentPos]);
  const targetRotY = useRef(Math.PI); // default facing desk (-Z)
  const smoothPos = useRef(new THREE.Vector3(...currentPos));

  const deptTheme = DEPT_THEMES[department] ?? DEPT_THEMES.operations;
  const shirtColor = deptTheme.color;
  const pantsColor = shadeColor(shirtColor, -70);
  const hairColor = shadeColor(shirtColor, -120);
  const skinTone = '#f5d7c4';

  const shirt = useMemo(() => new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.5 }), [shirtColor]);
  const pants = useMemo(() => new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.7 }), [pantsColor]);
  const hair = useMemo(() => new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.8 }), [hairColor]);
  const skin = useMemo(() => new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.6 }), [skinTone]);
  const dark = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b2a28', roughness: 0.4 }), []);

  const LOD: 'full' | 'medium' | 'dot' = distance < 10 ? 'full' : distance < 20 ? 'medium' : 'dot';

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    if (!groupRef.current) return;

    // Smooth 60 FPS position interpolation
    smoothPos.current.lerp(new THREE.Vector3(currentPos[0], currentPos[1], currentPos[2]), 0.18);
    groupRef.current.position.copy(smoothPos.current);

    const renderPos = smoothPos.current;

    // Compute motion-based look angle
    const dx = currentPos[0] - prevPos.current[0];
    const dz = currentPos[2] - prevPos.current[2];
    const isMoving = Math.sqrt(dx * dx + dz * dz) > 0.001;

    if (isMoving) {
      // Walking agents face direction of movement
      const angle = Math.atan2(dx, dz);
      targetRotY.current = angle;
    } else if (
      state === 'working' ||
      state === 'typing' ||
      state === 'thinking' ||
      state === 'idle' ||
      state === 'success' ||
      state === 'error'
    ) {
      // At desk: face monitors (toward -Z)
      targetRotY.current = Math.PI;
    } else if (facingTarget) {
      const fx = facingTarget[0] - currentPos[0];
      const fz = facingTarget[2] - currentPos[2];
      if (Math.sqrt(fx * fx + fz * fz) > 0.1) {
        targetRotY.current = Math.atan2(fx, fz);
      }
    }

    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY.current, 0.12);
    prevPos.current = [...currentPos];

    if (LOD === 'dot') {
      groupRef.current.position.y =
        state === 'walking'
          ? renderPos.y + Math.abs(Math.sin(t * 8)) * 0.06
          : renderPos.y + Math.sin(t * 1.5) * 0.01;
      return;
    }

    if (leftArmRef.current) leftArmRef.current.rotation.set(0, 0, 0);
    if (rightArmRef.current) rightArmRef.current.rotation.set(0, 0, 0);
    if (headRef.current) headRef.current.rotation.set(0, 0, 0);
    if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0);
    if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, 0);

    if (state === 'walking') {
      groupRef.current.position.y = renderPos.y + Math.abs(Math.sin(t * 7)) * 0.05;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 7) * 0.55;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 7) * 0.55;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.sin(t * 7) * 0.45;
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * 7) * 0.45;
    } else if (state === 'typing' || state === 'working') {
      groupRef.current.position.y = renderPos.y + Math.sin(t * 9) * 0.008;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -1.25 + Math.sin(t * 14) * 0.18;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -1.25 + Math.cos(t * 14) * 0.18;
      if (headRef.current) headRef.current.rotation.x = 0.18;
    } else if (state === 'thinking') {
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 2) * 0.22;
        headRef.current.rotation.z = Math.sin(t * 1.4) * 0.08;
      }
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.95;
      if (rightArmRef.current) rightArmRef.current.rotation.z = -0.25;
    } else if (state === 'coffee_break') {
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -1.1 + Math.sin(t * 1.5) * 0.08;
        rightArmRef.current.rotation.z = -0.2;
      }
      if (headRef.current) headRef.current.rotation.x = 0.1;
    } else if (state === 'gaming_ps5') {
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.9 + Math.sin(t * 3) * 0.12;
        leftArmRef.current.rotation.z = 0.3;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.9 + Math.cos(t * 3) * 0.12;
        rightArmRef.current.rotation.z = -0.3;
      }
      if (headRef.current) headRef.current.rotation.x = 0.15;
    } else if (state === 'playing_billiard') {
      groupRef.current.rotation.y += Math.PI;
      groupRef.current.position.y = renderPos.y - 0.3;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -1.3 + Math.sin(t * 3) * 0.3;
      if (headRef.current) headRef.current.rotation.x = 0.2;
    } else if (state === 'playing_guitar') {
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -1.0;
        leftArmRef.current.rotation.z = 0.35;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.6;
        rightArmRef.current.rotation.z = -0.35;
      }
      if (headRef.current) headRef.current.rotation.z = Math.sin(t * 2) * 0.08;
    } else if (state === 'playing_piano') {
      groupRef.current.position.y = renderPos.y - 0.4;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -0.6 + Math.sin(t * 6) * 0.1;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.6 + Math.cos(t * 6) * 0.1;
    } else if (state === 'playing_drums') {
      if (leftArmRef.current) leftArmRef.current.rotation.z = Math.PI / 2 + Math.sin(t * 7) * 0.4;
      if (rightArmRef.current) rightArmRef.current.rotation.z = -Math.PI / 2 + Math.cos(t * 7) * 0.4;
      if (headRef.current) headRef.current.rotation.x = Math.sin(t * 7) * 0.1;
    } else if (state === 'chatting') {
      if (headRef.current) headRef.current.rotation.y = Math.sin(t * 2.5) * 0.15;
      if (leftArmRef.current) leftArmRef.current.rotation.z = Math.sin(t * 2) * 0.2;
    } else if (state === 'pacing') {
      groupRef.current.position.y = renderPos.y + Math.abs(Math.sin(t * 4)) * 0.03;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 4) * 0.35;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 4) * 0.35;
    } else if (state === 'meeting') {
      if (headRef.current) headRef.current.rotation.y = Math.sin(t * 1.5) * 0.12;
      if (leftArmRef.current) leftArmRef.current.rotation.z = 0.15;
    } else if (state === 'error') {
      groupRef.current.position.x = renderPos.x + Math.sin(t * 32) * 0.015;
      if (headRef.current) headRef.current.rotation.z = Math.sin(t * 10) * 0.12;
    } else if (state === 'success') {
      groupRef.current.position.y = renderPos.y + Math.abs(Math.sin(t * 5)) * 0.07;
      if (leftArmRef.current) leftArmRef.current.rotation.z = Math.PI - 0.4;
      if (rightArmRef.current) rightArmRef.current.rotation.z = -(Math.PI - 0.4);
    } else {
      groupRef.current.position.y = renderPos.y + Math.sin(t * 1.2) * 0.007;
    }
  });

  const displayMsg = message ?? STATE_MESSAGES[state] ?? '';
  const isWarn = state === 'error';
  const nameTagText = `${name} · ${title}`;
  const pillWidth = Math.max(0.9, nameTagText.length * 0.095);
  const hasMsg = Boolean(displayMsg);
  const cardHeight = hasMsg ? 0.54 : 0.32;

  // LOD DOT
  if (LOD === 'dot') {
    return (
      <group ref={groupRef} position={currentPos}>
        <mesh>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial
            color={shirtColor}
            emissive={shirtColor}
            emissiveIntensity={state === 'working' ? 0.4 : 0}
          />
        </mesh>
        {state === 'walking' && (
          <>
            <mesh position={[-0.08, -0.15, 0]} material={shirt}>
              <capsuleGeometry args={[0.04, 0.12, 4, 6]} />
            </mesh>
            <mesh position={[0.08, -0.15, 0]} material={shirt}>
              <capsuleGeometry args={[0.04, 0.12, 4, 6]} />
            </mesh>
          </>
        )}
      </group>
    );
  }

  // LOD MEDIUM
  if (LOD === 'medium') {
    return (
      <group ref={groupRef} position={currentPos}>
        <mesh position={[0, 0.55, 0]} material={shirt}>
          <capsuleGeometry args={[0.22, 0.6, 4, 8]} />
        </mesh>
        <mesh position={[0, 1.2, 0]} material={skin}>
          <sphereGeometry args={[0.2, 12, 12]} />
        </mesh>
        {state === 'working' && <pointLight color={shirtColor} intensity={0.5} distance={1.5} />}
      </group>
    );
  }

  // LOD FULL
  return (
    <group ref={groupRef} position={currentPos}>
      {/* Legs */}
      <group ref={leftLegRef} position={[-0.14, 0.28, 0]}>
        <mesh material={pants}><capsuleGeometry args={[0.09, 0.52, 4, 8]} /></mesh>
        <mesh position={[0, -0.35, 0.05]} material={dark}><boxGeometry args={[0.13, 0.08, 0.22]} /></mesh>
      </group>
      <group ref={rightLegRef} position={[0.14, 0.28, 0]}>
        <mesh material={pants}><capsuleGeometry args={[0.09, 0.52, 4, 8]} /></mesh>
        <mesh position={[0, -0.35, 0.05]} material={dark}><boxGeometry args={[0.13, 0.08, 0.22]} /></mesh>
      </group>

      {/* Torso */}
      <mesh position={[0, 0.85, 0]} material={shirt}><boxGeometry args={[0.46, 0.66, 0.27]} /></mesh>
      <mesh position={[0, 1.14, 0.1]} material={skin}><boxGeometry args={[0.18, 0.1, 0.06]} /></mesh>

      {/* Arms */}
      <group ref={leftArmRef} position={[-0.29, 1.05, 0]}>
        <mesh material={shirt}><capsuleGeometry args={[0.07, 0.5, 4, 8]} /></mesh>
        <mesh position={[0, -0.33, 0]} material={skin}><sphereGeometry args={[0.075, 10, 10]} /></mesh>
      </group>
      <group ref={rightArmRef} position={[0.29, 1.05, 0]}>
        <mesh material={shirt}><capsuleGeometry args={[0.07, 0.5, 4, 8]} /></mesh>
        <mesh position={[0, -0.33, 0]} material={skin}><sphereGeometry args={[0.075, 10, 10]} /></mesh>
      </group>

      {/* Head */}
      <group ref={headRef} position={[0, 1.42, 0]}>
        <mesh material={skin}><sphereGeometry args={[0.19, 18, 18]} /></mesh>
        <mesh position={[0, 0.09, -0.02]} material={hair}><sphereGeometry args={[0.2, 16, 16]} /></mesh>
        <mesh position={[-0.07, 0.02, 0.17]} material={dark}><sphereGeometry args={[0.025, 8, 8]} /></mesh>
        <mesh position={[0.07, 0.02, 0.17]} material={dark}><sphereGeometry args={[0.025, 8, 8]} /></mesh>
      </group>

      {/* Unified Sleek Dark Glassmorphism Badge (Standard Depth Test enabled so it never bleeds through floors!) */}
      <Billboard position={[0, 2.05, 0]} follow>
        {/* Background Card */}
        <mesh position={[0, hasMsg ? -0.08 : 0, -0.005]}>
          <planeGeometry args={[pillWidth + 0.18, cardHeight]} />
          <meshBasicMaterial color="#0b1324" transparent opacity={0.88} side={THREE.DoubleSide} />
        </mesh>
        {/* Department Accent Line at Top of Card */}
        <mesh position={[0, hasMsg ? -0.08 + cardHeight / 2 - 0.015 : cardHeight / 2 - 0.015, 0.001]}>
          <planeGeometry args={[pillWidth + 0.14, 0.03]} />
          <meshBasicMaterial color={shirtColor} side={THREE.DoubleSide} />
        </mesh>

        {/* Line 1: Agent Name & Role */}
        <Text
          position={[0, hasMsg ? 0.06 : 0, 0.01]}
          fontSize={0.11}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {nameTagText}
        </Text>

        {/* Line 2: Activity Status Message (Soft Cyan or Warning Amber, inside the same sleek card!) */}
        {hasMsg && (
          <Text
            position={[0, -0.16, 0.01]}
            fontSize={0.085}
            color={isWarn ? '#f59e0b' : '#38bdf8'}
            anchorX="center"
            anchorY="middle"
          >
            {displayMsg}
          </Text>
        )}
      </Billboard>
    </group>
  );
}
