'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useRef, useEffect, useState } from 'react';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { OfficeEnvironment } from './OfficeEnvironment';
import { AgentCharacter } from './AgentCharacter';
import {
  initBehaviors,
  tickBehaviors,
  applyWSEventToBehaviors,
  type AgentBehavior,
  type AgentId,
  type BehaviorState,
} from './AgentBehaviorController';
import { OFFICE_WAYPOINTS, getHomeDesk } from './AgentBehaviorController';
import type { WSEvent } from '../../../hooks/useProjectWebSocket';

interface Props {
  events: WSEvent[];
  onSelectAgent?: (role: string) => void;
}

const AGENT_NAMES: Record<AgentId, string> = {
  pingot: 'Pingot',
  zaki: 'Zaki',
  lulu: 'Lulu',
  risko: 'Risko',
};

const AGENT_ROLES: Record<AgentId, string> = {
  pingot: 'orchestrator',
  zaki: 'backend-engineer',
  lulu: 'ui-ux-designer',
  risko: 'qa-engineer',
};

function SimulationLoop({
  behaviorsRef,
  setBehaviorsState,
}: {
  behaviorsRef: React.MutableRefObject<Record<AgentId, AgentBehavior>>;
  setBehaviorsState: React.Dispatch<React.SetStateAction<Record<AgentId, AgentBehavior>>>;
}) {
  const tickAccum = useRef(0);

  useFrame((_, delta) => {
    // Tick at 30-60fps
    behaviorsRef.current = tickBehaviors(behaviorsRef.current, delta);

    tickAccum.current += delta;
    if (tickAccum.current > 0.05) {
      setBehaviorsState({ ...behaviorsRef.current });
      tickAccum.current = 0;
    }
  });

  return null;
}

