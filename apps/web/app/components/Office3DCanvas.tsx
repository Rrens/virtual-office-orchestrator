'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useMemo, useRef, useState, useEffect } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
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

type CameraMode = 'orbit' | 'follow' | 'department' | 'cinematic';

interface Props {
  events: WSEvent[];
  onSelectAgent?: (role: string) => void;
}

function CinematicCamera({ active }: { active: boolean }) {
  useFrame(({ clock, camera }) => {
    if (!active) return;
    const t = clock.getElapsedTime() * 0.15;
    camera.position.x = Math.sin(t) * 18;
    camera.position.z = Math.cos(t) * 18;
    camera.position.y = 10 + Math.sin(t * 0.5) * 2;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export function Office3DCanvas({ events, onSelectAgent }: Props) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('orbit');
  const [followedRole, setFollowedRole] = useState<string>('backend-engineer');

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

  // Follow agent mode
  useEffect(() => {
    if (cameraMode === 'follow' && controlsRef.current) {
      const agent = agentStates.find((a) => a.role === followedRole);
      if (agent) {
        controlsRef.current.target.set(agent.position[0], 0.5, agent.position[2]);
        controlsRef.current.object.position.set(agent.position[0], 3, agent.position[2] + 4);
        controlsRef.current.update();
      }
    }
  }, [cameraMode, followedRole, agentStates]);

  return (
    <div className="w-full h-full bg-slate-950 relative rounded-xl overflow-hidden border border-slate-800">
      {/* Top Controls Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur border border-slate-700/60 p-2.5 rounded-lg text-xs text-slate-300 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold text-white">🏢 3D Virtual Office</p>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono">
            Active: {activeWorkingCount}
          </span>
        </div>

        {/* Camera Modes (PRD §24) */}
        <div className="flex gap-1 pt-1 border-t border-slate-800">
          {(['orbit', 'follow', 'cinematic'] as CameraMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setCameraMode(mode)}
              className={`text-[10px] px-2 py-0.5 rounded capitalize transition-colors ${
                cameraMode === mode
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {cameraMode === 'follow' && (
          <select
            value={followedRole}
            onChange={(e) => setFollowedRole(e.target.value)}
            className="w-full bg-slate-800 text-slate-200 text-[10px] rounded px-1.5 py-0.5 border border-slate-700 mt-1"
          >
            {agentStates.map((a) => (
              <option key={a.role} value={a.role}>
                Follow: {a.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 2D Minimap Overlay */}
      <OfficeMinimap onSelectRoom={handleTeleport} />

      <Canvas camera={{ position: [0, 12, 16], fov: 50 }}>
        <ambientLight intensity={0.6 + activeWorkingCount * 0.08} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />

        <CinematicCamera active={cameraMode === 'cinematic'} />

        {/* Floor Base */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[22, 0.2, 22]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Environmental Props (PRD §23) */}
        {/* Coffee Machine & Break Area */}
        <group position={[-9, 0.5, 8]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 0.8]} />
            <meshStandardMaterial color="#475569" />
          </mesh>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[0.4, 0.5, 0.4]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <Text position={[0, 1.1, 0]} fontSize={0.2} color="#94a3b8">
            ☕ Coffee Bar
          </Text>
        </group>

        {/* Server Racks in War Room */}
        <group position={[8, 1, 1]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.8, 2, 0.6]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0, 0, 0.31]}>
            <planeGeometry args={[0.7, 1.8]} />
            <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.6} />
          </mesh>
        </group>

        {/* Central Meeting Room Table & Whiteboard */}
        <group position={[0, 0.4, 0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[2, 2, 0.1, 16]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          {/* Whiteboard */}
          <mesh position={[0, 1.2, -2.5]}>
            <boxGeometry args={[3, 1.5, 0.05]} />
            <meshStandardMaterial color="#f8fafc" />
          </mesh>
        </group>

        {/* Lobby Dashboard Wall (PRD §23) */}
        <group position={[0, 2.5, 9.8]}>
          <mesh>
            <boxGeometry args={[8, 4, 0.2]} />
            <meshStandardMaterial color="#020617" />
          </mesh>
          <Text position={[0, 1.2, 0.15]} fontSize={0.35} color="#38bdf8">
            COMPANY HQ DASHBOARD
          </Text>
          <Text position={[0, 0.4, 0.15]} fontSize={0.25} color="#e2e8f0">
            Active Agents: {activeWorkingCount}
          </Text>
          <Text position={[0, -0.4, 0.15]} fontSize={0.2} color="#94a3b8">
            All Systems Operational
          </Text>
        </group>

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
            {/* Interactive Desk (PRD §23) */}
            <mesh
              position={[agent.position[0], 0.25, agent.position[2]]}
              onClick={() => onSelectAgent?.(agent.role)}
            >
              <boxGeometry args={[1.2, 0.5, 0.8]} />
              <meshStandardMaterial color={DESK_COLOR} />
            </mesh>

            {/* Interactive Monitor with active glow (PRD §23) */}
            <mesh
              position={[agent.position[0], 0.6, agent.position[2] - 0.2]}
              onClick={() => onSelectAgent?.(agent.role)}
            >
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

        {cameraMode !== 'cinematic' && (
          <OrbitControls
            ref={controlsRef}
            maxPolarAngle={Math.PI / 2 - 0.1}
            minDistance={4}
            maxDistance={30}
          />
        )}
      </Canvas>
    </div>
  );
}
