'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { FLOOR_HEIGHTS, AGENT_REGISTRY_30 } from './OfficeWaypoints';
import { ExecutiveHelicopter } from './ExecutiveHelicopter';
import { globalElevatorState } from './AgentBehaviorController';

export function OfficeEnvironment() {
  const cabinRef = useRef<THREE.Group>(null);
  const leftDoorRef = useRef<THREE.Mesh>(null);
  const rightDoorRef = useRef<THREE.Mesh>(null);

  // Update animated elevator cabin and sliding glass doors every frame
  useFrame(() => {
    if (cabinRef.current) {
      cabinRef.current.position.y = globalElevatorState.currentY;
    }
    const doorOffset = globalElevatorState.doorOpenProgress * 0.65;
    if (leftDoorRef.current) {
      leftDoorRef.current.position.x = -0.42 - doorOffset;
    }
    if (rightDoorRef.current) {
      rightDoorRef.current.position.x = 0.42 + doorOffset;
    }
  });

  const mats = useMemo(() => ({
    // Architectural Floors
    floorWoodParquet: new THREE.MeshStandardMaterial({
      color: '#b9743c', // Warm rich Scandinavian oak parquet
      roughness: 0.28,
      metalness: 0.05,
    }),
    floorConcreteGround: new THREE.MeshStandardMaterial({
      color: '#475569', // Polished grey concrete / terrazzo
      roughness: 0.22,
      metalness: 0.12,
    }),
    floorMarbleReception: new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.12,
      metalness: 0.1,
    }),
    floorHelipadConcrete: new THREE.MeshStandardMaterial({
      color: '#334155',
      roughness: 0.85,
      metalness: 0.1,
    }),
    floorGrass: new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.85 }),
    floorPaving: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.75 }),

    // Steel Framing & Girders
    beamSteelBlack: new THREE.MeshStandardMaterial({
      color: '#090d16',
      roughness: 0.25,
      metalness: 0.88,
    }),
    spandrelFascia: new THREE.MeshStandardMaterial({
      color: '#111827',
      roughness: 0.3,
      metalness: 0.8,
    }),
    trimGold: new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.9, roughness: 0.15 }),

    // Glass & Railings
    glassCurtainWall: new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      opacity: 0.18,
      transparent: true,
      roughness: 0.05,
      metalness: 0.6,
    }),
    glassElevator: new THREE.MeshStandardMaterial({
      color: '#e0f2fe',
      opacity: 0.24,
      transparent: true,
      roughness: 0.05,
      metalness: 0.4,
    }),
    glassDoorClear: new THREE.MeshStandardMaterial({
      color: '#f0f9ff',
      opacity: 0.55,
      transparent: true,
      roughness: 0.02,
      metalness: 0.25,
    }),
    railingGlass: new THREE.MeshStandardMaterial({
      color: '#bae6fd',
      opacity: 0.32,
      transparent: true,
      roughness: 0.05,
      metalness: 0.3,
    }),
    handrailBlack: new THREE.MeshStandardMaterial({ color: '#090d16', metalness: 0.9, roughness: 0.2 }),
    handrailChrome: new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.95, roughness: 0.08 }),

    // Ceilings & Lighting
    ceilingSand: new THREE.MeshStandardMaterial({ color: '#e5dec9', roughness: 0.8 }),
    pendantWire: new THREE.MeshStandardMaterial({ color: '#090d16', metalness: 0.8 }),
    pendantFixture: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3, metalness: 0.85 }),
    lightWarmLED: new THREE.MeshStandardMaterial({ color: '#fffbeb', emissive: '#fffbeb', emissiveIntensity: 1.4 }),
    lightCyanNeon: new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 1.2 }),

    // Walls & Office Interior Details
    whiteboardBg: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.08 }),
    whiteboardFrame: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.3, metalness: 0.5 }),
    corkBoardMat: new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.9 }),
    woodOakTrim: new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.4 }),
    carpetCircular: new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.9 }),

    // Workstation Materials
    deskWoodLight: new THREE.MeshStandardMaterial({
      color: '#e8d4b8',
      roughness: 0.32,
      metalness: 0.04,
    }),
    deskLegWhite: new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.2,
      metalness: 0.3,
    }),
    chairMeshBlack: new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.55,
      metalness: 0.1,
    }),
    chairBaseChrome: new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.25,
      metalness: 0.85,
    }),
    monitorBezelDark: new THREE.MeshStandardMaterial({
      color: '#090d16',
      roughness: 0.2,
      metalness: 0.8,
    }),
    monitorClockScreen: new THREE.MeshStandardMaterial({
      color: '#34d399',
      emissive: '#10b981',
      emissiveIntensity: 0.6,
    }),
    monitorCodeScreen: new THREE.MeshStandardMaterial({
      color: '#0f172a',
      emissive: '#064e3b',
      emissiveIntensity: 0.4,
    }),
    keyboardWhite: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.2 }),
    mouseWhite: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.15 }),
    paperWhite: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }),
    greenCan: new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.3, metalness: 0.6 }),
    tealMug: new THREE.MeshStandardMaterial({ color: '#10b981', roughness: 0.25 }),

    // Lounge, Cafe & Leisure
    sofaTeal: new THREE.MeshStandardMaterial({ color: '#0f766e', roughness: 0.6 }),
    sofaNavy: new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.6 }),
    chairBeige: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.4 }),
    chairLeatherChesterfield: new THREE.MeshStandardMaterial({ color: '#1e1b4b', roughness: 0.35 }),
    waterCoolerBody: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 }),
    waterBottleBlue: new THREE.MeshStandardMaterial({ color: '#38bdf8', opacity: 0.7, transparent: true, roughness: 0.1 }),
    tvScreen: new THREE.MeshStandardMaterial({ color: '#0284c7', emissive: '#0284c7', emissiveIntensity: 0.6 }),
    tvBezel: new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.2, metalness: 0.8 }),
    mediaConsoleWood: new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.35 }),

    // Billiards & PS5
    billiardFeltGreen: new THREE.MeshStandardMaterial({ color: '#047857', roughness: 0.7 }),
    billiardWoodMahogany: new THREE.MeshStandardMaterial({ color: '#3b1d11', roughness: 0.25 }),
    ps5ConsoleWhite: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 }),
    ps5LedBlue: new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 2.0 }),

    // Plants & Terracotta
    potTerracotta: new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.7 }),
    potSoil: new THREE.MeshStandardMaterial({ color: '#27170a', roughness: 0.9 }),
    plantGreen: new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.5 }),
    plantFiddleLeaf: new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.45 }),

    // Books & Accessories
    bookBlue: new THREE.MeshStandardMaterial({ color: '#2563eb' }),
    bookRed: new THREE.MeshStandardMaterial({ color: '#dc2626' }),
    bookGreen: new THREE.MeshStandardMaterial({ color: '#16a34a' }),
    bookYellow: new THREE.MeshStandardMaterial({ color: '#eab308' }),
    bookPurple: new THREE.MeshStandardMaterial({ color: '#9333ea' }),
    woodOak: new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.35 }),
    woodBirch: new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.4 }),
    woodDarkWalnut: new THREE.MeshStandardMaterial({ color: '#3b1d11', roughness: 0.2 }),

    // Server Racks & Helipad
    serverRack: new THREE.MeshStandardMaterial({ color: '#020617', roughness: 0.25, metalness: 0.8 }),
    serverLedCyan: new THREE.MeshStandardMaterial({ color: '#06b6d4', emissive: '#06b6d4', emissiveIntensity: 2.0 }),
    serverLedGreen: new THREE.MeshStandardMaterial({ color: '#10b981', emissive: '#10b981', emissiveIntensity: 2.0 }),
    helipadYellow: new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#eab308', emissiveIntensity: 0.5 }),
    beaconLight: new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 2.0 }),

    // Exterior Trees
    treeTrunk: new THREE.MeshStandardMaterial({ color: '#713f12', roughness: 0.8 }),
    treeLeaves: new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.6 }),
  }), []);

  /* -------------------------------------------------------------------------- */
  /* Helper Subcomponents                                                       */
  /* -------------------------------------------------------------------------- */
  const Bookshelf = ({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) => (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1.5, 0]} material={mats.woodOak} castShadow>
        <boxGeometry args={[1.6, 3.0, 0.55]} />
      </mesh>
      {[-0.8, -0.2, 0.4, 1.0].map((sy, i) => (
        <group key={`shelf-${i}`} position={[0, 1.5 + sy, 0.05]}>
          <mesh material={mats.woodBirch}>
            <boxGeometry args={[1.45, 0.04, 0.5]} />
          </mesh>
          {[-0.55, -0.35, -0.15, 0.05, 0.25, 0.45].map((bx, bi) => (
            <mesh
              key={`b-${bi}`}
              position={[bx, 0.22, 0]}
              material={
                bi % 5 === 0 ? mats.bookBlue :
                bi % 5 === 1 ? mats.bookRed :
                bi % 5 === 2 ? mats.bookGreen :
                bi % 5 === 3 ? mats.bookYellow : mats.bookPurple
              }
            >
              <boxGeometry args={[0.14, 0.38, 0.36]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );

  const PottedFiddleLeafPlant = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} material={mats.potTerracotta} castShadow>
        <cylinderGeometry args={[0.42, 0.3, 0.8, 16]} />
      </mesh>
      <mesh position={[0, 0.78, 0]} material={mats.potSoil}>
        <cylinderGeometry args={[0.4, 0.4, 0.04, 16]} />
      </mesh>
      <mesh position={[0, 1.3, 0]} material={mats.treeTrunk}>
        <cylinderGeometry args={[0.04, 0.05, 1.2, 8]} />
      </mesh>
      {[-0.2, 0.2].map((lx, i) => (
        <mesh key={`leaf-${i}`} position={[lx, 1.5 + i * 0.3, 0]} rotation={[0, 0, (i === 0 ? -1 : 1) * 0.4]} material={mats.plantFiddleLeaf}>
          <sphereGeometry args={[0.38, 8, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 2.0, 0]} material={mats.plantFiddleLeaf}>
        <sphereGeometry args={[0.48, 10, 10]} />
      </mesh>
    </group>
  );

  const WaterCoolerDispenser = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
      <mesh position={[0, 0.65, 0]} material={mats.waterCoolerBody} castShadow>
        <boxGeometry args={[0.45, 1.3, 0.45]} />
      </mesh>
      <mesh position={[0, 1.55, 0]} material={mats.waterBottleBlue}>
        <cylinderGeometry args={[0.18, 0.18, 0.55, 16]} />
      </mesh>
      <mesh position={[0, 0.95, 0.24]} material={mats.handrailChrome}>
        <boxGeometry args={[0.16, 0.06, 0.06]} />
      </mesh>
    </group>
  );

  const SuspendedPendantLight = ({ position, width = 3.6 }: { position: [number, number, number]; width?: number }) => (
    <group position={position}>
      {[-width / 2 + 0.3, width / 2 - 0.3].map((wx, i) => (
        <mesh key={`wire-${i}`} position={[wx, 1.0, 0]} material={mats.pendantWire}>
          <cylinderGeometry args={[0.008, 0.008, 2.0, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 0, 0]} material={mats.pendantFixture} castShadow>
        <boxGeometry args={[width, 0.08, 0.12]} />
      </mesh>
      <mesh position={[0, -0.045, 0]} material={mats.lightWarmLED}>
        <boxGeometry args={[width - 0.1, 0.015, 0.08]} />
      </mesh>
      <pointLight position={[0, -0.2, 0]} intensity={0.8} color="#fffbeb" distance={8} />
    </group>
  );

  const ScandinavianWorkstation = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
      <mesh position={[0, 0.72, 0]} material={mats.deskWoodLight} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.04, 1.0]} />
      </mesh>
      {[-0.98, 0.98].map((lx) =>
        [-0.42, 0.42].map((lz) => (
          <group key={`leg-${lx}-${lz}`} position={[lx, 0.35, lz]}>
            <mesh material={mats.deskLegWhite} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.7, 12]} />
            </mesh>
            <mesh position={[0, -0.34, 0]} material={mats.chairBaseChrome}>
              <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
            </mesh>
          </group>
        ))
      )}
      <group position={[-0.45, 0.74, -0.22]}>
        <mesh position={[0, 0.01, 0]} material={mats.monitorBezelDark}>
          <boxGeometry args={[0.26, 0.015, 0.18]} />
        </mesh>
        <mesh position={[0, 0.16, -0.06]} material={mats.monitorBezelDark}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        </mesh>
        <mesh position={[0, 0.35, -0.02]} material={mats.monitorBezelDark}>
          <boxGeometry args={[0.88, 0.52, 0.03]} />
        </mesh>
        <mesh position={[0, 0.35, 0.0]} material={mats.monitorClockScreen}>
          <planeGeometry args={[0.84, 0.48]} />
        </mesh>
        <Text position={[0, 0.38, 0.01]} fontSize={0.095} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
          11:39
        </Text>
        <Text position={[0, 0.28, 0.01]} fontSize={0.04} color="#f0fdf4" anchorX="center" anchorY="middle">
          MON 28 SEP
        </Text>
      </group>
      <group position={[0.48, 0.74, -0.18]} rotation={[0, -0.15, 0]}>
        <mesh position={[0, 0.01, 0]} material={mats.monitorBezelDark}>
          <boxGeometry args={[0.26, 0.015, 0.18]} />
        </mesh>
        <mesh position={[0, 0.16, -0.06]} material={mats.monitorBezelDark}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        </mesh>
        <mesh position={[0, 0.35, -0.02]} material={mats.monitorBezelDark}>
          <boxGeometry args={[0.84, 0.52, 0.03]} />
        </mesh>
        <mesh position={[0, 0.35, 0.0]} material={mats.monitorCodeScreen}>
          <planeGeometry args={[0.8, 0.48]} />
        </mesh>
        <Text position={[-0.34, 0.52, 0.01]} fontSize={0.035} color="#38bdf8" anchorX="left" anchorY="top">
          {'> main.ts\nimport express\nconst app = express()\napp.listen(3000)'}
        </Text>
      </group>
      <mesh position={[0, 0.745, 0.12]} material={mats.keyboardWhite} receiveShadow>
        <boxGeometry args={[0.46, 0.012, 0.14]} />
      </mesh>
      <mesh position={[0.34, 0.745, 0.13]} material={mats.mouseWhite}>
        <boxGeometry args={[0.07, 0.015, 0.11]} />
      </mesh>
      <mesh position={[-0.32, 0.742, 0.15]} rotation={[0, 0.06, 0]} material={mats.paperWhite}>
        <boxGeometry args={[0.28, 0.003, 0.22]} />
      </mesh>
      <mesh position={[-0.8, 0.79, 0.08]} material={mats.greenCan}>
        <cylinderGeometry args={[0.035, 0.035, 0.1, 12]} />
      </mesh>
      <mesh position={[0.75, 0.785, 0.08]} material={mats.tealMug}>
        <cylinderGeometry args={[0.04, 0.04, 0.085, 12]} />
      </mesh>
      <group position={[0, 0, 0.55]}>
        <mesh position={[0, 0.24, 0]} material={mats.handrailChrome}>
          <cylinderGeometry args={[0.035, 0.035, 0.36, 12]} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => {
          const rad = (i * 2 * Math.PI) / 5;
          return (
            <group key={`spoke-${i}`} rotation={[0, rad, 0]}>
              <mesh position={[0, 0.06, 0.16]} rotation={[0.15, 0, 0]} material={mats.chairBaseChrome}>
                <boxGeometry args={[0.035, 0.025, 0.32]} />
              </mesh>
              <mesh position={[0, 0.03, 0.32]} material={mats.chairBaseChrome}>
                <sphereGeometry args={[0.03, 8, 8]} />
              </mesh>
            </group>
          );
        })}
        <mesh position={[0, 0.44, 0]} material={mats.chairMeshBlack} castShadow>
          <boxGeometry args={[0.5, 0.07, 0.48]} />
        </mesh>
        <mesh position={[0, 0.74, 0.22]} rotation={[-0.08, 0, 0]} material={mats.chairMeshBlack} castShadow>
          <boxGeometry args={[0.44, 0.54, 0.05]} />
        </mesh>
        <group position={[-0.26, 0.56, 0.04]}>
          <mesh material={mats.chairMeshBlack}><boxGeometry args={[0.05, 0.03, 0.26]} /></mesh>
          <mesh position={[0, -0.1, -0.05]} material={mats.chairBaseChrome}><cylinderGeometry args={[0.015, 0.015, 0.18, 8]} /></mesh>
        </group>
        <group position={[0.26, 0.56, 0.04]}>
          <mesh material={mats.chairMeshBlack}><boxGeometry args={[0.05, 0.03, 0.26]} /></mesh>
          <mesh position={[0, -0.1, -0.05]} material={mats.chairBaseChrome}><cylinderGeometry args={[0.015, 0.015, 0.18, 8]} /></mesh>
        </group>
      </group>
    </group>
  );

  return (
    <group>
      {/* ============================================================== */}
      {/* 🌳 1. DAYLIGHT CAMPUS PARK & SURROUNDINGS                      */}
      {/* ============================================================== */}
      <mesh position={[0, -0.4, 0]} receiveShadow material={mats.floorGrass}>
        <boxGeometry args={[140, 0.4, 120]} />
      </mesh>
      <mesh position={[0, -0.02, 30]} receiveShadow material={mats.floorPaving}>
        <boxGeometry args={[52, 0.08, 20]} />
      </mesh>
      {[
        [-30, 0, 24], [30, 0, 24], [-18, 0, 30], [18, 0, 30],
        [-30, 0, -22], [30, 0, -22],
      ].map(([x, y, z], idx) => (
        <group key={`tree-${idx}`} position={[x, y, z]}>
          <mesh position={[0, 2, 0]} material={mats.treeTrunk}>
            <cylinderGeometry args={[0.3, 0.4, 4, 8]} />
          </mesh>
          <mesh position={[0, 4.5, 0]} material={mats.treeLeaves}>
            <sphereGeometry args={[2, 12, 12]} />
          </mesh>
        </group>
      ))}

      {/* ============================================================== */}
      {/* 🏛️ 2. EXPOSED BLACK STEEL I-BEAMS ARCHITECTURAL FRAMEWORK      */}
      {/* ============================================================== */}
      {[
        [-24, 13.5, -18],
        [24, 13.5, -18],
        [-24, 13.5, 18],
        [24, 13.5, 18],
      ].map(([px, py, pz], idx) => (
        <group key={`megapillar-${idx}`} position={[px, py, pz]}>
          <mesh material={mats.beamSteelBlack} castShadow>
            <boxGeometry args={[1.4, 27, 1.4]} />
          </mesh>
          {[0, 9, 18, 27].map((fy, f) => (
            <mesh key={`ring-${f}`} position={[0, -13.5 + fy, 0]} material={mats.beamSteelBlack}>
              <boxGeometry args={[1.7, 0.4, 1.7]} />
            </mesh>
          ))}
        </group>
      ))}
      {[0, 9, 18, 27].map((fy, idx) => (
        <mesh key={`fgirder-${idx}`} position={[0, fy, 18]} material={mats.spandrelFascia}>
          <boxGeometry args={[48.8, 0.6, 0.6]} />
        </mesh>
      ))}
      {[-16, -8, 0, 8, 16].map((rx, idx) => (
        <mesh key={`rear-mullion-${idx}`} position={[rx, 13.5, -18.1]} material={mats.beamSteelBlack}>
          <boxGeometry args={[0.3, 27, 0.3]} />
        </mesh>
      ))}
      <mesh position={[0, 13.5, -18]}>
        <planeGeometry args={[48, 27]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.16} roughness={0.05} metalness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-24, 13.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[36, 27]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.16} roughness={0.05} metalness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[24, 13.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[36, 27]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.16} roughness={0.05} metalness={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* ============================================================== */}
      {/* 🚪 FRONT ENTRANCE AUTOMATIC SLIDING GLASS DOORS (z = 18)       */}
      {/* ============================================================== */}
      <group position={[0, 0, 18]}>
        {/* Slender Black Structural Frame with Open Portal Center */}
        {/* Left Side Frame Pillar */}
        <mesh position={[-3.15, 2.0, 0]} material={mats.beamSteelBlack}>
          <boxGeometry args={[0.2, 4.0, 0.15]} />
        </mesh>
        {/* Right Side Frame Pillar */}
        <mesh position={[3.15, 2.0, 0]} material={mats.beamSteelBlack}>
          <boxGeometry args={[0.2, 4.0, 0.15]} />
        </mesh>
        {/* Top Header Girder */}
        <mesh position={[0, 3.9, 0]} material={mats.beamSteelBlack}>
          <boxGeometry args={[6.5, 0.2, 0.15]} />
        </mesh>
        {/* Middle Horizontal Transom Rail */}
        <mesh position={[0, 2.8, 0]} material={mats.beamSteelBlack}>
          <boxGeometry args={[6.3, 0.08, 0.12]} />
        </mesh>
        {/* Center Guide Divider Post */}
        <mesh position={[0, 1.4, 0]} material={mats.beamSteelBlack}>
          <boxGeometry args={[0.06, 2.8, 0.1]} />
        </mesh>

        {/* Semi-Transparent Glass Transom Window (Above Doors) */}
        <mesh position={[0, 3.35, 0]} material={mats.glassDoorClear}>
          <planeGeometry args={[6.1, 1.0]} />
        </mesh>

        {/* Double Semi-Transparent Sliding Glass Doors */}
        {/* Left Glass Door Leaf */}
        <group position={[-1.5, 1.4, 0]}>
          <mesh material={mats.glassDoorClear}>
            <boxGeometry args={[2.9, 2.7, 0.04]} />
          </mesh>
          {/* Subtle Dark Aluminium Perimeter Sash */}
          <mesh position={[0, 1.33, 0]} material={mats.beamSteelBlack}>
            <boxGeometry args={[2.9, 0.04, 0.05]} />
          </mesh>
          <mesh position={[0, -1.33, 0]} material={mats.beamSteelBlack}>
            <boxGeometry args={[2.9, 0.04, 0.05]} />
          </mesh>
          <mesh position={[-1.43, 0, 0]} material={mats.beamSteelBlack}>
            <boxGeometry args={[0.04, 2.7, 0.05]} />
          </mesh>
          <mesh position={[1.43, 0, 0]} material={mats.beamSteelBlack}>
            <boxGeometry args={[0.04, 2.7, 0.05]} />
          </mesh>
          {/* Stainless Steel Vertical Handle */}
          <mesh position={[1.25, 0, 0.06]} material={mats.handrailChrome}>
            <cylinderGeometry args={[0.018, 0.018, 1.2, 12]} />
          </mesh>
        </group>

        {/* Right Glass Door Leaf */}
        <group position={[1.5, 1.4, 0]}>
          <mesh material={mats.glassDoorClear}>
            <boxGeometry args={[2.9, 2.7, 0.04]} />
          </mesh>
          {/* Subtle Dark Aluminium Perimeter Sash */}
          <mesh position={[0, 1.33, 0]} material={mats.beamSteelBlack}>
            <boxGeometry args={[2.9, 0.04, 0.05]} />
          </mesh>
          <mesh position={[0, -1.33, 0]} material={mats.beamSteelBlack}>
            <boxGeometry args={[2.9, 0.04, 0.05]} />
          </mesh>
          <mesh position={[-1.43, 0, 0]} material={mats.beamSteelBlack}>
            <boxGeometry args={[0.04, 2.7, 0.05]} />
          </mesh>
          <mesh position={[1.43, 0, 0]} material={mats.beamSteelBlack}>
            <boxGeometry args={[0.04, 2.7, 0.05]} />
          </mesh>
          {/* Stainless Steel Vertical Handle */}
          <mesh position={[-1.25, 0, 0.06]} material={mats.handrailChrome}>
            <cylinderGeometry args={[0.018, 0.018, 1.2, 12]} />
          </mesh>
        </group>
      </group>

      {/* ============================================================== */}
      {/* 🪜 3. LEFT SIDE OPEN STAIRCASE WITH HOLED FLOOR (x = -20)       */}
      {/* ============================================================== */}
      {([
        [0, 0, 9],
        [9, 1, 18],
      ] as [number, number, number][]).map(([baseY]) => {
        const flightLen = 8.2;
        const stepCount = 16;
        const rise = 9 / stepCount;
        const run = flightLen / stepCount;
        const startZ = -flightLen / 2;
        return (
          <group key={`flight-${baseY}`} position={[-20, baseY, 0]}>
            {[-1.2, 1.2].map((sx, si) => (
              <group key={`stringer-${si}`} position={[sx, 4.5, 0]} rotation={[Math.atan2(9, flightLen), 0, 0]}>
                <mesh material={mats.beamSteelBlack}>
                  <boxGeometry args={[0.14, 0.55, 12.2]} />
                </mesh>
                <mesh position={[0, 0.08, 0]} material={mats.woodDarkWalnut}>
                  <boxGeometry args={[0.16, 0.04, 12.2]} />
                </mesh>
              </group>
            ))}
            {Array.from({ length: stepCount + 1 }).map((_, step) => {
              const stepY = (step + 0.5) * rise;
              const stepZ = startZ + step * run;
              return (
                <group key={`step-${step}`} position={[0, stepY, stepZ]}>
                  <mesh material={mats.floorWoodParquet} castShadow receiveShadow>
                    <boxGeometry args={[2.3, 0.08, run + 0.08]} />
                  </mesh>
                </group>
              );
            })}
            {[-1.25, 1.25].map((hx, hi) => (
              <group key={`hrail-${hi}`} position={[hx, 5.2, 0]}>
                <mesh rotation={[Math.atan2(9, flightLen), 0, 0]} material={mats.handrailBlack}>
                  <cylinderGeometry args={[0.035, 0.035, 12.4, 8]} />
                </mesh>
                {Array.from({ length: 6 }).map((_, ci) => (
                  <mesh
                    key={`cable-${ci}`}
                    rotation={[Math.atan2(9, flightLen), 0, 0]}
                    position={[0, -0.7 - ci * 0.18, 0]}
                    material={mats.handrailBlack}
                  >
                    <cylinderGeometry args={[0.008, 0.008, 12.2, 6]} />
                  </mesh>
                ))}
              </group>
            ))}
          </group>
        );
      })}

      {/* ============================================================== */}
      {/* 🛗 4. RIGHT SIDE PANORAMIC GLASS ELEVATOR (VIP FOR CEO RENDY)  */}
      {/* ============================================================== */}
      <group position={[20, 0, 0]}>
        {/* Full Height Vertical Steel & Glass Shaft (y = 0..27) */}
        <mesh position={[0, 13.5, 0]} material={mats.glassElevator}>
          <boxGeometry args={[3.8, 27, 3.8]} />
        </mesh>
        {[-1.85, 1.85].map((bx) =>
          [-1.85, 1.85].map((bz) => (
            <mesh key={`ebeam-${bx}-${bz}`} position={[bx, 13.5, bz]} material={mats.beamSteelBlack}>
              <boxGeometry args={[0.18, 27, 0.18]} />
            </mesh>
          ))
        )}

        {/* Floor Landing Door Frames on Each Floor */}
        {[0, 9, 18].map((fy) => (
          <group key={`edoorframe-${fy}`} position={[-1.9, fy + 1.4, 0]}>
            <mesh material={mats.beamSteelBlack}>
              <boxGeometry args={[0.1, 2.7, 1.8]} />
            </mesh>
            <mesh position={[-0.06, 1.25, 0]} material={mats.serverLedCyan}>
              <boxGeometry args={[0.02, 0.18, 0.45]} />
            </mesh>
            <Text position={[-0.08, 1.25, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.11} color="#ffffff" anchorX="center" anchorY="middle">
              {`L${Math.round(fy / 9) + 1} 🛗`}
            </Text>
          </group>
        ))}

        {/* Dynamic Animated Elevator Cabin */}
        <group ref={cabinRef} position={[0, FLOOR_HEIGHTS.L3_PENTHOUSE, 0]}>
          <mesh position={[0, 0.08, 0]} material={mats.spandrelFascia} receiveShadow>
            <boxGeometry args={[3.2, 0.16, 3.2]} />
          </mesh>
          <mesh position={[0, 2.8, 0]} material={mats.spandrelFascia}>
            <boxGeometry args={[3.2, 0.16, 3.2]} />
          </mesh>
          <pointLight position={[0, 2.6, 0]} intensity={1.2} color="#fffbeb" distance={5} />
          <mesh position={[0, 2.72, 0]} material={mats.lightWarmLED}>
            <cylinderGeometry args={[0.3, 0.3, 0.04, 16]} />
          </mesh>
          <mesh position={[0, 1.45, -1.55]} material={mats.glassElevator}><planeGeometry args={[3.0, 2.6]} /></mesh>
          <mesh position={[0, 1.45, 1.55]} material={mats.glassElevator}><planeGeometry args={[3.0, 2.6]} /></mesh>
          <mesh position={[1.55, 1.45, 0]} rotation={[0, -Math.PI / 2, 0]} material={mats.glassElevator}><planeGeometry args={[3.0, 2.6]} /></mesh>
          <group position={[-1.55, 1.45, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh ref={leftDoorRef} position={[-0.42, 0, 0]} material={mats.glassElevator}><boxGeometry args={[0.82, 2.5, 0.04]} /></mesh>
            <mesh ref={rightDoorRef} position={[0.42, 0, 0]} material={mats.glassElevator}><boxGeometry args={[0.82, 2.5, 0.04]} /></mesh>
            <mesh position={[0, 1.3, 0]} material={mats.handrailChrome}><boxGeometry args={[1.8, 0.1, 0.08]} /></mesh>
          </group>
        </group>
      </group>

      {/* ============================================================== */}
      {/* 🏢 5. FLOOR SLABS WITH STAIRWELL & ELEVATOR SHAFT HOLES        */}
      {/* ============================================================== */}
      {/* --- LEVEL 1 (Ground Floor, y = 0) --- */}
      <mesh position={[0, 0.08, 0]} receiveShadow material={mats.floorConcreteGround}>
        <boxGeometry args={[48, 0.16, 36]} />
      </mesh>

      {/* --- LEVEL 2 (Studio Hub, y = 9): Open Stairwell & Elevator Holes --- */}
      {/* Center Studio Floor Slab */}
      <mesh position={[0.65, 8.95, 0]} receiveShadow material={mats.floorWoodParquet}>
        <boxGeometry args={[34.3, 0.12, 36]} />
      </mesh>
      {/* Left Wing Rear & Front Slabs (around Stair Opening) */}
      <mesh position={[-20.25, 8.95, -11.25]} receiveShadow material={mats.floorWoodParquet}>
        <boxGeometry args={[7.5, 0.12, 13.5]} />
      </mesh>
      <mesh position={[-20.25, 8.95, 11.25]} receiveShadow material={mats.floorWoodParquet}>
        <boxGeometry args={[7.5, 0.12, 13.5]} />
      </mesh>
      {/* Right Wing Rear & Front Slabs (around Elevator Shaft Opening x = 17.8..24) */}
      <mesh position={[20.9, 8.95, -10.1]} receiveShadow material={mats.floorWoodParquet}>
        <boxGeometry args={[6.2, 0.12, 15.8]} />
      </mesh>
      <mesh position={[20.9, 8.95, 10.1]} receiveShadow material={mats.floorWoodParquet}>
        <boxGeometry args={[6.2, 0.12, 15.8]} />
      </mesh>

      {/* Level 2 Safety Railings around Stair Opening */}
      <group position={[-16.5, 9.45, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh material={mats.railingGlass}><boxGeometry args={[9.0, 0.9, 0.05]} /></mesh>
        <mesh position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.handrailBlack}><cylinderGeometry args={[0.035, 0.035, 9.0, 8]} /></mesh>
      </group>
      <group position={[-20.25, 9.45, -4.5]}>
        <mesh material={mats.railingGlass}><boxGeometry args={[7.5, 0.9, 0.05]} /></mesh>
        <mesh position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.handrailBlack}><cylinderGeometry args={[0.035, 0.035, 7.5, 8]} /></mesh>
      </group>

      {/* Drop Ceiling below Level 2 with matching Cutouts */}
      <mesh position={[0.65, 8.88, 0]} material={mats.ceilingSand}><boxGeometry args={[34.3, 0.12, 35.6]} /></mesh>
      <mesh position={[-20.25, 8.88, -11.25]} material={mats.ceilingSand}><boxGeometry args={[7.5, 0.12, 13.5]} /></mesh>
      <mesh position={[-20.25, 8.88, 11.25]} material={mats.ceilingSand}><boxGeometry args={[7.5, 0.12, 13.5]} /></mesh>
      <mesh position={[20.9, 8.88, -10.1]} material={mats.ceilingSand}><boxGeometry args={[6.2, 0.12, 15.8]} /></mesh>
      <mesh position={[20.9, 8.88, 10.1]} material={mats.ceilingSand}><boxGeometry args={[6.2, 0.12, 15.8]} /></mesh>

      {/* Front Glass Railing along Cutaway Facade */}
      <group position={[0, 9.45, 17.8]}>
        <mesh material={mats.railingGlass}><boxGeometry args={[47.6, 0.9, 0.05]} /></mesh>
        <mesh position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.handrailBlack}><cylinderGeometry args={[0.035, 0.035, 47.6, 8]} /></mesh>
      </group>

      {/* --- LEVEL 3 (Penthouse, y = 18): Open Stairwell & Elevator Holes --- */}
      <mesh position={[-4.25, 17.95, 0]} receiveShadow material={mats.floorWoodParquet}>
        <boxGeometry args={[24.5, 0.12, 36]} />
      </mesh>
      <mesh position={[-20.25, 17.95, -11.25]} receiveShadow material={mats.floorWoodParquet}>
        <boxGeometry args={[7.5, 0.12, 13.5]} />
      </mesh>
      <mesh position={[-20.25, 17.95, 11.25]} receiveShadow material={mats.floorWoodParquet}>
        <boxGeometry args={[7.5, 0.12, 13.5]} />
      </mesh>

      {/* Helipad Slab with Elevator Shaft Opening */}
      <mesh position={[12.9, 17.95, 0]} receiveShadow material={mats.floorHelipadConcrete}>
        <boxGeometry args={[9.8, 0.14, 36]} />
      </mesh>
      <mesh position={[20.9, 17.95, -10.1]} receiveShadow material={mats.floorHelipadConcrete}>
        <boxGeometry args={[6.2, 0.14, 15.8]} />
      </mesh>
      <mesh position={[20.9, 17.95, 10.1]} receiveShadow material={mats.floorHelipadConcrete}>
        <boxGeometry args={[6.2, 0.14, 15.8]} />
      </mesh>

      {/* Level 3 Safety Railings */}
      <group position={[-16.5, 18.45, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh material={mats.railingGlass}><boxGeometry args={[9.0, 0.9, 0.05]} /></mesh>
        <mesh position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.handrailBlack}><cylinderGeometry args={[0.035, 0.035, 9.0, 8]} /></mesh>
      </group>
      <group position={[-20.25, 18.45, -4.5]}>
        <mesh material={mats.railingGlass}><boxGeometry args={[7.5, 0.9, 0.05]} /></mesh>
        <mesh position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.handrailBlack}><cylinderGeometry args={[0.035, 0.035, 7.5, 8]} /></mesh>
      </group>
      <group position={[0, 18.45, 17.8]}>
        <mesh material={mats.railingGlass}><boxGeometry args={[47.6, 0.9, 0.05]} /></mesh>
        <mesh position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.handrailBlack}><cylinderGeometry args={[0.035, 0.035, 47.6, 8]} /></mesh>
      </group>

      {/* ============================================================== */}
      {/* 🏢 6. LEVEL 1 (Ground): GRAND LOBBY, RECEPTION & SATPAM POST   */}
      {/* ============================================================== */}
      <group position={[0, FLOOR_HEIGHTS.L1_GROUND, 0]}>
        {/* 1. Grand Reception Counter for Siti (Centered at [0, 0, 11]) */}
        <group position={[0, 0, 11]}>
          {/* Outer Marble & Oak Front Counter */}
          <mesh position={[0, 0.55, 0]} material={mats.deskWoodLight} castShadow>
            <boxGeometry args={[5.2, 1.1, 1.4]} />
          </mesh>
          <mesh position={[0, 1.12, 0]} material={mats.floorMarbleReception} receiveShadow>
            <boxGeometry args={[5.4, 0.06, 1.5]} />
          </mesh>
          {/* Illuminated Reception Front Sign */}
          <Text position={[0, 0.55, 0.72]} fontSize={0.22} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
            VIRTUAL OFFICE HQ
          </Text>
          {/* Inner Workstation Desk for Siti */}
          <mesh position={[0, 0.72, -0.45]} material={mats.deskWoodLight}>
            <boxGeometry args={[4.4, 0.04, 0.7]} />
          </mesh>
          {/* Receptionist Computer & Desk Accessories */}
          <mesh position={[-0.6, 0.95, -0.45]} material={mats.monitorBezelDark}>
            <boxGeometry args={[0.65, 0.42, 0.04]} />
          </mesh>
          <mesh position={[-0.6, 0.95, -0.43]} material={mats.monitorClockScreen}>
            <planeGeometry args={[0.6, 0.38]} />
          </mesh>
          <mesh position={[0.6, 0.76, -0.35]} material={mats.trimGold}>
            <cylinderGeometry args={[0.06, 0.08, 0.06, 12]} />
          </mesh>
          {/* Ergonomic Task Chair behind Reception for Siti */}
          <mesh position={[0, 0.44, -1.1]} material={mats.chairMeshBlack}>
            <boxGeometry args={[0.48, 0.06, 0.46]} />
          </mesh>
          <mesh position={[0, 0.74, -1.3]} material={mats.chairMeshBlack}>
            <boxGeometry args={[0.44, 0.52, 0.05]} />
          </mesh>
        </group>

        {/* 2. Security Guard Post for Pak Joko (Beside Entrance Doors at [5.5, 0, 15.5]) */}
        <group position={[5.5, 0, 15.5]}>
          {/* 2 Speed Gate RFID Turnstiles */}
          {[-1.2, -0.2].map((tx, ti) => (
            <group key={`turnstile-${ti}`} position={[tx, 0, 0]}>
              <mesh position={[0, 0.5, 0]} material={mats.handrailChrome} castShadow>
                <boxGeometry args={[0.2, 1.0, 0.8]} />
              </mesh>
              <mesh position={[0, 0.5, 0]} material={mats.lightCyanNeon}>
                <boxGeometry args={[0.04, 0.8, 0.02]} />
              </mesh>
            </group>
          ))}
          {/* Security Guard Podium Desk */}
          <mesh position={[1.0, 0.55, 0.4]} material={mats.beamSteelBlack} castShadow>
            <boxGeometry args={[1.2, 1.1, 0.7]} />
          </mesh>
          {/* Multi-Screen CCTV Monitor Display */}
          <mesh position={[1.0, 1.35, 0.4]} material={mats.monitorBezelDark}>
            <boxGeometry args={[1.1, 0.55, 0.05]} />
          </mesh>
          <mesh position={[1.0, 1.35, 0.43]} material={mats.tvScreen}>
            <planeGeometry args={[1.05, 0.5]} />
          </mesh>
          <Text position={[1.0, 1.35, 0.44]} fontSize={0.08} color="#ffffff" anchorX="center" anchorY="middle">
            CCTV CAM 1-4 🔴
          </Text>
        </group>

        {/* Back Center Whiteboard & Memo Bulletin Board */}
        <group position={[-2, 3.8, -17.4]}>
          <mesh material={mats.whiteboardFrame}><boxGeometry args={[14, 3.8, 0.1]} /></mesh>
          <mesh position={[0, 0, 0.06]} material={mats.whiteboardBg}><planeGeometry args={[13.4, 3.4]} /></mesh>
          {[-4, -2, 0, 2, 4].map((sx, idx) => (
            <mesh key={`stk-l1-${idx}`} position={[sx, idx % 2 === 0 ? 0.6 : -0.6, 0.08]} material={idx % 2 === 0 ? mats.helipadYellow : mats.serverLedCyan}>
              <planeGeometry args={[1.0, 0.8]} />
            </mesh>
          ))}
        </group>
        <group position={[-14, 3.8, -17.4]}>
          <mesh material={mats.woodOakTrim}><boxGeometry args={[4.2, 3.2, 0.08]} /></mesh>
          <mesh position={[0, 0, 0.05]} material={mats.corkBoardMat}><planeGeometry args={[3.8, 2.8]} /></mesh>
        </group>
        <group position={[8, 5.2, -17.4]}>
          <mesh material={mats.beamSteelBlack}><cylinderGeometry args={[0.7, 0.7, 0.08, 32]} /></mesh>
          <mesh position={[0, 0, 0.05]} material={mats.whiteboardBg}><cylinderGeometry args={[0.62, 0.62, 0.02, 32]} /></mesh>
        </group>

        {/* Round Meeting Table & Sofa in Lobby */}
        <group position={[-10, 0, 0]}>
          <mesh position={[0, 0.01, 0]} material={mats.carpetCircular} receiveShadow><cylinderGeometry args={[2.8, 2.8, 0.02, 32]} /></mesh>
          <mesh position={[0, 0.74, 0]} material={mats.whiteboardBg} castShadow><cylinderGeometry args={[1.5, 1.5, 0.05, 32]} /></mesh>
          <mesh position={[0, 0.36, 0]} material={mats.handrailChrome}><cylinderGeometry args={[0.1, 0.1, 0.72, 16]} /></mesh>
        </group>
        <group position={[10, 0, 0]}>
          <mesh position={[0, 0.35, 0]} material={mats.sofaTeal} castShadow><boxGeometry args={[3.2, 0.45, 1.2]} /></mesh>
          <mesh position={[0, 0.85, -0.45]} material={mats.sofaTeal}><boxGeometry args={[3.2, 0.7, 0.3]} /></mesh>
        </group>

        <WaterCoolerDispenser position={[17, 0, 8]} />
        <Bookshelf position={[-23, 0, -10]} rotation={[0, Math.PI / 2, 0]} />
        <PottedFiddleLeafPlant position={[-16, 0, 8]} />
        <PottedFiddleLeafPlant position={[5, 0, 8]} />
        <SuspendedPendantLight position={[-10, 6.2, -4]} width={14} />
        <SuspendedPendantLight position={[12, 6.2, -4]} width={14} />
      </group>

      {/* ============================================================== */}
      {/* 💻 7. LEVEL 2 (Studio Hub): TECH, DATA & CREATIVE DESIGN       */}
      {/* ============================================================== */}
      <group position={[0, FLOOR_HEIGHTS.L2_STUDIO, 0]}>
        <group position={[0, 3.8, -17.4]}>
          <mesh material={mats.whiteboardFrame}><boxGeometry args={[22, 4.0, 0.1]} /></mesh>
          <mesh position={[0, 0, 0.06]} material={mats.whiteboardBg}><planeGeometry args={[21.2, 3.5]} /></mesh>
          {[-8, -5, -2, 1, 4, 7].map((sx, idx) => (
            <mesh key={`stk-l2-${idx}`} position={[sx, idx % 2 === 0 ? 0.6 : -0.6, 0.08]} material={idx % 2 === 0 ? mats.helipadYellow : mats.serverLedCyan}>
              <planeGeometry args={[1.2, 0.9]} />
            </mesh>
          ))}
        </group>

        {/* 4 DevOps Server Racks positioned along back right wall (Far from elevator!) */}
        {[6, 9, 12, 15].map((sx, idx) => (
          <group key={`srack-${idx}`} position={[sx, 0, -16.5]}>
            <mesh position={[0, 2.0, 0]} material={mats.serverRack} castShadow>
              <boxGeometry args={[1.4, 4.0, 1.2]} />
            </mesh>
            <mesh position={[0, 2.0, 0.62]} material={idx % 2 === 0 ? mats.serverLedCyan : mats.serverLedGreen}>
              <boxGeometry args={[1.2, 3.4, 0.05]} />
            </mesh>
          </group>
        ))}

        <Bookshelf position={[-23, 0, -12]} rotation={[0, Math.PI / 2, 0]} />
        <PottedFiddleLeafPlant position={[-16, 0, -14]} />
        <PottedFiddleLeafPlant position={[-6, 0, 4]} />
        <PottedFiddleLeafPlant position={[6, 0, 4]} />

        <SuspendedPendantLight position={[-10, 6.2, -10]} width={14} />
        <SuspendedPendantLight position={[10, 6.2, -10]} width={14} />
        <SuspendedPendantLight position={[-10, 6.2, 8]} width={14} />
        <SuspendedPendantLight position={[10, 6.2, 8]} width={14} />
      </group>

      {/* ============================================================== */}
      {/* 👑 8. LEVEL 3 (Penthouse): CEO SUITE, BILLIARD & PS5 LOUNGE    */}
      {/* ============================================================== */}
      <group position={[0, FLOOR_HEIGHTS.L3_PENTHOUSE, 0]}>
        {/* CEO Rendy Executive Desk Suite (Left Wing at [-10, 0, -8]) */}
        <group position={[-10, 0, -8]}>
          <mesh position={[0, 0.65, 0]} material={mats.woodDarkWalnut} castShadow>
            <boxGeometry args={[4.8, 1.3, 2.2]} />
          </mesh>
          <mesh position={[0, 1.32, 0]} material={mats.trimGold}>
            <boxGeometry args={[5.0, 0.05, 2.4]} />
          </mesh>
          <mesh position={[0, 0.7, 1.4]} material={mats.chairLeatherChesterfield}>
            <boxGeometry args={[1.2, 1.4, 1.2]} />
          </mesh>
          <mesh position={[0, 3.2, -7.8]} material={mats.woodDarkWalnut}>
            <boxGeometry args={[8.0, 3.6, 0.8]} />
          </mesh>
        </group>

        {/* 🎱 1. Luxury 9-Foot Billiard Table in CEO Suite (at [-10, 0, 6]) */}
        <group position={[-10, 0, 6]}>
          {/* Mahogany Table Base Frame */}
          <mesh position={[0, 0.65, 0]} material={mats.billiardWoodMahogany} castShadow receiveShadow>
            <boxGeometry args={[4.8, 0.4, 2.6]} />
          </mesh>
          {/* 4 Heavy Carved Mahogany Legs */}
          {[-2.1, 2.1].map((bx) =>
            [-1.0, 1.0].map((bz) => (
              <mesh key={`bleg-${bx}-${bz}`} position={[bx, 0.3, bz]} material={mats.billiardWoodMahogany}>
                <cylinderGeometry args={[0.16, 0.12, 0.6, 12]} />
              </mesh>
            ))
          )}
          {/* Green Championship Felt Bed */}
          <mesh position={[0, 0.86, 0]} material={mats.billiardFeltGreen} receiveShadow>
            <boxGeometry args={[4.4, 0.05, 2.2]} />
          </mesh>
          {/* 6 Leather Pockets */}
          {[-2.15, 0, 2.15].map((px) =>
            [-1.05, 1.05].map((pz) => (
              <mesh key={`pocket-${px}-${pz}`} position={[px, 0.89, pz]} material={mats.beamSteelBlack}>
                <cylinderGeometry args={[0.09, 0.09, 0.08, 12]} />
              </mesh>
            ))
          )}
          {/* Overhead Billiard Pendant Lamp */}
          <mesh position={[0, 2.2, 0]} material={mats.billiardWoodMahogany}>
            <boxGeometry args={[2.8, 0.15, 0.6]} />
          </mesh>
          <pointLight position={[0, 2.0, 0]} intensity={1.5} color="#fffbeb" distance={6} />
        </group>

        {/* 🎮 2. PS5 Gaming Lounge in CEO Suite (at [-4, 0, 6]) */}
        <group position={[-4, 0, 6]}>
          {/* Large Gaming TV Media Console */}
          <mesh position={[0, 0.35, 1.8]} material={mats.woodDarkWalnut} castShadow>
            <boxGeometry args={[3.2, 0.55, 0.7]} />
          </mesh>
          {/* 65-inch 4K HDR Gaming TV */}
          <mesh position={[0, 1.4, 1.8]} material={mats.tvBezel}>
            <boxGeometry args={[2.6, 1.4, 0.08]} />
          </mesh>
          <mesh position={[0, 1.4, 1.85]} material={mats.tvScreen}>
            <planeGeometry args={[2.5, 1.3]} />
          </mesh>
          {/* PS5 Console with Glowing Cyan LED Bar */}
          <mesh position={[1.1, 0.7, 1.8]} material={mats.ps5ConsoleWhite}>
            <boxGeometry args={[0.16, 0.42, 0.28]} />
          </mesh>
          <mesh position={[1.1, 0.7, 1.95]} material={mats.ps5LedBlue}>
            <boxGeometry args={[0.02, 0.38, 0.02]} />
          </mesh>
          {/* Comfy Lounge Gaming Couch facing TV */}
          <mesh position={[0, 0.35, -0.4]} material={mats.sofaTeal} castShadow>
            <boxGeometry args={[3.0, 0.45, 1.2]} />
          </mesh>
          <mesh position={[0, 0.85, -0.85]} material={mats.sofaTeal}>
            <boxGeometry args={[3.0, 0.7, 0.3]} />
          </mesh>
        </group>

        <Bookshelf position={[-23, 0, -6]} rotation={[0, Math.PI / 2, 0]} />
        <PottedFiddleLeafPlant position={[-18, 0, -4]} />
        <PottedFiddleLeafPlant position={[-2, 0, -4]} />

        {/* --- Exterior Rooftop Helipad Deck (Right Wing) --- */}
        <group position={[12, 0, 0]}>
          <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.helipadYellow}>
            <ringGeometry args={[5.8, 7.0, 64]} />
          </mesh>
          <Text position={[0, 0.07, 0]} fontSize={5.0} color="#ffffff" anchorX="center" anchorY="middle" rotation={[-Math.PI / 2, 0, 0]}>
            H
          </Text>
          {[-7, 0, 7].map((bx) =>
            [-8, 8].map((bz) => (
              <mesh key={`hbcn-${bx}-${bz}`} position={[bx, 0.15, bz]} material={mats.beaconLight}>
                <cylinderGeometry args={[0.2, 0.2, 0.3, 12]} />
              </mesh>
            ))
          )}
          <ExecutiveHelicopter position={[0, 0.06, 0]} />
        </group>
      </group>

      {/* ============================================================== */}
      {/* 🧑‍💼 9. SCANDINAVIAN WORKSTATIONS FOR ALL DESK AGENTS            */}
      {/* ============================================================== */}
      {AGENT_REGISTRY_30.map((agent) => {
        if (agent.role === 'security-guard' || agent.role === 'receptionist' || agent.role === 'orchestrator') {
          return null;
        }
        return (
          <ScandinavianWorkstation key={agent.role} position={agent.pos} />
        );
      })}
    </group>
  );
}
