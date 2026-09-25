'use client';

import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// ReadyPlayerMe pre-generated public sample avatar models for common archetypes
// Users can provide any ReadyPlayerMe URL via avatarUrl in agent_instances table
export const RPM_AVATAR_PRESETS: Record<string, string> = {
  'orchestrator': 'https://models.readyplayer.me/6460d300eb29239845287376.glb',
  'product-manager': 'https://models.readyplayer.me/6460d342eb29239845287382.glb',
  'backend-engineer': 'https://models.readyplayer.me/6460d38feb29239845287390.glb',
  'frontend-engineer': 'https://models.readyplayer.me/6460d3c0eb29239845287399.glb',
  'ui-ux-designer': 'https://models.readyplayer.me/6460d3faeb292398452873a4.glb',
  'qa-engineer': 'https://models.readyplayer.me/6460d42eeb292398452873b2.glb',
  'devops': 'https://models.readyplayer.me/6460d45beb292398452873bd.glb',
};

interface AvatarProps {
  url?: string;
  role: string;
  name: string;
  status: string;
  color: string;
  position: [number, number, number];
}

function RPMModel({ url, position }: { url: string; position: [number, number, number] }) {
  const { scene } = useGLTF(url);

  // Clone scene to avoid sharing materials between instances
  const cloned = useMemo(() => {
    const clone = scene.clone();
    clone.scale.set(0.65, 0.65, 0.65);
    clone.position.set(position[0], position[1] - 0.2, position[2]);
    return clone;
  }, [scene, position]);

  return <primitive object={cloned} />;
}

function FallbackMesh({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={[position[0], position[1] + 0.3, position[2]]}>
      <capsuleGeometry args={[0.2, 0.5, 8, 16]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export function ReadyPlayerMeAvatar({ url, role, name, status, color, position }: AvatarProps) {
  const avatarUrl = url || RPM_AVATAR_PRESETS[role];

  return (
    <group>
      {/* 3D Character Model with Suspense Fallback */}
      {avatarUrl ? (
        <Suspense fallback={<FallbackMesh position={position} color={color} />}>
          <RPMModel url={avatarUrl} position={position} />
        </Suspense>
      ) : (
        <FallbackMesh position={position} color={color} />
      )}

      {/* Floating Status Label */}
      <Html position={[position[0], position[1] + 1.2, position[2]]} center distanceFactor={12}>
        <div className="flex flex-col items-center pointer-events-none">
          <div className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-semibold text-white whitespace-nowrap shadow-lg">
            {name}
          </div>
          {status !== 'idle' && (
            <span className="mt-0.5 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-500 text-white animate-pulse">
              {status}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}
