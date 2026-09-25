'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { BehaviorState, AgentId } from './AgentBehaviorController';

interface AgentCharacterProps {
  id: AgentId;
  name: string;
  state: BehaviorState;
  currentPos: [number, number, number];
  facingTarget?: [number, number, number];
  message?: string;
}

const AGENT_CONFIG: Record<AgentId, { color: string; shirt: string; hair: string; pants: string; skin: string }> = {
  pingot: { color: '#3f6fd1', shirt: '#5a8ae8', hair: '#1e3a5f', pants: '#2d3e50', skin: '#f5d7c4' },
  zaki:   { color: '#2f9a6d', shirt: '#4ab887', hair: '#1a5c42', pants: '#2a3d34', skin: '#d4a88a' },
  lulu:   { color: '#d9772f', shirt: '#f09052', hair: '#8f4e20', pants: '#5a3a2a', skin: '#fce0ca' },
  risko:  { color: '#7a5cc4', shirt: '#9776d9', hair: '#4a3678', pants: '#3d2f52', skin: '#f0c8a8' },
};

const STATE_MESSAGES: Partial<Record<BehaviorState, string>> = {
  coffee_break: 'Ngopi bentar...',
  gaming_ps5: 'Main PS5 dulu!',
  chatting: 'Ngobrol...',
  pacing: 'Mikir dulu...',
  meeting: 'Diskusi sprint',
};

