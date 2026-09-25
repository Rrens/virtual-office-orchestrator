'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function AnimatedTVScreen() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const t = clock.getElapsedTime();
    const r = 0.1 + Math.abs(Math.sin(t * 0.7)) * 0.3;
    const g = 0.2 + Math.abs(Math.sin(t * 1.1 + 1)) * 0.4;
    const b = 0.6 + Math.abs(Math.sin(t * 0.5 + 2)) * 0.4;
    matRef.current.emissive.setRGB(r, g, b);
    matRef.current.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.2;
  });
  return (
    <mesh ref={meshRef} position={[0, 0, 0.05]}>
      <planeGeometry args={[1.44, 0.82]} />
      <meshStandardMaterial
        ref={matRef}
        color="#000011"
        emissive="#2255ff"
        emissiveIntensity={0.7}
        roughness={0.1}
      />
    </mesh>
  );
}

function CoffeeSteam() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = 0.15 + Math.sin(t * 2) * 0.05;
    ref.current.scale.setScalar(0.8 + Math.sin(t * 3) * 0.2);
    (ref.current.material as THREE.MeshStandardMaterial).opacity = 0.3 + Math.sin(t * 2.5) * 0.15;
  });
  return (
    <mesh ref={ref} position={[0, 0.15, 0]}>
      <sphereGeometry args={[0.06, 6, 6]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.3} roughness={1} />
    </mesh>
  );
}

