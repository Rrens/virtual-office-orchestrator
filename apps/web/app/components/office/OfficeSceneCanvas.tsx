'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef, useEffect, useState } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { OfficeEnvironment } from './OfficeEnvironment';
import { AgentCharacter } from './AgentCharacter';
import {
  initBehaviors30,
  tickBehaviors30,
  type AgentBehavior,
  type BehaviorState,
  getHomeDeskByRole,
} from './AgentBehaviorController';
import { AGENT_REGISTRY_30, OFFICE_WAYPOINTS, DEPT_THEMES } from './OfficeWaypoints';
import type { WSEvent } from '../../../hooks/useProjectWebSocket';

interface Props {
  events: WSEvent[];
  onSelectAgent?: (role: string) => void;
}

function SimulationLoop({
  behaviorsRef,
  setBehaviorsState,
}: {
  behaviorsRef: React.MutableRefObject<Record<string, AgentBehavior>>;
  setBehaviorsState: React.Dispatch<React.SetStateAction<Record<string, AgentBehavior>>>;
}) {
  const tickAccum = useRef(0);

  useFrame((_, delta) => {
    behaviorsRef.current = tickBehaviors30(behaviorsRef.current, delta);

    tickAccum.current += delta;
    if (tickAccum.current > 0.05) {
      setBehaviorsState({ ...behaviorsRef.current });
      tickAccum.current = 0;
    }
  });

  return null;
}

