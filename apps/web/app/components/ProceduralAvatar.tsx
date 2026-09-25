'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { STATUS_EMOJI } from '../lib/avatars';

interface Props {
  role: string;
  name: string;
  status: string;
  color: string;
  position: [number, number, number];
}

export function ProceduralAvatar({ role, name, status, color, position }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  const materials = useMemo(() => {
    return {
      skin: new THREE.MeshStandardMaterial({ color: '#f5d0b5', roughness: 0.6 }),
      shirt: new THREE.MeshStandardMaterial({ color, roughness: 0.5 }),
      dark: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.7 }),
      hair: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.8 }),
      accent: new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0ea5e9', emissiveIntensity: 0.2 }),
    };
  }, [color]);

  const accentColor = useMemo(() => new THREE.Color(color), [color]);

  const statusLabel = STATUS_EMOJI[status] ?? status;
  const bubbleBg: Record<string, string> = {
    thinking: 'bg-yellow-500',
    working: 'bg-indigo-500',
    reviewing: 'bg-amber-500',
    error: 'bg-red-500',
    escalated: 'bg-rose-600',
    completed: 'bg-emerald-500',
    assigned: 'bg-blue-500',
  };
  const bgClass = bubbleBg[status] ?? 'bg-slate-700';
  const pulse = ['working', 'thinking', 'error', 'escalated'].includes(status) ? 'animate-pulse' : '';

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (!groupRef.current) return;

    // Reset pose
    if (leftArmRef.current) leftArmRef.current.rotation.set(0, 0, 0);
    if (rightArmRef.current) rightArmRef.current.rotation.set(0, 0, 0);
    if (headRef.current) headRef.current.rotation.set(0, 0, 0);

    // Status-based emissive glow
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (status === 'error' || status === 'escalated') {
          child.material.emissive.setHex(0xff0000);
          child.material.emissiveIntensity = 0.35;
        } else if (status === 'completed') {
          child.material.emissive.setHex(0x22c55e);
          child.material.emissiveIntensity = 0.25;
        } else if (status === 'working') {
          child.material.emissive.copy(accentColor);
          child.material.emissiveIntensity = 0.1 + Math.sin(timeRef.current * 3) * 0.06;
        } else {
          child.material.emissive.setHex(0x000000);
          child.material.emissiveIntensity = 0;
        }
      }
    });

    if (status === 'idle') {
      groupRef.current.position.y = position[1] + Math.sin(timeRef.current * 1.5) * 0.01;
      const s = 1 + Math.sin(timeRef.current * 1.5) * 0.005;
      groupRef.current.scale.set(s, s, s);
    } else if (status === 'working') {
      groupRef.current.position.y = position[1] + Math.sin(timeRef.current * 8) * 0.012;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(timeRef.current * 10) * 0.25;
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.cos(timeRef.current * 10) * 0.25;
    } else if (status === 'thinking') {
      groupRef.current.position.y = position[1];
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(timeRef.current * 2) * 0.18;
        headRef.current.rotation.z = Math.sin(timeRef.current * 1.3) * 0.06;
      }
      if (rightArmRef.current) rightArmRef.current.rotation.x = -0.8 + Math.sin(timeRef.current * 2) * 0.1;
    } else if (status === 'error' || status === 'escalated') {
      groupRef.current.position.x = position[0] + Math.sin(timeRef.current * 35) * 0.012;
      groupRef.current.position.y = position[1];
    } else if (status === 'completed') {
      groupRef.current.position.y = position[1] + Math.abs(Math.sin(timeRef.current * 5)) * 0.08;
      if (leftArmRef.current) leftArmRef.current.rotation.z = Math.PI - 0.6;
      if (rightArmRef.current) rightArmRef.current.rotation.z = -(Math.PI - 0.6);
    } else if (status === 'walking') {
      groupRef.current.position.y = position[1] + Math.abs(Math.sin(timeRef.current * 6)) * 0.03;
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(timeRef.current * 6) * 0.4;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(timeRef.current * 6) * 0.4;
    } else {
      groupRef.current.position.set(position[0], position[1], position[2]);
      groupRef.current.scale.set(1, 1, 1);
    }
  });

  const accessory = useMemo(() => {
    switch (role) {
      case 'orchestrator':
        return (
          <group position={[0, 0.85, 0.13]}>
            <mesh material={materials.accent}>
              <boxGeometry args={[0.08, 0.25, 0.02]} />
            </mesh>
          </group>
        );
      case 'product-manager':
        return (
          <group position={[0.32, 0.75, 0.08]} rotation={[0.3, 0, -0.2]}>
            <mesh material={materials.accent}>
              <boxGeometry args={[0.18, 0.24, 0.01]} />
            </mesh>
          </group>
        );
      case 'backend-engineer':
        return (
          <group position={[0, 1.35, -0.1]}>
            <mesh material={materials.dark}>
              <sphereGeometry args={[0.2, 16, 16]} />
            </mesh>
          </group>
        );
      case 'frontend-engineer':
        return (
          <group position={[0, 1.38, 0]}>
            <mesh material={materials.accent}>
              <torusGeometry args={[0.22, 0.03, 8, 24]} />
            </mesh>
            <mesh position={[-0.22, 0, 0]} material={materials.accent}>
              <boxGeometry args={[0.05, 0.12, 0.08]} />
            </mesh>
            <mesh position={[0.22, 0, 0]} material={materials.accent}>
              <boxGeometry args={[0.05, 0.12, 0.08]} />
            </mesh>
          </group>
        );
      case 'ui-ux-designer':
        return (
          <group position={[0.32, 0.78, 0.06]} rotation={[0.4, 0, -0.3]}>
            <mesh material={materials.accent}>
              <boxGeometry args={[0.15, 0.2, 0.01]} />
            </mesh>
            <mesh position={[0.08, 0.12, 0.01]} material={materials.dark}>
              <cylinderGeometry args={[0.015, 0.015, 0.18, 8]} />
            </mesh>
          </group>
        );
      case 'qa-engineer':
        return (
          <group position={[0.32, 0.78, 0.06]} rotation={[0.2, 0, -0.2]}>
            <mesh material={materials.accent}>
              <boxGeometry args={[0.16, 0.22, 0.02]} />
            </mesh>
            <mesh position={[0, 0, 0.02]} material={materials.skin}>
              <boxGeometry args={[0.12, 0.16, 0.005]} />
            </mesh>
          </group>
        );
      case 'devops':
        return (
          <group position={[0, 1.38, 0]}>
            <mesh material={materials.accent}>
              <torusGeometry args={[0.2, 0.03, 8, 24]} />
            </mesh>
            <mesh position={[0.2, 0.05, 0]} material={materials.accent}>
              <cylinderGeometry args={[0.01, 0.01, 0.12, 6]} />
            </mesh>
            <mesh position={[0.26, 0.1, 0]} material={materials.accent}>
              <sphereGeometry args={[0.02, 8, 8]} />
            </mesh>
          </group>
        );
      default:
        return null;
    }
  }, [role, materials]);

  return (
    <group ref={groupRef} position={position}>
      {/* Legs */}
      <mesh position={[-0.12, 0.25, 0]} material={materials.dark}>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
      </mesh>
      <mesh position={[0.12, 0.25, 0]} material={materials.dark}>
        <capsuleGeometry args={[0.08, 0.5, 4, 8]} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.8, 0]} material={materials.shirt}>
        <boxGeometry args={[0.42, 0.6, 0.24]} />
      </mesh>

      {/* Arms */}
      <group ref={leftArmRef} position={[-0.26, 1.0, 0]}>
        <mesh material={materials.shirt}>
          <capsuleGeometry args={[0.06, 0.45, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.3, 0]} material={materials.skin}>
          <sphereGeometry args={[0.065, 8, 8]} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.26, 1.0, 0]}>
        <mesh material={materials.shirt}>
          <capsuleGeometry args={[0.06, 0.45, 4, 8]} />
        </mesh>
        <mesh position={[0, -0.3, 0]} material={materials.skin}>
          <sphereGeometry args={[0.065, 8, 8]} />
        </mesh>
      </group>

      {/* Head */}
      <group ref={headRef} position={[0, 1.35, 0]}>
        <mesh material={materials.skin}>
          <sphereGeometry args={[0.18, 16, 16]} />
        </mesh>
        <mesh position={[0, 0.1, -0.02]} material={materials.hair}>
          <sphereGeometry args={[0.19, 16, 16]} />
        </mesh>
        <mesh position={[-0.06, 0.02, 0.16]} material={materials.dark}>
          <sphereGeometry args={[0.02, 8, 8]} />
        </mesh>
        <mesh position={[0.06, 0.02, 0.16]} material={materials.dark}>
          <sphereGeometry args={[0.02, 8, 8]} />
        </mesh>
      </group>

      {accessory}

      {/* Floating status bubble */}
      <Html position={[0, 1.75, 0]} center distanceFactor={12}>
        <div className="flex flex-col items-center pointer-events-none">
          <div className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-semibold text-white whitespace-nowrap shadow-lg">
            {name}
          </div>
          {status !== 'idle' && (
            <span className={`mt-0.5 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold text-white whitespace-nowrap ${bgClass} ${pulse}`}>
              {statusLabel}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}
