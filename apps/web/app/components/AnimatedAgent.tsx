'use client';

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ReadyPlayerMeAvatar } from './ReadyPlayerMeAvatar';

interface AnimatedAgentProps {
  role: string;
  name: string;
  status: string;
  color: string;
  targetPosition: [number, number, number];
  url?: string;
}

export function AnimatedAgent({
  role,
  name,
  status,
  color,
  targetPosition,
  url,
}: AnimatedAgentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(...targetPosition));
  const targetVec = useRef(new THREE.Vector3(...targetPosition));

  useEffect(() => {
    // When agent is reviewing, they walk to meeting room [0, 0.5, 0]
    // Otherwise they stay at their designated desk position
    if (status === 'reviewing') {
      targetVec.current.set(0, 0.5, 0);
    } else {
      targetVec.current.set(...targetPosition);
    }
  }, [status, targetPosition]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smooth lerp toward target position (walking simulation)
    currentPos.current.lerp(targetVec.current, Math.min(delta * 2.5, 1));
    groupRef.current.position.copy(currentPos.current);

    // Subtle bobbing animation while "walking"
    const dist = currentPos.current.distanceTo(targetVec.current);
    if (dist > 0.05) {
      groupRef.current.position.y += Math.sin(Date.now() * 0.01) * 0.03;
    }
  });

  return (
    <group ref={groupRef}>
      <ReadyPlayerMeAvatar
        role={role}
        name={name}
        status={status}
        color={color}
        position={[0, 0, 0]}
        url={url}
      />
    </group>
  );
}