export function OfficeSceneCanvas({ events, onSelectAgent }: Props) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const behaviorsRef = useRef<Record<string, AgentBehavior>>(initBehaviors30());
  const [behaviors, setBehaviors] = useState<Record<string, AgentBehavior>>(behaviorsRef.current);

  // Sync real-time WebSocket events to behaviors
  useEffect(() => {
    if (!events.length) return;
    const latest = events[0];
    const role = String(latest.agentRole ?? latest.role ?? '');
    if (!role || !behaviorsRef.current[role]) return;

    const next = { ...behaviorsRef.current };
    const b = { ...next[role] };

    if (latest.type?.includes('working') || latest.type === 'task.assigned' || latest.type === 'task.started') {
      b.state = 'working';
      b.targetPos = getHomeDeskByRole(role);
      b.message = 'Sedang ngerjain task...';
    } else if (latest.type?.includes('thinking')) {
      b.state = 'thinking';
      b.targetPos = getHomeDeskByRole(role);
      b.message = 'Mikir solusi...';
    } else if (latest.type?.includes('review') || latest.type === 'approval.requested') {
      b.state = 'walking';
      b.targetPos = OFFICE_WAYPOINTS.MEETING_ROOM_1;
      (b as any)._nextState = 'meeting';
      b.message = 'QA Review session!';
    } else if (latest.type?.includes('completed') || latest.type === 'approval.approved') {
      b.state = 'success';
      b.targetPos = getHomeDeskByRole(role);
      b.message = 'Task selesai & disetujui! ✓';
    } else if (latest.type?.includes('failed')) {
      b.state = 'error';
      b.targetPos = getHomeDeskByRole(role);
      b.message = 'Ada bug/error! ✕';
    }

    next[role] = b;
    behaviorsRef.current = next;
    setBehaviors({ ...next });
  }, [events]);

  // Teleport/Focus Camera to Department
  const focusDept = (deptKey: string) => {
    setSelectedDept(deptKey);
    if (!controlsRef.current) return;

    const DEPT_CAMERAS: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
      executive:   { pos: [-16, 12, -7],  target: [-16, 0, -14] },
      product:     { pos: [-2, 12, -7],   target: [-2, 0, -14] },
      design:      { pos: [14, 12, -7],   target: [14, 0, -14] },
      engineering: { pos: [-10, 16, 3],   target: [-10, 0, -4] },
      growth:      { pos: [12, 14, 3],    target: [12, 0, -4] },
      sales:       { pos: [-14, 14, 14],  target: [-14, 0, 7] },
      customer:    { pos: [-2, 14, 14],   target: [-2, 0, 7] },
      data:        { pos: [11, 14, 14],   target: [11, 0, 7] },
      leisure:     { pos: [0, 14, 25],    target: [0, 0, 16] },
    };

    const cam = DEPT_CAMERAS[deptKey] ?? { pos: [0, 32, 28], target: [0, 0, 0] };
    controlsRef.current.target.set(...cam.target);
    controlsRef.current.object.position.set(...cam.pos);
    controlsRef.current.update();
  };

  // Leisure manual triggers
  const triggerActivity = (activity: BehaviorState, message: string) => {
    const next = { ...behaviorsRef.current };
    const candidates = AGENT_REGISTRY_30.filter((a) => next[a.role]?.state === 'idle');
    if (!candidates.length) return;

    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    next[chosen.role].state = 'walking';
    (next[chosen.role] as any)._nextState = activity;
    next[chosen.role].message = message;

    if (activity === 'playing_billiard') {
      next[chosen.role].targetPos = OFFICE_WAYPOINTS.BILLIARD_PLAYER_1;
    } else if (activity === 'playing_guitar') {
      next[chosen.role].targetPos = OFFICE_WAYPOINTS.MUSIC_GUITAR;
    } else if (activity === 'playing_piano') {
      next[chosen.role].targetPos = OFFICE_WAYPOINTS.MUSIC_PIANO;
    } else if (activity === 'playing_drums') {
      next[chosen.role].targetPos = OFFICE_WAYPOINTS.MUSIC_DRUMS;
    } else if (activity === 'gaming_ps5') {
      next[chosen.role].targetPos = OFFICE_WAYPOINTS.PS5_COUCH_CENTER;
    } else if (activity === 'coffee_break') {
      next[chosen.role].targetPos = OFFICE_WAYPOINTS.COFFEE_BAR;
    }

    behaviorsRef.current = next;
    setBehaviors({ ...next });
  };

  const workingCount = AGENT_REGISTRY_30.filter((a) =>
    ['working', 'typing', 'thinking'].includes(behaviors[a.role]?.state ?? '')
  ).length;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#c5baa9',
        position: 'relative',
        border: '1px solid var(--line)',
      }}
    >
      {/* HUD Top Bar: Department View Tabs */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          right: 10,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Dept Switcher Pills */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            borderRadius: 10,
            padding: '4px 8px',
            display: 'flex',
            gap: 4,
            overflowX: 'auto',
            border: '1px solid #d5cabb',
            pointerEvents: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          }}
        >
          <button
            onClick={() => { setSelectedDept(null); if (controlsRef.current) { controlsRef.current.target.set(0, 0, 0); controlsRef.current.object.position.set(0, 32, 28); controlsRef.current.update(); } }}
            className="chip"
            style={{ cursor: 'pointer', background: selectedDept === null ? '#1e293b' : '#fff', color: selectedDept === null ? '#fff' : '#475569' }}
          >
            🏢 Seluruh Kantor (30 Agen)
          </button>
          {Object.entries(DEPT_THEMES).map(([deptKey, theme]) => (
            <button
              key={deptKey}
              onClick={() => focusDept(deptKey)}
              className="chip"
              style={{
                cursor: 'pointer',
                background: selectedDept === deptKey ? theme.color : '#fff',
                color: selectedDept === deptKey ? '#fff' : '#475569',
                borderColor: selectedDept === deptKey ? theme.color : '#cbd5e1',
                fontSize: 10.5,
              }}
            >
              {theme.name}
            </button>
          ))}
          <button
            onClick={() => focusDept('leisure')}
            className="chip"
            style={{ cursor: 'pointer', background: selectedDept === 'leisure' ? '#b45309' : '#fff', color: selectedDept === 'leisure' ? '#fff' : '#b45309', fontWeight: 700 }}
          >
            🎱 Studio Musik & Billiard
          </button>
        </div>

        {/* Live Active Pill */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            borderRadius: 10,
            padding: '6px 12px',
            border: '1px solid #d5cabb',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            pointerEvents: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          }}
        >
          <div className="chip-dot live-dot" style={{ backgroundColor: 'var(--ok)' }} />
          <span style={{ fontWeight: 700, color: '#1e293b' }}>
            30 Karyawan Aktif
          </span>
          <span className="chip" style={{ fontSize: 10 }}>
            {workingCount} sibuk
          </span>
        </div>
      </div>

      {/* Leisure Quick Actions (Bottom Bar) */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(8px)',
          borderRadius: 10,
          padding: '6px 10px',
          border: '1px solid #d5cabb',
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        }}
      >
        <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 700 }}>Aktivitas Santai:</span>
        <button
          onClick={() => triggerActivity('playing_billiard', 'Main billiard 🎱')}
          className="chip"
          style={{ cursor: 'pointer', background: '#ffffff', color: '#15803d', fontWeight: 600 }}
          title="Kirim agent main billiard"
        >
          🎱 Main Billiard
        </button>
        <button
          onClick={() => triggerActivity('playing_guitar', 'Jaming gitar 🎸')}
          className="chip"
          style={{ cursor: 'pointer', background: '#ffffff', color: '#d9772f', fontWeight: 600 }}
          title="Kirim agent main gitar"
        >
          🎸 Jaming Gitar
        </button>
        <button
          onClick={() => triggerActivity('playing_piano', 'Main piano 🎹')}
          className="chip"
          style={{ cursor: 'pointer', background: '#ffffff', color: '#0f172a', fontWeight: 600 }}
          title="Kirim agent main piano"
        >
          🎹 Main Piano
        </button>
        <button
          onClick={() => triggerActivity('playing_drums', 'Gebuk drum 🥁')}
          className="chip"
          style={{ cursor: 'pointer', background: '#ffffff', color: '#b91c1c', fontWeight: 600 }}
          title="Kirim agent main drum"
        >
          🥁 Main Drum
        </button>
        <button
          onClick={() => triggerActivity('gaming_ps5', 'Main FIFA 🎮')}
          className="chip"
          style={{ cursor: 'pointer', background: '#ffffff', color: '#2563eb', fontWeight: 600 }}
          title="Kirim agent main PS5"
        >
          🎮 Main PS5
        </button>
        <button
          onClick={() => triggerActivity('coffee_break', 'Ngopi dulu ☕')}
          className="chip"
          style={{ cursor: 'pointer', background: '#ffffff', color: '#78350f', fontWeight: 600 }}
          title="Kirim agent ngopi"
        >
          ☕ Ngopi
        </button>
      </div>

      <Canvas camera={{ position: [0, 32, 28], fov: 50 }} shadows>
        <ambientLight intensity={1.1} color="#fffcf5" />
        <directionalLight
          position={[15, 30, 20]}
          intensity={1.5}
          color="#fff8eb"
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-14, 6, 16]} intensity={0.8} color="#fef08a" distance={15} />
        <pointLight position={[8, 6, 16]} intensity={0.8} color="#fde68a" distance={15} />
        <pointLight position={[17, 6, 15]} intensity={0.7} color="#60a5fa" distance={15} />

        <SimulationLoop behaviorsRef={behaviorsRef} setBehaviorsState={setBehaviors} />

        <OfficeEnvironment />

        {/* Render all 30 Agents */}
        {AGENT_REGISTRY_30.map((agent) => {
          const b = behaviors[agent.role];
          if (!b) return null;
          return (
            <AgentCharacter
              key={agent.role}
              role={agent.role}
              name={agent.name}
              title={agent.title}
              department={agent.dept}
              state={b.state}
              currentPos={b.currentPos}
              facingTarget={b.facingTarget}
              message={b.message}
            />
          );
        })}

        <OrbitControls
          ref={controlsRef}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={6}
          maxDistance={65}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