function CinematicCamera({ active }: { active: boolean }) {
  useFrame(({ clock, camera }) => {
    if (!active) return;
    const t = clock.getElapsedTime() * 0.1;
    camera.position.x = Math.sin(t) * 16;
    camera.position.z = Math.cos(t) * 16;
    camera.position.y = 11 + Math.sin(t * 0.3) * 2;
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export function OfficeSceneCanvas({ events, onSelectAgent }: Props) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [cinematic, setCinematic] = useState(false);

  // Behavior state
  const behaviorsRef = useRef<Record<AgentId, AgentBehavior>>(initBehaviors());
  const [behaviors, setBehaviors] = useState<Record<AgentId, AgentBehavior>>(behaviorsRef.current);

  // Apply new incoming WS events
  useEffect(() => {
    if (!events.length) return;
    const latest = events[0];
    const role = String(latest.agentRole ?? latest.role ?? '');
    behaviorsRef.current = applyWSEventToBehaviors(
      behaviorsRef.current,
      latest.type ?? '',
      role
    );
    setBehaviors({ ...behaviorsRef.current });
  }, [events]);

  // Quick action triggers for user
  const triggerCoffeeBreak = (id: AgentId) => {
    const next = { ...behaviorsRef.current };
    next[id].state = 'walking';
    next[id].targetPos = OFFICE_WAYPOINTS.COFFEE_BAR;
    (next[id] as unknown as { _nextState: BehaviorState })._nextState = 'coffee_break';
    next[id].message = 'Ngopi bentar...';
    behaviorsRef.current = next;
    setBehaviors({ ...next });
  };

  const triggerPS5 = (id: AgentId) => {
    const next = { ...behaviorsRef.current };
    next[id].state = 'walking';
    next[id].targetPos = OFFICE_WAYPOINTS.PS5_COUCH_CENTER;
    (next[id] as unknown as { _nextState: BehaviorState })._nextState = 'gaming_ps5';
    next[id].message = 'Main FIFA dulu bro!';
    behaviorsRef.current = next;
    setBehaviors({ ...next });
  };

  const triggerBackToDesk = (id: AgentId) => {
    const next = { ...behaviorsRef.current };
    next[id].state = 'walking';
    next[id].targetPos = getHomeDesk(id);
    (next[id] as unknown as { _nextState: BehaviorState })._nextState = 'working';
    next[id].message = 'Fokus ngoding!';
    behaviorsRef.current = next;
    setBehaviors({ ...next });
  };

  const agentList: AgentId[] = ['pingot', 'zaki', 'lulu', 'risko'];
  const workingCount = agentList.filter((id) =>
    ['working', 'typing', 'thinking'].includes(behaviors[id]?.state ?? '')
  ).length;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#d6cfc4',
        position: 'relative',
        border: '1px solid var(--line)',
      }}
    >
      {/* HUD Top Bar */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 10,
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: '6px 12px',
          fontSize: 11,
          color: 'var(--muted)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            className="chip-dot live-dot"
            style={{ backgroundColor: workingCount > 0 ? 'var(--ok)' : 'var(--faint)' }}
          />
          <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 12 }}>Software House 3D</span>
        </div>
        <span className="chip">{workingCount}/4 working</span>
        <button
          onClick={() => setCinematic((v) => !v)}
          style={{
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 99,
            border: '1px solid var(--line-strong)',
            background: cinematic ? 'var(--text)' : 'transparent',
            color: cinematic ? '#fff' : 'var(--muted)',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {cinematic ? 'Cinematic ON' : 'Cinematic'}
        </button>
      </div>

      {/* Interactive Activity Shortcuts (Bottom Left of Canvas) */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          zIndex: 10,
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: '6px 10px',
          fontSize: 11,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>Aksi Cepat:</span>
        <button
          onClick={() => triggerCoffeeBreak('zaki')}
          className="chip"
          style={{ cursor: 'pointer', background: '#ffffff' }}
          title="Zaki pergi ngopi"
        >
          ☕ Zaki Ngopi
        </button>
        <button
          onClick={() => triggerPS5('lulu')}
          className="chip"
          style={{ cursor: 'pointer', background: '#ffffff' }}
          title="Lulu santai main PS5"
        >
          🎮 Lulu PS5
        </button>
        <button
          onClick={() => {
            agentList.forEach((id) => triggerBackToDesk(id));
          }}
          className="chip"
          style={{ cursor: 'pointer', background: '#ffffff', color: 'var(--ok)' }}
          title="Semua agen kembali kerja ke meja"
        >
          💻 Semua Kerja
        </button>
      </div>

      <Canvas camera={{ position: [0, 11, 13], fov: 48 }} shadows>
        <ambientLight intensity={0.95} color="#fff8f0" />
        <directionalLight
          position={[8, 14, 8]}
          intensity={1.3}
          color="#fff6e8"
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <pointLight position={[-6, 4, 4]} intensity={0.6} color="#fde68a" />
        <pointLight position={[6, 3, -5]} intensity={0.4} color="#fef08a" />

        <SimulationLoop behaviorsRef={behaviorsRef} setBehaviorsState={setBehaviors} />
        <CinematicCamera active={cinematic} />

        <OfficeEnvironment />

        {agentList.map((id) => {
          const b = behaviors[id];
          if (!b) return null;
          return (
            <AgentCharacter
              key={id}
              id={id}
              name={AGENT_NAMES[id]}
              state={b.state}
              currentPos={b.currentPos}
              facingTarget={b.facingTarget}
              message={b.message}
            />
          );
        })}

        {/* Clickable desk triggers to inspect agent */}
        {agentList.map((id) => {
          const home = getHomeDesk(id);
          return (
            <mesh
              key={`clickable-desk-${id}`}
              position={[home[0], 0.3, home[2] - 0.5]}
              onClick={() => onSelectAgent?.(AGENT_ROLES[id])}
              visible={false}
            >
              <boxGeometry args={[1.5, 0.8, 1.2]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          );
        })}

        {!cinematic && (
          <OrbitControls
            ref={controlsRef}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={4}
            maxDistance={24}
            target={[0, 0.5, 0]}
          />
        )}
      </Canvas>
    </div>
  );
}
