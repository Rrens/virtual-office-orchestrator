'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useMemo, useRef, useState } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { AnimatedAgent } from './AnimatedAgent';
import { OfficeMinimap } from './OfficeMinimap';
import type { WSEvent } from '../../hooks/useProjectWebSocket';

interface Agent3D {
  id: string;
  role: string;
  name: string;
  status: string;
  position: [number, number, number];
  color: string;
}

const DESK_COLOR = '#334155';

const DEPARTMENT_ROOMS = [
  { name: 'Executive Room', pos: [-6, 0, -6] as [number, number, number], size: [5, 0.1, 5] as [number, number, number], color: '#312e81' },
  { name: 'Product Studio', pos: [0, 0, -6] as [number, number, number], size: [5, 0.1, 5] as [number, number, number], color: '#1e1b4b' },
  { name: 'Engineering Lab', pos: [6, 0, -6] as [number, number, number], size: [5, 0.1, 5] as [number, number, number], color: '#0f172a' },
  { name: 'Design Studio', pos: [-6, 0, 0] as [number, number, number], size: [5, 0.1, 5] as [number, number, number], color: '#3b0764' },
  { name: 'War Room / Server', pos: [6, 0, 0] as [number, number, number], size: [5, 0.1, 5] as [number, number, number], color: '#450a0a' },
  { name: 'Marketing & Sales', pos: [-6, 0, 6] as [number, number, number], size: [5, 0.1, 5] as [number, number, number], color: '#064e3b' },
  { name: 'Central Meeting', pos: [0, 0, 0] as [number, number, number], size: [6, 0.1, 6] as [number, number, number], color: '#1e293b' },
];

const DEFAULT_AGENTS: Agent3D[] = [
  { id: '1', role: 'orchestrator', name: 'Chief Orchestrator', status: 'idle', position: [-6, 0.5, -6], color: '#818cf8' },
  { id: '2', role: 'product-manager', name: 'Product Manager', status: 'idle', position: [0, 0.5, -6], color: '#a78bfa' },
  { id: '3', role: 'backend-engineer', name: 'Backend Engineer', status: 'idle', position: [6, 0.5, -6], color: '#38bdf8' },
  { id: '4', role: 'frontend-engineer', name: 'Frontend Engineer', status: 'idle', position: [6, 0.5, -4.5], color: '#34d399' },
  { id: '5', role: 'ui-ux-designer', name: 'UI/UX Designer', status: 'idle', position: [-6, 0.5, 0], color: '#f472b6' },
  { id: '6', role: 'qa-engineer', name: 'QA Lead', status: 'idle', position: [6, 0.5, 0], color: '#fbbf24' },
  { id: '7', role: 'devops', name: 'DevOps & SRE', status: 'idle', position: [6, 0.5, 1.5], color: '#f87171' },
];

interface Props {
  events: WSEvent[];
}

export function Office3DCanvas({ events }: Props) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const agentStates = useMemo(() => {
    const map = new Map<string, Agent3D>();
    DEFAULT_AGENTS.forEach((a) => map.set(a.role, { ...a }));

    events.forEach((e) => {
      if (e.type?.startsWith('agent.') || e.type?.startsWith('task.')) {
        const role = String(e.agentRole ?? e.role ?? '');
        if (map.has(role)) {
          const agent = map.get(role)!;
          agent.status = String(e.newStatus ?? e.type.replace('agent.', ''));
        }
      }
    });

    return Array.from(map.values());
  }, [events]);

  const activeWorkingCount = agentStates.filter(
    (a) => a.status === 'working' || a.status === 'thinking'
  ).length;

  const handleTeleport = (targetPos: [number, number, number]) => {
    if (controlsRef.current) {
      controlsRef.current.target.set(targetPos[0], 0, targetPos[2]);
      controlsRef.current.object.position.set(targetPos[0], targetPos[1], targetPos[2] + 8);
      controlsRef.current.update();
    }
  };

  return (
    <div className="w-full h-full bg-slate-950 relative rounded-xl overflow-hidden border border-slate-800">
      {/* Top Controls Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/80 backdrop-blur border border-slate-700/60 p-2.5 rounded-lg text-xs text-slate-300 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-white">🏢 3D Virtual Office</p>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
            Active: {activeWorkingCount} agents
          </span>
        </div>
        <p className="text-[11px] text-slate-400">Left-click: Rotate | Right-click: Pan | Scroll: Zoom</p>
      </div>

      {/* 2D Minimap Overlay */}
      <OfficeMinimap onSelectRoom={handleTeleport} />

      <Canvas camera={{ position: [0, 12, 16], fov: 50 }}>
        {/* Dynamic Lighting: Intenser when agents are active */}
        <ambientLight intensity={0.6 + activeWorkingCount * 0.08} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />

        {/* Floor Base */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[20, 0.2, 20]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Department Rooms */}
        {DEPARTMENT_ROOMS.map((room, i) => (
          <group key={i} position={room.pos}>
            <mesh position={[0, 0.05, 0]}>
              <boxGeometry args={room.size} />
              <meshStandardMaterial color={room.color} opacity={0.65} transparent />
            </mesh>
            <Text
              position={[0, 0.2, -room.size[2] / 2 + 0.3]}
              rotation={[-Math.PI / 2, 0, 0]}
              fontSize={0.3}
              color="#94a3b8"
            >
              {room.name}
            </Text>
          </group>
        ))}

        {/* Agent Desks & Animated Avatars */}
        {agentStates.map((agent) => (
          <group key={agent.id}>
            {/* Desk */}
            <mesh position={[agent.position[0], 0.25, agent.position[2]]}>
              <boxGeometry args={[1.2, 0.5, 0.8]} />
              <meshStandardMaterial color={DESK_COLOR} />
            </mesh>

            {/* Monitor with active screen glow */}
            <mesh position={[agent.position[0], 0.6, agent.position[2] - 0.2]}>
              <boxGeometry args={[0.5, 0.3, 0.05]} />
              <meshStandardMaterial
                color={agent.status === 'working' ? '#38bdf8' : '#0f172a'}
                emissive={agent.status === 'working' ? '#0284c7' : '#000000'}
                emissiveIntensity={agent.status === 'working' ? 0.8 : 0}
              />
            </mesh>

            {/* Animated Character Avatar */}
            <AnimatedAgent
              role={agent.role}
              name={agent.name}
              status={agent.status}
              color={agent.color}
              targetPosition={agent.position}
            />
          </group>
        ))}

        <OrbitControls ref={controlsRef} maxPolarAngle={Math.PI / 2 - 0.1} minDistance={4} maxDistance={30} />
      </Canvas>
    </div>
  );
}
