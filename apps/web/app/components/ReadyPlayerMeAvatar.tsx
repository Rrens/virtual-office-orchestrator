'use client';

import { Suspense, useMemo, useRef, Component, type ReactNode } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROLE_AVATAR_MAP, STATUS_EMOJI } from '../lib/avatars';

interface AvatarProps {
  url?: string;
  role: string;
  name: string;
  status: string;
  color: string;
  position: [number, number, number];
}

// Error boundary to catch GLB fetch failures
class GLBErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.fallback;
    return this.props.children;
  }
}

function RPMModel({
  url,
  position,
  status,
}: {
  url: string;
  position: [number, number, number];
  status: string;
}) {
  const { scene } = useGLTF(url);
  const meshRef = useRef<THREE.Group>(null);

  const cloned = useMemo(() => {
    const clone = scene.clone(true);
    clone.scale.set(0.65, 0.65, 0.65);
    clone.position.set(position[0], position[1] - 0.2, position[2]);
    return clone;
  }, [scene, position]);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        if (status === 'working') {
          child.material.emissiveIntensity = 0.15 + Math.sin(Date.now() * 0.003) * 0.1;
        } else if (status === 'error' || status === 'escalated') {
          child.material.emissive = new THREE.Color('#ff0000');
          child.material.emissiveIntensity = 0.3;
        } else if (status === 'completed') {
          child.material.emissive = new THREE.Color('#22c55e');
          child.material.emissiveIntensity = 0.2;
        } else {
          child.material.emissiveIntensity = 0;
        }
      }
    });
  });

  return (
    <group ref={meshRef}>
      <primitive object={cloned} />
    </group>
  );
}

function CapsuleAvatar({
  position,
  color,
  status,
}: {
  position: [number, number, number];
  color: string;
  status: string;
}) {
  const isActive = status === 'working' || status === 'thinking';
  return (
    <group>
      <mesh position={[position[0], position[1] + 0.5, position[2]]}>
        <capsuleGeometry args={[0.18, 0.7, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[position[0], position[1] + 1.2, position[2]]}>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {isActive && (
        <pointLight
          color={color}
          intensity={0.8}
          distance={2}
          position={[position[0], position[1] + 0.8, position[2]]}
        />
      )}
    </group>
  );
}

export function ReadyPlayerMeAvatar({ url, role, name, status, color, position }: AvatarProps) {
  const roleConfig = ROLE_AVATAR_MAP[role];
  const avatarUrl = url ?? roleConfig?.modelUrl;
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
  const fallback = <CapsuleAvatar position={position} color={color} status={status} />;

  return (
    <group>
      {avatarUrl ? (
        <GLBErrorBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <RPMModel url={avatarUrl} position={position} status={status} />
          </Suspense>
        </GLBErrorBoundary>
      ) : (
        fallback
      )}

      {/* PRD §24: Floating status bubble */}
      <Html position={[position[0], position[1] + 1.6, position[2]]} center distanceFactor={12}>
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
