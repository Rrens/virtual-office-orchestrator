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
  forceAgentBehavior,
  type AgentBehavior,
  type BehaviorState,
  getHomeDeskByRole,
} from './AgentBehaviorController';
import { AGENT_REGISTRY_30, OFFICE_WAYPOINTS, FLOOR_HEIGHTS } from './OfficeWaypoints';
import type { WSEvent } from '../../../hooks/useProjectWebSocket';
import { useVirtualTime } from '../../../hooks/useVirtualTime';
import { AgentSpectatorModal } from '../AgentSpectatorModal';

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
  const [commandModalAgent, setCommandModalAgent] = useState<{ role: string; name: string; instanceId?: string } | null>(null);
  const [spectatorAgent, setSpectatorAgent] = useState<{ instanceId: string; role: string; name: string } | null>(null);

  const virtualTime = useVirtualTime();

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
      b.message = latest.message || 'Sedang ngerjain task...';
    } else if (latest.type?.includes('thinking')) {
      b.state = 'thinking';
      b.targetPos = getHomeDeskByRole(role);
      b.message = latest.message || 'Mikir solusi...';
    } else if (latest.type?.includes('review') || latest.type === 'approval.requested') {
      b.state = 'walking';
      b.targetPos = OFFICE_WAYPOINTS.MEETING_ROUND_1;
      (b as any)._nextState = 'meeting';
      b.message = role === 'qa-engineer' ? 'QA Review session 🔍' : 'Menuju Meeting Room (QA Review) 📋';
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

        {/* Live Active Agents & Virtual Clock Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(16px)',
              borderRadius: 12,
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid var(--line-strong)',
              boxShadow: 'var(--shadow)',
              pointerEvents: 'auto',
            }}
          >
            <span style={{ fontSize: 13 }}>
              {virtualTime.phase === 'dawn' ? '🌅' : virtualTime.phase === 'day' ? '☀️' : virtualTime.phase === 'dusk' ? '🌇' : virtualTime.phase === 'night' ? '🌙' : '🌌'}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: '#f8fafc', fontFamily: 'monospace' }}>
              {virtualTime.formatted}
            </span>
            <span style={{ fontSize: 9.5, color: 'var(--muted)', textTransform: 'capitalize' }}>
              ({virtualTime.phase})
            </span>
          </div>

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
        <color attach="background" args={[virtualTime.skyColor]} />
        <Sky
          distance={450000}
          sunPosition={virtualTime.sunPosition}
          inclination={0}
          azimuth={0.25}
          mieCoefficient={0.005}
          rayleigh={virtualTime.phase === 'night' || virtualTime.phase === 'midnight' ? 0.1 : 0.5}
          turbidity={virtualTime.phase === 'dusk' || virtualTime.phase === 'dawn' ? 8 : 3}
        />

        <ambientLight intensity={virtualTime.ambientIntensity} color="#f8fafc" />
        <directionalLight
          position={virtualTime.sunPosition}
          intensity={virtualTime.phase === 'night' || virtualTime.phase === 'midnight' ? 0.65 : 1.2}
          color={virtualTime.phase === 'night' || virtualTime.phase === 'midnight' ? '#93c5fd' : virtualTime.phase === 'dusk' || virtualTime.phase === 'dawn' ? '#ff8a65' : '#fffbeb'}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-35}
          shadow-camera-right={35}
          shadow-camera-top={35}
          shadow-camera-bottom={-35}
        />
        <pointLight position={[0, 9, 0]} intensity={virtualTime.officeLightsOn ? 3.2 : 0.6} color="#38bdf8" distance={45} />
        <pointLight position={[0, 18, 0]} intensity={virtualTime.officeLightsOn ? 4.0 : 0.8} color="#facc15" distance={40} />
        {virtualTime.officeLightsOn && (
          <>
            <pointLight position={[-15, 9, 10]} intensity={2.4} color="#fffbeb" distance={25} />
            <pointLight position={[15, 9, 10]} intensity={2.4} color="#fffbeb" distance={25} />
            <pointLight position={[-15, 9, -10]} intensity={2.0} color="#fffbeb" distance={25} />
            <pointLight position={[15, 9, -10]} intensity={2.0} color="#fffbeb" distance={25} />
            <pointLight position={[-10, 18, 0]} intensity={2.2} color="#fffbeb" distance={22} />
            <pointLight position={[10, 18, 0]} intensity={2.2} color="#fffbeb" distance={22} />
            <pointLight position={[0, 2, 0]} intensity={2.0} color="#fffbeb" distance={35} />
          </>
        )}

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI / 2 - 0.01}
          minDistance={4}
          maxDistance={140}
        />

        <SimulationLoop behaviorsRef={behaviorsRef} setBehaviorsState={setBehaviors} />
        <OfficeEnvironment
          virtualHours={virtualTime.hours}
          virtualMinutes={virtualTime.minutes}
          officeLightsOn={virtualTime.officeLightsOn}
        />

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
              onClick={(role) => {
                const reg = AGENT_REGISTRY_30.find((a) => a.role === role);
                if (reg) setCommandModalAgent({ role, name: reg.name, instanceId: role });
              }}
            />
          );
        })}
      </Canvas>

      {/* Agent Command Modal */}
      {commandModalAgent && (() => {
        const reg = AGENT_REGISTRY_30.find((a) => a.role === commandModalAgent.role);
        const b = behaviors[commandModalAgent.role];
        const activityLog: string[] = [];
        if (b?.message) activityLog.push(b.message);

        const commands: { label: string; icon: string; state: BehaviorState; msg: string }[] = [
          { label: 'Ke Meja Kerja', icon: '💻', state: 'working', msg: 'Kembali ke Meja Kerja 💻' },
          { label: 'Billiard', icon: '🎱', state: 'playing_billiard', msg: 'Billiard dulu ah 🎱' },
          { label: 'Pantry / Kopi', icon: '☕', state: 'coffee_break', msg: 'Ngopi dulu... ☕' },
          { label: 'PS5 Lounge', icon: '🎮', state: 'gaming_ps5', msg: 'Main PS5 sebentar 🎮' },
          { label: 'Jalan-Jalan', icon: '🚶', state: 'pacing', msg: 'Jalan-jalan mikir 🚶' },
          { label: 'Ngobrol', icon: '💬', state: 'chatting', msg: 'Ngobrol sama teman 💬' },
          { label: 'Meeting Room', icon: '📋', state: 'meeting', msg: 'Menuju Meeting Room 📋' },
        ];

        return (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={() => setCommandModalAgent(null)}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,0.97), rgba(30,41,59,0.97))',
                border: '1px solid rgba(99,102,241,0.5)',
                borderRadius: 18,
                width: 360,
                padding: 20,
                boxShadow: '0 0 40px rgba(99,102,241,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: '#fff', fontWeight: 800,
                  }}>
                    {commandModalAgent.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>{commandModalAgent.name}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{commandModalAgent.role}</div>
                  </div>
                </div>
                <button
                  onClick={() => setCommandModalAgent(null)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}
                >✕</button>
              </div>

              {/* Activity Log */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 10,
                padding: '8px 12px',
                marginBottom: 14,
                border: '1px solid rgba(255,255,255,0.06)',
                minHeight: 36,
              }}>
                <div style={{ fontSize: 9, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                  Status Aktivitas
                </div>
                <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>
                  {b?.state === 'working' ? '⚡ Mengerjakan task...' :
                   b?.state === 'typing' ? '⌨️ Mengetik kode...' :
                   b?.state === 'thinking' ? '🤔 Berpikir...' :
                   b?.state === 'reviewing' ? '🔍 Review...' :
                   b?.message || '🟢 Idle — siap diperintah'}
                </div>
              </div>

              {/* Command Buttons */}
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Perintahkan Agent
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {commands.map((cmd) => (
                  <button
                    key={cmd.state}
                    onClick={() => {
                      behaviorsRef.current = forceAgentBehavior(behaviorsRef.current, commandModalAgent.role, cmd.state, cmd.msg);
                      setBehaviors({ ...behaviorsRef.current });
                      setCommandModalAgent(null);
                    }}
                    style={{
                      padding: '9px 10px',
                      borderRadius: 10,
                      border: '1px solid rgba(99,102,241,0.35)',
                      background: 'rgba(99,102,241,0.12)',
                      color: '#e0e7ff',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{cmd.icon}</span>
                    <span>{cmd.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setSpectatorAgent({
                    instanceId: commandModalAgent.instanceId ?? commandModalAgent.role,
                    role: commandModalAgent.role,
                    name: commandModalAgent.name,
                  });
                  setCommandModalAgent(null);
                }}
                style={{
                  width: '100%',
                  marginTop: 10,
                  padding: '9px',
                  borderRadius: 10,
                  border: '1px solid rgba(56,189,248,0.5)',
                  background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(99,102,241,0.15))',
                  color: '#7dd3fc',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span>👁</span>
                <span>Live Spectate Agent</span>
              </button>

              <button
                onClick={() => setCommandModalAgent(null)}
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '8px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'transparent',
                  color: '#64748b',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        );
      })()}

      {/* Agent Spectator Modal */}
      {spectatorAgent && (
        <AgentSpectatorModal
          agentInstanceId={spectatorAgent.instanceId}
          agentRole={spectatorAgent.role}
          agentName={spectatorAgent.name}
          allEvents={events}
          onClose={() => setSpectatorAgent(null)}
        />
      )}
    </div>
  );
}
