'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky } from '@react-three/drei';
import { useRef, useEffect, useState, useMemo } from 'react';
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
import { AGENT_REGISTRY_30, OFFICE_WAYPOINTS, FLOOR_HEIGHTS } from './OfficeWaypoints';
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
    const clampedDelta = Math.min(delta, 0.05);
    behaviorsRef.current = tickBehaviors30(behaviorsRef.current, clampedDelta);

    // Throttle React state re-renders to twice per second for max performance
    tickAccum.current += clampedDelta;
    if (tickAccum.current > 0.5) {
      setBehaviorsState({ ...behaviorsRef.current });
      tickAccum.current = 0;
    }
  });

  return null;
}

export function OfficeSceneCanvas({ events, onSelectAgent }: Props) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [activeFloor, setActiveFloor] = useState<number>(FLOOR_HEIGHTS.L2_STUDIO);
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

  // Floor Switch Camera presets
  const switchFloor = (floorHeight: number) => {
    setActiveFloor(floorHeight);
    setSelectedDept(null);
    if (!controlsRef.current) return;

    if (floorHeight === FLOOR_HEIGHTS.L1_GROUND) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.object.position.set(0, 20, 36);
    } else if (floorHeight === FLOOR_HEIGHTS.L2_STUDIO) {
      controlsRef.current.target.set(0, 9, 0);
      controlsRef.current.object.position.set(0, 24, 34);
    } else if (floorHeight === FLOOR_HEIGHTS.L3_PENTHOUSE) {
      controlsRef.current.target.set(0, 18, 0);
      controlsRef.current.object.position.set(0, 34, 30);
    } else {
      // Compact HQ Overview
      controlsRef.current.target.set(0, 9, 0);
      controlsRef.current.object.position.set(0, 42, 60);
    }
    controlsRef.current.update();
  };

  // Teleport/Focus Camera to Department
  const focusDept = (deptKey: string) => {
    setSelectedDept(deptKey);
    if (!controlsRef.current) return;

    const DEPT_CAMERAS: Record<string, { pos: [number, number, number]; target: [number, number, number]; floor: number }> = {
      executive:   { pos: [-8, 26, 8],     target: [-8, 18, -4],    floor: FLOOR_HEIGHTS.L3_PENTHOUSE },
      helipad:     { pos: [12, 26, 14],    target: [10, 18, 0],     floor: FLOOR_HEIGHTS.L3_PENTHOUSE },
      tech:        { pos: [-8, 18, 16],    target: [-8, 9, -6],     floor: FLOOR_HEIGHTS.L2_STUDIO },
      data:        { pos: [14, 18, 16],    target: [14, 9, -6],     floor: FLOOR_HEIGHTS.L2_STUDIO },
      design:      { pos: [6, 18, 24],     target: [6, 9, 8],       floor: FLOOR_HEIGHTS.L2_STUDIO },
      lobby:       { pos: [0, 10, 26],     target: [0, 0, 6],       floor: FLOOR_HEIGHTS.L1_GROUND },
      sales:       { pos: [-10, 10, 16],   target: [-10, 0, -2],    floor: FLOOR_HEIGHTS.L1_GROUND },
      pantry:      { pos: [12, 10, 16],    target: [12, 0, -2],     floor: FLOOR_HEIGHTS.L1_GROUND },
    };

    const cam = DEPT_CAMERAS[deptKey];
    if (cam) {
      setActiveFloor(cam.floor);
      controlsRef.current.target.set(...cam.target);
      controlsRef.current.object.position.set(...cam.pos);
      controlsRef.current.update();
    }
  };

  const activeEventRoles = useMemo(() => {
    return new Set(
      events
        .filter((e) => {
          const type = String(e.type ?? '');
          const status = String(e.newStatus ?? '');
          return (
            type.includes('started') ||
            status === 'working' ||
            status === 'RUNNING' ||
            status === 'ASSIGNED' ||
            status === 'REVIEW'
          );
        })
        .map((e) => e.agentRole ?? e.role)
        .filter(Boolean)
    );
  }, [events]);

  const workingCount = AGENT_REGISTRY_30.filter(
    (a) =>
      ['working', 'typing', 'thinking'].includes(behaviors[a.role]?.state ?? '') ||
      activeEventRoles.has(a.role)
  ).length;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        background: '#e0f2fe',
        position: 'relative',
        border: '1px solid var(--line)',
      }}
    >
      {/* HUD Top Bar: 9-Floor Pure Corporate Tower Navigation */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          right: 12,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Floor Switcher Scrollable Bar */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(16px)',
            borderRadius: 12,
            padding: '4px 8px',
            display: 'flex',
            gap: 4,
            border: '1px solid var(--line-strong)',
            boxShadow: 'var(--shadow-lg)',
            pointerEvents: 'auto',
            overflowX: 'auto',
            maxWidth: '75%',
          }}
        >
          {[
            { floor: FLOOR_HEIGHTS.L1_GROUND, label: '🏢 GF: Grand Lobby & Cafe' },
            { floor: FLOOR_HEIGHTS.L2_STUDIO, label: '💻 L1: Mega Tech & Design Studio' },
            { floor: FLOOR_HEIGHTS.L3_PENTHOUSE, label: '👑 L2: Penthouse CEO & Helipad 🚁' },
            { floor: -1, label: '🌐 Full HQ Overview' },
          ].map((f) => (
            <button
              key={f.floor}
              onClick={() => switchFloor(f.floor)}
              style={{
                padding: '5px 12px',
                borderRadius: 8,
                border: 'none',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                background: activeFloor === f.floor ? 'linear-gradient(135deg, var(--pingot), #3b82f6)' : 'transparent',
                color: activeFloor === f.floor ? '#ffffff' : 'var(--muted)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Live Active Agents Pill */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(16px)',
            borderRadius: 12,
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid var(--line-strong)',
            boxShadow: 'var(--shadow)',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: workingCount > 0 ? 'var(--ok)' : 'var(--faint)',
            }}
            className={workingCount > 0 ? 'live-dot' : ''}
          />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>
            {workingCount}/30 Agent Aktif
          </span>
        </div>
      </div>

      {/* HUD Bottom Bar: Department Quick Jump & Feature Teleports */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          right: 12,
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Dept Quick Focus */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(16px)',
            borderRadius: 12,
            padding: '4px 8px',
            display: 'flex',
            gap: 4,
            border: '1px solid var(--line-strong)',
            pointerEvents: 'auto',
            overflowX: 'auto',
          }}
        >
          {[
            { key: 'executive', label: '👑 CEO Rendy' },
            { key: 'tech', label: '💻 Tech Lab' },
            { key: 'data', label: '🚀 Data Center' },
            { key: 'design', label: '🎨 Design Studio' },
            { key: 'sales', label: '💼 Sales & CS' },
            { key: 'pantry', label: '☕ Cafe Pantry' },
            { key: 'lobby', label: '🏢 Grand Lobby' },
            { key: 'helipad', label: '🚁 Helipad' },
          ].map((d) => (
            <button
              key={d.key}
              onClick={() => focusDept(d.key)}
              style={{
                padding: '5px 10px',
                borderRadius: 7,
                border: 'none',
                fontSize: 10.5,
                fontWeight: 600,
                cursor: 'pointer',
                background: selectedDept === d.key ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                color: selectedDept === d.key ? '#38bdf8' : 'var(--muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Daylight Canvas Scene */}
      <Canvas
        shadows
        camera={{ position: [0, 42, 60], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      >
        <color attach="background" args={['#87ceeb']} />
        <Sky
          distance={450000}
          sunPosition={[100, 70, 70]}
          inclination={0}
          azimuth={0.25}
          mieCoefficient={0.005}
          rayleigh={0.5}
          turbidity={3}
        />

        <ambientLight intensity={0.9} color="#f8fafc" />
        <directionalLight
          position={[40, 60, 30]}
          intensity={1.2}
          color="#fffbeb"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-35}
          shadow-camera-right={35}
          shadow-camera-top={35}
          shadow-camera-bottom={-35}
        />
        <pointLight position={[0, 9, 0]} intensity={0.6} color="#38bdf8" distance={35} />
        <pointLight position={[0, 18, 0]} intensity={0.8} color="#facc15" distance={30} />

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI / 2 - 0.01}
          minDistance={4}
          maxDistance={140}
        />

        <SimulationLoop behaviorsRef={behaviorsRef} setBehaviorsState={setBehaviors} />
        <OfficeEnvironment />

        {/* Render 30 Agents */}
        {AGENT_REGISTRY_30.map((agent) => {
          const b = behaviors[agent.role];
          return (
            <AgentCharacter
              key={agent.role}
              role={agent.role}
              name={agent.name}
              title={agent.title}
              department={agent.dept}
              state={b?.state ?? 'idle'}
              currentPos={b?.currentPos ?? agent.pos}
              facingTarget={b?.targetPos}
              message={b?.message}
            />
          );
        })}
      </Canvas>
    </div>
  );
}