export function OfficeEnvironment() {
  const mats = useMemo(() => ({
    floor: new THREE.MeshStandardMaterial({ color: '#c8ad86', roughness: 0.35, metalness: 0.05 }),
    floorDark: new THREE.MeshStandardMaterial({ color: '#b89a6a', roughness: 0.4 }),
    rug: new THREE.MeshStandardMaterial({ color: '#dfd5c6', roughness: 0.95 }),
    wall: new THREE.MeshStandardMaterial({ color: '#eae4da', roughness: 0.85 }),
    wainscot: new THREE.MeshStandardMaterial({ color: '#d5cabb', roughness: 0.65 }),
    ceiling: new THREE.MeshStandardMaterial({ color: '#f5f2ec', roughness: 1 }),
    deskWood: new THREE.MeshStandardMaterial({ color: '#8c6843', roughness: 0.4 }),
    deskLeg: new THREE.MeshStandardMaterial({ color: '#2b2a28', roughness: 0.3 }),
    chairSeat: new THREE.MeshStandardMaterial({ color: '#3a3834', roughness: 0.6 }),
    chairBase: new THREE.MeshStandardMaterial({ color: '#1a1917', roughness: 0.3, metalness: 0.5 }),
    monitor: new THREE.MeshStandardMaterial({ color: '#1a1917', roughness: 0.2 }),
    monitorScreen: new THREE.MeshStandardMaterial({ color: '#0a1628', emissive: '#1a3a6a', emissiveIntensity: 0.5 }),
    couch: new THREE.MeshStandardMaterial({ color: '#7a8f7b', roughness: 0.85 }),
    couchPillow: new THREE.MeshStandardMaterial({ color: '#9ab09c', roughness: 0.9 }),
    coffeeBarTop: new THREE.MeshStandardMaterial({ color: '#4a4037', roughness: 0.4 }),
    coffeeMachine: new THREE.MeshStandardMaterial({ color: '#2d2b28', roughness: 0.3, metalness: 0.4 }),
    mugWhite: new THREE.MeshStandardMaterial({ color: '#f8f8f8', roughness: 0.3 }),
    tvFrame: new THREE.MeshStandardMaterial({ color: '#1a1917', roughness: 0.3 }),
    ps5White: new THREE.MeshStandardMaterial({ color: '#e8e8ec', roughness: 0.3 }),
    ps5Dark: new THREE.MeshStandardMaterial({ color: '#0f0f1a', roughness: 0.3, metalness: 0.3 }),
    gamepad: new THREE.MeshStandardMaterial({ color: '#1a1a2e', roughness: 0.4 }),
    plantPot: new THREE.MeshStandardMaterial({ color: '#e2d8cc', roughness: 0.7 }),
    plantLeaf: new THREE.MeshStandardMaterial({ color: '#3b7a57', roughness: 0.65 }),
    whiteboard: new THREE.MeshStandardMaterial({ color: '#fcfcfc', roughness: 0.15 }),
    boardFrame: new THREE.MeshStandardMaterial({ color: '#8a857b', roughness: 0.3 }),
    windowFrame: new THREE.MeshStandardMaterial({ color: '#f0ece4', roughness: 0.2 }),
    windowGlass: new THREE.MeshStandardMaterial({ color: '#b8d4e8', opacity: 0.28, transparent: true }),
    serverRack: new THREE.MeshStandardMaterial({ color: '#1a1917', roughness: 0.4 }),
    serverLed: new THREE.MeshStandardMaterial({ color: '#00ff80', emissive: '#00ff80', emissiveIntensity: 0.8 }),
    clockRim: new THREE.MeshStandardMaterial({ color: '#8a857b', roughness: 0.3, metalness: 0.5 }),
    clockFace: new THREE.MeshStandardMaterial({ color: '#fefefe' }),
  }), []);

  return (
    <group>
      {/* Parquet Floor — alternating planks */}
      {Array.from({ length: 9 }).map((_, row) =>
        Array.from({ length: 7 }).map((_, col) => (
          <mesh
            key={`floor-${row}-${col}`}
            position={[-8 + row * 2, -0.05, -6 + col * 2]}
            receiveShadow
            material={(row + col) % 2 === 0 ? mats.floor : mats.floorDark}
          >
            <boxGeometry args={[2, 0.1, 2]} />
          </mesh>
        ))
      )}

      {/* Central Rug */}
      <mesh position={[0, 0.01, 0]} receiveShadow material={mats.rug}>
        <boxGeometry args={[12, 0.02, 8]} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 6, 0]} material={mats.ceiling}>
        <boxGeometry args={[18, 0.15, 14]} />
      </mesh>

      {/* Back Wall */}
      <mesh position={[0, 3, -7]} material={mats.wall}>
        <boxGeometry args={[18, 6, 0.2]} />
      </mesh>
      <mesh position={[0, 0.6, -6.9]} material={mats.wainscot}>
        <boxGeometry args={[18, 1.4, 0.12]} />
      </mesh>

      {/* Right Wall */}
      <mesh position={[9, 3, 0]} material={mats.wall}>
        <boxGeometry args={[0.2, 6, 14]} />
      </mesh>

      {/* Left Wall + Big Window */}
      <mesh position={[-9, 3, 0]} material={mats.wall}>
        <boxGeometry args={[0.2, 6, 14]} />
      </mesh>
      {/* Window panels */}
      {[-3, 0, 3].map((z) => (
        <group key={z} position={[-8.92, 3.5, z]}>
          <mesh material={mats.windowFrame}>
            <boxGeometry args={[0.08, 2.8, 1.8]} />
          </mesh>
          <mesh material={mats.windowGlass}>
            <boxGeometry args={[0.02, 2.6, 1.6]} />
          </mesh>
        </group>
      ))}

      {/* ====== DESKS AREA ====== */}
      {/* Desk helper: wood top + 4 metal legs + monitor + keyboard */}
      {[
        { pos: [-4, 0, -2] as [number, number, number], rot: 0 },
        { pos: [0, 0, -2] as [number, number, number], rot: 0 },
        { pos: [4, 0, -2] as [number, number, number], rot: 0 },
        { pos: [0, 0, 2] as [number, number, number], rot: Math.PI },
      ].map((desk, i) => (
        <group key={i} position={desk.pos} rotation={[0, desk.rot, 0]}>
          {/* Desk surface */}
          <mesh position={[0, 0.72, 0]} material={mats.deskWood} castShadow>
            <boxGeometry args={[1.4, 0.05, 0.7]} />
          </mesh>
          {/* Legs */}
          {[[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].map(([lx, lz], li) => (
            <mesh key={li} position={[lx, 0.35, lz]} material={mats.deskLeg}>
              <cylinderGeometry args={[0.025, 0.025, 0.7, 8]} />
            </mesh>
          ))}
          {/* Dual Monitors */}
          <group position={[-0.25, 1.05, -0.2]}>
            <mesh material={mats.monitor}>
              <boxGeometry args={[0.5, 0.32, 0.04]} />
            </mesh>
            <mesh position={[0, 0, 0.025]}>
              <planeGeometry args={[0.46, 0.28]} />
              <meshStandardMaterial color="#0a1628" emissive="#2255cc" emissiveIntensity={0.4} />
            </mesh>
            <mesh position={[0, -0.2, 0]} material={mats.deskLeg}>
              <cylinderGeometry args={[0.02, 0.03, 0.08, 8]} />
            </mesh>
          </group>
          <group position={[0.3, 1.05, -0.2]}>
            <mesh material={mats.monitor}>
              <boxGeometry args={[0.44, 0.28, 0.04]} />
            </mesh>
            <mesh position={[0, 0, 0.025]}>
              <planeGeometry args={[0.40, 0.24]} />
              <meshStandardMaterial color="#0a1628" emissive="#334455" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0, -0.17, 0]} material={mats.deskLeg}>
              <cylinderGeometry args={[0.02, 0.03, 0.08, 8]} />
            </mesh>
          </group>
          {/* Keyboard */}
          <mesh position={[0, 0.755, 0.1]} material={mats.monitor}>
            <boxGeometry args={[0.38, 0.01, 0.14]} />
          </mesh>
          {/* Mouse */}
          <mesh position={[0.35, 0.755, 0.1]} material={mats.deskLeg}>
            <boxGeometry args={[0.07, 0.015, 0.1]} />
          </mesh>
          {/* Chair */}
          <group position={[0, 0, 0.55]}>
            <mesh position={[0, 0.48, 0]} material={mats.chairSeat}>
              <boxGeometry args={[0.44, 0.06, 0.44]} />
            </mesh>
            <mesh position={[0, 0.85, -0.18]} material={mats.chairSeat}>
              <boxGeometry args={[0.42, 0.5, 0.06]} />
            </mesh>
            <mesh position={[0, 0.22, 0]} material={mats.chairBase}>
              <cylinderGeometry args={[0.05, 0.05, 0.44, 8]} />
            </mesh>
            {[0, 72, 144, 216, 288].map((deg, ci) => (
              <mesh
                key={ci}
                position={[
                  Math.sin((deg * Math.PI) / 180) * 0.22,
                  0.02,
                  Math.cos((deg * Math.PI) / 180) * 0.22,
                ]}
                material={mats.chairBase}
              >
                <boxGeometry args={[0.06, 0.04, 0.22]} />
              </mesh>
            ))}
          </group>
        </group>
      ))}

      {/* ====== LOUNGE / PS5 AREA ====== */}
      <group position={[-6, 0, 4]}>
        {/* Couch — 3 seat */}
        <mesh position={[0, 0.28, 0]} material={mats.couch}>
          <boxGeometry args={[2.6, 0.38, 0.95]} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.72, -0.38]} material={mats.couch}>
          <boxGeometry args={[2.6, 0.65, 0.22]} />
        </mesh>
        {/* Armrests */}
        <mesh position={[-1.22, 0.52, 0]} material={mats.couch}>
          <boxGeometry args={[0.22, 0.48, 0.95]} />
        </mesh>
        <mesh position={[1.22, 0.52, 0]} material={mats.couch}>
          <boxGeometry args={[0.22, 0.48, 0.95]} />
        </mesh>
        {/* Pillows */}
        <mesh position={[-0.7, 0.62, -0.27]} material={mats.couchPillow}>
          <boxGeometry args={[0.32, 0.28, 0.1]} />
        </mesh>
        <mesh position={[0.7, 0.62, -0.27]} material={mats.couchPillow}>
          <boxGeometry args={[0.32, 0.28, 0.1]} />
        </mesh>
        {/* Coffee Table */}
        <mesh position={[0, 0.22, 1.1]} material={mats.deskWood}>
          <boxGeometry args={[1.2, 0.06, 0.55]} />
        </mesh>
        {/* Controllers on coffee table */}
        <mesh position={[-0.2, 0.26, 1.1]} material={mats.gamepad}>
          <boxGeometry args={[0.14, 0.05, 0.09]} />
        </mesh>
        <mesh position={[0.15, 0.26, 1.1]} material={mats.gamepad}>
          <boxGeometry args={[0.14, 0.05, 0.09]} />
        </mesh>

        {/* TV Stand */}
        <mesh position={[0, 0.18, 2.2]} material={mats.deskLeg}>
          <boxGeometry args={[1.8, 0.36, 0.4]} />
        </mesh>
        {/* TV Frame */}
        <group position={[0, 1.25, 2.2]}>
          <mesh material={mats.tvFrame}>
            <boxGeometry args={[1.72, 0.98, 0.1]} />
          </mesh>
          <AnimatedTVScreen />
        </group>

        {/* PS5 Console on stand */}
        <group position={[0.55, 0.38, 2.1]}>
          <mesh material={mats.ps5White}>
            <boxGeometry args={[0.12, 0.28, 0.1]} />
          </mesh>
          <mesh position={[0, 0, 0.06]} material={mats.ps5Dark}>
            <boxGeometry args={[0.08, 0.22, 0.04]} />
          </mesh>
        </group>
      </group>

      {/* ====== COFFEE BAR ====== */}
      <group position={[6.5, 0, -5]}>
        {/* Counter */}
        <mesh position={[0, 0.48, 0]} material={mats.coffeeBarTop}>
          <boxGeometry args={[2.2, 0.96, 0.85]} />
        </mesh>
        {/* Counter top surface (lighter) */}
        <mesh position={[0, 0.96, 0]} material={mats.deskWood}>
          <boxGeometry args={[2.2, 0.04, 0.85]} />
        </mesh>
        {/* Espresso Machine */}
        <group position={[-0.55, 1.22, 0]}>
          <mesh material={mats.coffeeMachine}>
            <boxGeometry args={[0.42, 0.44, 0.38]} />
          </mesh>
          {/* Steam nozzle */}
          <mesh position={[0.2, -0.1, 0.1]}>
            <cylinderGeometry args={[0.015, 0.015, 0.18, 8]} />
            <meshStandardMaterial color="#8a857b" metalness={0.6} roughness={0.3} />
          </mesh>
          <CoffeeSteam />
          {/* Display panel glow */}
          <mesh position={[0, 0.08, 0.2]}>
            <planeGeometry args={[0.22, 0.1]} />
            <meshStandardMaterial color="#001122" emissive="#0088ff" emissiveIntensity={0.6} />
          </mesh>
        </group>
        {/* Mugs row */}
        {[-0.3, 0, 0.3, 0.6].map((x, mi) => (
          <group key={mi} position={[0.4 + x * 0.5, 1.02, 0.1]}>
            <mesh material={mats.mugWhite}>
              <cylinderGeometry args={[0.055, 0.048, 0.1, 10]} />
            </mesh>
          </group>
        ))}
        {/* Bar stools */}
        {[-0.6, 0.6].map((x, si) => (
          <group key={si} position={[x, 0, 0.8]}>
            <mesh position={[0, 0.56, 0]} material={mats.chairSeat}>
              <cylinderGeometry args={[0.2, 0.2, 0.06, 12]} />
            </mesh>
            <mesh position={[0, 0.28, 0]} material={mats.chairBase}>
              <cylinderGeometry args={[0.025, 0.025, 0.56, 8]} />
            </mesh>
            {[0, 90, 180, 270].map((deg, fi) => (
              <mesh
                key={fi}
                position={[
                  Math.sin((deg * Math.PI) / 180) * 0.2,
                  0.03,
                  Math.cos((deg * Math.PI) / 180) * 0.2,
                ]}
                material={mats.chairBase}
              >
                <boxGeometry args={[0.04, 0.04, 0.2]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* ====== KANBAN WHITEBOARD ====== */}
      <group position={[0, 3.5, -6.88]}>
        <mesh position={[0, 0, -0.015]} material={mats.boardFrame}>
          <boxGeometry args={[5.3, 2.5, 0.04]} />
        </mesh>
        <mesh material={mats.whiteboard}>
          <boxGeometry args={[5.1, 2.3, 0.05]} />
        </mesh>
        {/* Columns: Todo / In Progress / Done */}
        {[
          { x: -1.65, color: '#f5ede4' },
          { x: 0, color: '#eaf0fa' },
          { x: 1.65, color: '#eaf5ea' },
        ].map((col, ci) => (
          <mesh key={ci} position={[col.x, 0, 0.03]}>
            <planeGeometry args={[1.5, 2.1]} />
            <meshStandardMaterial color={col.color} />
          </mesh>
        ))}
        {/* Sticky note cards */}
        {[
          { x: -1.65, y: 0.5, c: '#fde68a' }, { x: -1.65, y: 0.1, c: '#fde68a' },
          { x: 0, y: 0.6, c: '#bfdbfe' }, { x: 0, y: 0.2, c: '#bfdbfe' }, { x: 0, y: -0.2, c: '#bfdbfe' },
          { x: 1.65, y: 0.5, c: '#bbf7d0' }, { x: 1.65, y: 0.1, c: '#bbf7d0' },
        ].map((s, si) => (
          <mesh key={si} position={[s.x, s.y, 0.04]}>
            <planeGeometry args={[0.55, 0.32]} />
            <meshStandardMaterial color={s.c} />
          </mesh>
        ))}
      </group>

      {/* ====== WALL CLOCK ====== */}
      <group position={[-4.5, 4.8, -6.88]}>
        <mesh material={mats.clockRim} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 0.05, 32]} />
        </mesh>
        <mesh position={[0, 0, 0.03]} material={mats.clockFace} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.02, 32]} />
        </mesh>
      </group>

      {/* ====== SERVER RACK ====== */}
      <group position={[7.8, 0, 0]}>
        <mesh position={[0, 1.1, 0]} material={mats.serverRack}>
          <boxGeometry args={[0.7, 2.2, 0.65]} />
        </mesh>
        {[0, 0.35, 0.7, 1.05, 1.4].map((y, ri) => (
          <mesh key={ri} position={[0.01, 0.15 + y, 0.33]} material={mats.serverLed}>
            <planeGeometry args={[0.5, 0.08]} />
          </mesh>
        ))}
      </group>

      {/* ====== PLANTS ====== */}
      {[
        { pos: [-8, 0, -5.5] as [number, number, number], r: 0.45 },
        { pos: [7.2, 0, 5.5] as [number, number, number], r: 0.38 },
        { pos: [-8, 0, 5] as [number, number, number], r: 0.35 },
      ].map((p, pi) => (
        <group key={pi} position={p.pos}>
          <mesh position={[0, 0.35, 0]} material={mats.plantPot}>
            <cylinderGeometry args={[p.r * 0.65, p.r * 0.5, 0.65, 14]} />
          </mesh>
          <mesh position={[0, 0.9, 0]} material={mats.plantLeaf}>
            <sphereGeometry args={[p.r, 12, 12]} />
          </mesh>
        </group>
      ))}

      {/* ====== CEILING LIGHTS ====== */}
      {[[-3, 5.9, -3], [3, 5.9, -3], [-3, 5.9, 3], [3, 5.9, 3], [0, 5.9, 0]].map((lp, li) => (
        <group key={li} position={lp as [number, number, number]}>
          <mesh>
            <boxGeometry args={[0.6, 0.04, 0.18]} />
            <meshStandardMaterial color="#f0ece4" emissive="#fff8f0" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