export function AgentCharacter({ id, name, state, currentPos, facingTarget, message }: AgentCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const timeRef = useRef(Math.random() * 10);
  const prevPos = useRef<[number, number, number]>([...currentPos]);

  const cfg = AGENT_CONFIG[id];

  const mats = useMemo(() => ({
    skin: new THREE.MeshStandardMaterial({ color: cfg.skin, roughness: 0.6 }),
    shirt: new THREE.MeshStandardMaterial({ color: cfg.shirt, roughness: 0.5 }),
    pants: new THREE.MeshStandardMaterial({ color: cfg.pants, roughness: 0.7 }),
    hair: new THREE.MeshStandardMaterial({ color: cfg.hair, roughness: 0.8 }),
    shoes: new THREE.MeshStandardMaterial({ color: '#2b2a28', roughness: 0.4 }),
    mug: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 }),
    coffee: new THREE.MeshStandardMaterial({ color: '#4a2c0a' }),
    gamepad: new THREE.MeshStandardMaterial({ color: '#1a1a2e', roughness: 0.4 }),
    gampadBtn: new THREE.MeshStandardMaterial({ color: cfg.color, emissive: cfg.color, emissiveIntensity: 0.4 }),
  }), [cfg]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    const t = timeRef.current;
    if (!groupRef.current) return;

    // Smooth position from currentPos
    groupRef.current.position.set(currentPos[0], currentPos[1], currentPos[2]);

    // Face direction of movement or facingTarget
    const dx = currentPos[0] - prevPos.current[0];
    const dz = currentPos[2] - prevPos.current[2];
    if (Math.sqrt(dx * dx + dz * dz) > 0.001) {
      const angle = Math.atan2(dx, dz);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.15);
    } else if (facingTarget) {
      const fx = facingTarget[0] - currentPos[0];
      const fz = facingTarget[2] - currentPos[2];
      if (Math.sqrt(fx * fx + fz * fz) > 0.1) {
        const angle = Math.atan2(fx, fz);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, angle, 0.08);
      }
    }
    prevPos.current = [...currentPos];

    // Reset limbs
    if (leftArmRef.current) leftArmRef.current.rotation.set(0, 0, 0);
    if (rightArmRef.current) rightArmRef.current.rotation.set(0, 0, 0);
    if (headRef.current) headRef.current.rotation.set(0, 0, 0);
    if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0);
    if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, 0);

    if (state === 'walking') {
      groupRef.current.position.y = currentPos[1] + Math.abs(Math.sin(t * 7)) * 0.05;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 7) * 0.55;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 7) * 0.55;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.sin(t * 7) * 0.45;
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * 7) * 0.45;
    } else if (state === 'typing' || state === 'working') {
      groupRef.current.position.y = currentPos[1] + Math.sin(t * 9) * 0.008;
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
    } else if (state === 'chatting') {
      if (headRef.current) headRef.current.rotation.y = Math.sin(t * 2.5) * 0.15;
      if (leftArmRef.current) leftArmRef.current.rotation.z = Math.sin(t * 2) * 0.2;
    } else if (state === 'pacing') {
      groupRef.current.position.y = currentPos[1] + Math.abs(Math.sin(t * 4)) * 0.03;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 4) * 0.35;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 4) * 0.35;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.sin(t * 4) * 0.3;
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * 4) * 0.3;
    } else if (state === 'meeting') {
      if (headRef.current) headRef.current.rotation.y = Math.sin(t * 1.5) * 0.12;
      if (leftArmRef.current) leftArmRef.current.rotation.z = 0.15;
    } else if (state === 'error') {
      groupRef.current.position.x = currentPos[0] + Math.sin(t * 32) * 0.018;
      if (headRef.current) headRef.current.rotation.z = Math.sin(t * 10) * 0.12;
    } else if (state === 'success') {
      groupRef.current.position.y = currentPos[1] + Math.abs(Math.sin(t * 5)) * 0.07;
      if (leftArmRef.current) leftArmRef.current.rotation.z = Math.PI - 0.4;
      if (rightArmRef.current) rightArmRef.current.rotation.z = -(Math.PI - 0.4);
    } else {
      // idle — gentle breathing
      groupRef.current.position.y = currentPos[1] + Math.sin(t * 1.2) * 0.007;
    }
  });

  const displayMsg = message ?? STATE_MESSAGES[state] ?? '';
  const isWarn = state === 'error';

  return (
    <group ref={groupRef} position={currentPos}>
      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.14, 0.28, 0]}>
        <mesh material={mats.pants}>
          <capsuleGeometry args={[0.09, 0.52, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.35, 0.05]} material={mats.shoes}>
          <boxGeometry args={[0.13, 0.08, 0.22]} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.14, 0.28, 0]}>
        <mesh material={mats.pants}>
          <capsuleGeometry args={[0.09, 0.52, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.35, 0.05]} material={mats.shoes}>
          <boxGeometry args={[0.13, 0.08, 0.22]} />
        </mesh>
      </group>

      {/* Torso */}
      <mesh position={[0, 0.85, 0]} material={mats.shirt}>
        <boxGeometry args={[0.46, 0.66, 0.27]} />
      </mesh>
      {/* Collar */}
      <mesh position={[0, 1.14, 0.1]} material={mats.skin}>
        <boxGeometry args={[0.18, 0.1, 0.06]} />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.29, 1.05, 0]}>
        <mesh material={mats.shirt}>
          <capsuleGeometry args={[0.07, 0.5, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.33, 0]} material={mats.skin}>
          <sphereGeometry args={[0.075, 10, 10]} />
        </mesh>
        {/* Coffee mug in left hand during coffee_break */}
        {state === 'coffee_break' && (
          <group position={[0, -0.42, 0]}>
            <mesh material={mats.mug}>
              <cylinderGeometry args={[0.055, 0.05, 0.1, 12]} />
            </mesh>
            <mesh position={[0, 0.02, 0]} material={mats.coffee}>
              <cylinderGeometry args={[0.048, 0.048, 0.01, 12]} />
            </mesh>
          </group>
        )}
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.29, 1.05, 0]}>
        <mesh material={mats.shirt}>
          <capsuleGeometry args={[0.07, 0.5, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.33, 0]} material={mats.skin}>
          <sphereGeometry args={[0.075, 10, 10]} />
        </mesh>
        {/* PS5 Gamepad right hand */}
        {state === 'gaming_ps5' && (
          <group position={[0, -0.42, 0]}>
            <mesh material={mats.gamepad}>
              <boxGeometry args={[0.12, 0.06, 0.08]} />
            </mesh>
            <mesh position={[-0.04, 0.02, 0]} material={mats.gampadBtn}>
              <sphereGeometry args={[0.015, 6, 6]} />
            </mesh>
            <mesh position={[0.04, 0.02, 0]} material={mats.gampadBtn}>
              <sphereGeometry args={[0.015, 6, 6]} />
            </mesh>
          </group>
        )}
      </group>

      {/* Head */}
      <group ref={headRef} position={[0, 1.42, 0]}>
        <mesh material={mats.skin}>
          <sphereGeometry args={[0.19, 18, 18]} />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 0.09, -0.02]} material={mats.hair}>
          <sphereGeometry args={[0.2, 16, 16]} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.07, 0.02, 0.17]} material={mats.shoes}>
          <sphereGeometry args={[0.025, 8, 8]} />
        </mesh>
        <mesh position={[0.07, 0.02, 0.17]} material={mats.shoes}>
          <sphereGeometry args={[0.025, 8, 8]} />
        </mesh>
        {/* Nose */}
        <mesh position={[0, -0.03, 0.185]} material={mats.skin}>
          <sphereGeometry args={[0.018, 6, 6]} />
        </mesh>
      </group>

      {/* Role accessories */}
      {id === 'pingot' && (
        <group position={[0, 1.52, 0.14]}>
          <mesh>
            <boxGeometry args={[0.1, 0.28, 0.02]} />
            <meshStandardMaterial color={cfg.color} />
          </mesh>
        </group>
      )}
      {id === 'zaki' && (
        <group position={[0, 1.53, 0]}>
          <mesh>
            <torusGeometry args={[0.23, 0.025, 8, 24]} />
            <meshStandardMaterial color={cfg.color} />
          </mesh>
        </group>
      )}
      {id === 'lulu' && (
        <group position={[0.36, 0.82, 0.09]} rotation={[0.3, 0, -0.25]}>
          <mesh>
            <boxGeometry args={[0.18, 0.24, 0.02]} />
            <meshStandardMaterial color={cfg.color} />
          </mesh>
        </group>
      )}
      {id === 'risko' && (
        <group position={[0, 1.53, 0]}>
          <mesh>
            <boxGeometry args={[0.36, 0.04, 0.04]} />
            <meshStandardMaterial color={cfg.color} />
          </mesh>
        </group>
      )}

      {/* Name tag + speech bubble — pure 3D Billboard & Text, zero React DOM portal unmount race conditions */}
      <Billboard position={[0, 1.95, 0]} follow lockX={false} lockY={false} lockZ={false}>
        {/* Name pill background */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[0.9, 0.28]} />
          <meshBasicMaterial color={cfg.color} />
        </mesh>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.13}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>

        {/* Speech bubble */}
        {displayMsg && (
          <group position={[0, 0.32, 0]}>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[Math.max(1.0, displayMsg.length * 0.09), 0.26]} />
              <meshBasicMaterial color={isWarn ? '#fff4d6' : '#ffffff'} />
            </mesh>
            <Text
              position={[0, 0, 0.01]}
              fontSize={0.11}
              color={isWarn ? '#7a5800' : '#2b2a28'}
              anchorX="center"
              anchorY="middle"
            >
              {displayMsg}
            </Text>
          </group>
        )}
      </Billboard>
    </group>
  );
}
