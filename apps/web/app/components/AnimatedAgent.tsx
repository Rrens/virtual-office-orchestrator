'use client';

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ProceduralAvatar } from './ProceduralAvatar';

interface AnimatedAgentProps {
  role: string;
  name: string;
  status: string;
  color: string;
  targetPosition: [number, number, number];
  url?: string;
}

const LOD_HIGH = 10;
const LOD_MED = 18;

export function AnimatedAgent({
  role,
  name,
  status,
  color,
  targetPosition,
  url,
}: AnimatedAgentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lodRef = useRef<'high' | 'med' | 'billboard'>('high');
  const currentPos = useRef(new THREE.Vector3(...targetPosition));
  const targetVec = useRef(new THREE.Vector3(...targetPosition));
  const { camera } = useThree();

  useEffect(() => {
    if (status === 'reviewing') {
      targetVec.current.set(0, 0.5, 0);
    } else {
      targetVec.current.set(...targetPosition);
    }
  }, [status, targetPosition]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    currentPos.current.lerp(targetVec.current, Math.min(delta * 2.5, 1));
    groupRef.current.position.copy(currentPos.current);

    const dist = currentPos.current.distanceTo(targetVec.current);
    if (dist > 0.05) {
      groupRef.current.position.y += Math.sin(Date.now() * 0.01) * 0.03;
    }

    // LOD: compute distance from camera to agent
    const camDist = camera.position.distanceTo(currentPos.current);
    if (camDist < LOD_HIGH) {
      lodRef.current = 'high';
    } else if (camDist < LOD_MED) {
      lodRef.current = 'med';
    } else {
      lodRef.current = 'billboard';
    }
  });

  return (
    <group ref={groupRef}>
      {lodRef.current === 'billboard' ? (
        // LOD2: flat billboard sphere — minimal poly
        <mesh>
          <sphereGeometry args={[0.25, 6, 6]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ) : lodRef.current === 'med' ? (
        // LOD1: capsule silhouette ~5k poly equivalent
        <group>
          <mesh position={[0, 0.5, 0]}>
            <capsuleGeometry args={[0.18, 0.7, 4, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          {(status === 'working' || status === 'thinking') && (
            <pointLight color={color} intensity={0.6} distance={1.5} />
          )}
        </group>
      ) : (
        // LOD0: procedural stylized 3D avatar (offline, zero network deps)
        <ProceduralAvatar
          role={role}
          name={name}
          status={status}
          color={color}
          position={[0, 0, 0]}
        />
      )}
    </group>
  );
}
