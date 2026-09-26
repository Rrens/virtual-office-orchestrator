'use client';

import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { FLOOR_HEIGHTS, AGENT_REGISTRY_30 } from './OfficeWaypoints';
import { ExecutiveHelicopter } from './ExecutiveHelicopter';

export function OfficeEnvironment() {
  const mats = useMemo(() => ({
    // Floors
    floorMarbleWhite: new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.12,
      metalness: 0.08,
    }),
    floorMarbleBlack: new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.1, metalness: 0.2 }),
    floorSilverCEO: new THREE.MeshStandardMaterial({
      color: '#cbd5e1',
      roughness: 0.18,
      metalness: 0.75,
    }),
    floorHelipadConcrete: new THREE.MeshStandardMaterial({
      color: '#475569',
      roughness: 0.85,
      metalness: 0.1,
    }),
    floorGrass: new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.85 }),
    floorPaving: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.75 }),

    // Pillars & Structure
    pillarSteel: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.25, metalness: 0.85 }),
    pillarMarbleBlack: new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.1, metalness: 0.3 }),
    trimGold: new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.9, roughness: 0.15 }),
    spandrelFascia: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3, metalness: 0.7 }),

    // Walls, Facade & Railings
    wallGlassFacade: new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      opacity: 0.22,
      transparent: true,
      roughness: 0.05,
      metalness: 0.6,
    }),
    wallGlassClear: new THREE.MeshStandardMaterial({
      color: '#e0f2fe',
      opacity: 0.2,
      transparent: true,
      roughness: 0.05,
    }),
    railingGlass: new THREE.MeshStandardMaterial({
      color: '#bae6fd',
      opacity: 0.35,
      transparent: true,
      roughness: 0.05,
      metalness: 0.3,
    }),
    handrailChrome: new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.95, roughness: 0.1 }),
    frameMetalDark: new THREE.MeshStandardMaterial({ color: '#020617', roughness: 0.3, metalness: 0.85 }),
    wallWhite: new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.5 }),
    ceilingPanel: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4 }),
    ceilingDownlight: new THREE.MeshStandardMaterial({ color: '#fffbeb', emissive: '#fffbeb', emissiveIntensity: 1.2 }),

    // Scandinavian Woods & Furniture (Inspired by Reference Image)
    woodOak: new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.35 }),
    woodBirch: new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.4 }),
    woodDarkWalnut: new THREE.MeshStandardMaterial({ color: '#3b1d11', roughness: 0.2 }),
    corkBoardMat: new THREE.MeshStandardMaterial({ color: '#ca8a04', roughness: 0.9 }),
    carpetRugMat: new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.85 }),
    potTerracotta: new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.7 }),
    potSoil: new THREE.MeshStandardMaterial({ color: '#27170a', roughness: 0.9 }),
    plantGreen: new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.5 }),

    // Realistic Scandinavian Workstation (Matching User Ref Image)
    deskWoodLight: new THREE.MeshStandardMaterial({
      color: '#e8d4b8', // Natural warm Scandinavian light oak
      roughness: 0.32,
      metalness: 0.04,
    }),
    deskLegWhite: new THREE.MeshStandardMaterial({
      color: '#ffffff', // Clean white powder-coated cylindrical metal legs
      roughness: 0.2,
      metalness: 0.3,
    }),
    chairMeshBlack: new THREE.MeshStandardMaterial({
      color: '#1e293b', // Contoured dark ergonomic mesh
      roughness: 0.55,
      metalness: 0.1,
    }),
    chairBaseChrome: new THREE.MeshStandardMaterial({
      color: '#0f172a', // Dark metal 5-star swivel base
      roughness: 0.25,
      metalness: 0.85,
    }),
    monitorBezelDark: new THREE.MeshStandardMaterial({
      color: '#090d16',
      roughness: 0.2,
      metalness: 0.8,
    }),
    monitorCodeScreen: new THREE.MeshStandardMaterial({
      color: '#0f172a',
      emissive: '#064e3b',
      emissiveIntensity: 0.4,
    }),
    keyboardWhite: new THREE.MeshStandardMaterial({
      color: '#f8fafc',
      roughness: 0.2,
    }),
    mouseWhite: new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.15,
    }),
    paperWhite: new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.9,
    }),
    greenCan: new THREE.MeshStandardMaterial({
      color: '#16a34a',
      roughness: 0.3,
      metalness: 0.6,
    }),
    tealMug: new THREE.MeshStandardMaterial({
      color: '#10b981',
      roughness: 0.25,
    }),

    // Chairs & Sofas
    sofaGreen: new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.6 }),
    sofaNavy: new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.6 }),
    chairOffice: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.5 }),
    chairBeige: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.4 }),
    chairLeatherChesterfield: new THREE.MeshStandardMaterial({ color: '#1e1b4b', roughness: 0.35 }),

    // Workstation Tech
    deskModern: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4 }),
    deskExecutive: new THREE.MeshStandardMaterial({ color: '#3b1d11', roughness: 0.18 }),
    monitorOn: new THREE.MeshStandardMaterial({ color: '#0284c7', emissive: '#0284c7', emissiveIntensity: 1.0 }),
    monitorEditorCode: new THREE.MeshStandardMaterial({ color: '#059669', emissive: '#059669', emissiveIntensity: 0.9 }),
    laptopSilver: new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.9, roughness: 0.15 }),
    coffeeMugWhite: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2 }),

    // Server & Tech
    serverRack: new THREE.MeshStandardMaterial({ color: '#020617', roughness: 0.25, metalness: 0.8 }),
    serverLedCyan: new THREE.MeshStandardMaterial({ color: '#06b6d4', emissive: '#06b6d4', emissiveIntensity: 2.0 }),
    serverLedGreen: new THREE.MeshStandardMaterial({ color: '#10b981', emissive: '#10b981', emissiveIntensity: 2.0 }),
    serverLedRed: new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 2.0 }),
    cableTray: new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.6, roughness: 0.4 }),

    // Whiteboard & Art
    whiteboardBg: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.1 }),
    whiteboardFrame: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.3 }),
    artCanvas1: new THREE.MeshStandardMaterial({ color: '#f43f5e', roughness: 0.4 }),
    artCanvas2: new THREE.MeshStandardMaterial({ color: '#8b5cf6', roughness: 0.4 }),
    artCanvas3: new THREE.MeshStandardMaterial({ color: '#06b6d4', roughness: 0.4 }),

    // Books
    bookBlue: new THREE.MeshStandardMaterial({ color: '#2563eb' }),
    bookRed: new THREE.MeshStandardMaterial({ color: '#dc2626' }),
    bookGreen: new THREE.MeshStandardMaterial({ color: '#16a34a' }),
    bookYellow: new THREE.MeshStandardMaterial({ color: '#eab308' }),
    bookPurple: new THREE.MeshStandardMaterial({ color: '#9333ea' }),

    // Leisure & Mini Golf
    billiardCloth: new THREE.MeshStandardMaterial({ color: '#047857', roughness: 0.6 }),
    billiardWood: new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.3 }),
    golfTurf: new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.5 }),
    golfFlag: new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.3 }),
    golfPole: new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.9, roughness: 0.1 }),

    // Cafeteria / Pantry
    fridgeMetal: new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.85, roughness: 0.2 }),

    // Helipad Markings & Lights
    helipadYellow: new THREE.MeshStandardMaterial({ color: '#facc15', emissive: '#eab308', emissiveIntensity: 0.5 }),
    beaconLight: new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 2.0 }),

    // Exterior Trees
    treeTrunk: new THREE.MeshStandardMaterial({ color: '#713f12', roughness: 0.8 }),
    treeLeaves: new THREE.MeshStandardMaterial({ color: '#166534', roughness: 0.6 }),
  }), []);

  /* -------------------------------------------------------------------------- */
  /* Helper Subcomponents (Bookshelves, Plants, Tables, Couches)                */
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

  const PottedPlant = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} material={mats.potTerracotta} castShadow>
        <cylinderGeometry args={[0.38, 0.26, 0.7, 16]} />
      </mesh>
      <mesh position={[0, 0.69, 0]} material={mats.potSoil}>
        <cylinderGeometry args={[0.36, 0.36, 0.04, 16]} />
      </mesh>
      <mesh position={[0, 1.05, 0]} material={mats.plantGreen}>
        <sphereGeometry args={[0.42, 10, 10]} />
      </mesh>
      <mesh position={[-0.2, 1.3, 0.1]} material={mats.plantGreen}>
        <sphereGeometry args={[0.3, 8, 8]} />
      </mesh>
      <mesh position={[0.2, 1.25, -0.1]} material={mats.plantGreen}>
        <sphereGeometry args={[0.32, 8, 8]} />
      </mesh>
    </group>
  );

  const RoundMeetingTable = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
      <mesh position={[0, 0.01, 0]} material={mats.carpetRugMat} receiveShadow>
        <cylinderGeometry args={[2.8, 2.8, 0.02, 32]} />
      </mesh>
      <mesh position={[0, 0.75, 0]} material={mats.whiteboardBg} castShadow>
        <cylinderGeometry args={[1.6, 1.6, 0.06, 32]} />
      </mesh>
      <mesh position={[0, 0.37, 0]} material={mats.handrailChrome}>
        <cylinderGeometry args={[0.12, 0.12, 0.72, 16]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} material={mats.handrailChrome}>
        <cylinderGeometry args={[0.6, 0.6, 0.04, 24]} />
      </mesh>
      <mesh position={[0, 0.81, 0]} material={mats.laptopSilver}>
        <boxGeometry args={[0.55, 0.02, 0.4]} />
      </mesh>
      <mesh position={[0, 0.98, -0.18]} rotation={[0.4, 0, 0]} material={mats.monitorOn}>
        <boxGeometry args={[0.55, 0.35, 0.02]} />
      </mesh>
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <group key={`mchair-${i}`} position={[Math.cos(angle) * 1.9, 0, Math.sin(angle) * 1.9]} rotation={[0, -angle - Math.PI / 2, 0]}>
          <mesh position={[0, 0.45, 0]} material={mats.chairBeige}>
            <boxGeometry args={[0.52, 0.06, 0.48]} />
          </mesh>
          <mesh position={[0, 0.82, -0.22]} material={mats.chairBeige}>
            <boxGeometry args={[0.48, 0.7, 0.06]} />
          </mesh>
          <mesh position={[0, 0.22, 0]} material={mats.pillarSteel}>
            <cylinderGeometry args={[0.04, 0.04, 0.44, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );

  const LoungeSofa = ({ position, rotation = [0, 0, 0], color = mats.sofaGreen }: { position: [number, number, number]; rotation?: [number, number, number]; color?: THREE.Material }) => (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.35, 0]} material={color} castShadow>
        <boxGeometry args={[3.2, 0.45, 1.2]} />
      </mesh>
      <mesh position={[0, 0.85, -0.45]} material={color}>
        <boxGeometry args={[3.2, 0.7, 0.3]} />
      </mesh>
      <mesh position={[-1.6, 0.6, 0]} material={color}>
        <boxGeometry args={[0.3, 0.5, 1.2]} />
      </mesh>
      <mesh position={[1.6, 0.6, 0]} material={color}>
        <boxGeometry args={[0.3, 0.5, 1.2]} />
      </mesh>
      <group position={[0, 0, 1.3]}>
        <mesh position={[0, 0.32, 0]} material={mats.woodOak} castShadow>
          <boxGeometry args={[1.8, 0.06, 0.8]} />
        </mesh>
        {[-0.75, 0.75].map((tx) =>
          [-0.3, 0.3].map((tz) => (
            <mesh key={`tleg-${tx}-${tz}`} position={[tx, 0.16, tz]} material={mats.pillarSteel}>
              <cylinderGeometry args={[0.03, 0.03, 0.32, 8]} />
            </mesh>
          ))
        )}
        <mesh position={[0.3, 0.4, 0.1]} material={mats.coffeeMugWhite}>
          <cylinderGeometry args={[0.06, 0.06, 0.12, 12]} />
        </mesh>
      </group>
    </group>
  );

  /* -------------------------------------------------------------------------- */
  /* Realistic Scandinavian Workstation (Matching User Ref Image 1)             */
  /* -------------------------------------------------------------------------- */
  const ScandinavianWorkstation = ({ position }: { position: [number, number, number] }) => (
    <group position={position}>
      {/* 1. Scandinavian Light Oak Tabletop (2.2m x 1.0m, thickness 0.04m at height y = 0.72m) */}
      <mesh position={[0, 0.72, 0]} material={mats.deskWoodLight} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.04, 1.0]} />
      </mesh>

      {/* 4 Sleek White Cylindrical Metal Legs */}
      {[-0.98, 0.98].map((lx) =>
        [-0.42, 0.42].map((lz) => (
          <group key={`leg-${lx}-${lz}`} position={[lx, 0.35, lz]}>
            <mesh material={mats.deskLegWhite} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.7, 12]} />
            </mesh>
            {/* Round Foot Pad */}
            <mesh position={[0, -0.34, 0]} material={mats.chairBaseChrome}>
              <cylinderGeometry args={[0.035, 0.035, 0.02, 12]} />
            </mesh>
          </group>
        ))
      )}

      {/* White Under-desk Structural Support Frame */}
      <mesh position={[0, 0.69, -0.42]} material={mats.deskLegWhite}>
        <boxGeometry args={[1.96, 0.02, 0.02]} />
      </mesh>
      <mesh position={[0, 0.69, 0.42]} material={mats.deskLegWhite}>
        <boxGeometry args={[1.96, 0.02, 0.02]} />
      </mesh>

      {/* 2. Primary Left Monitor (Green Digital Clock "11:39" Screen - Exactly like Image 1) */}
      <group position={[-0.45, 0.74, -0.22]}>
        {/* Monitor Base & Neck */}
        <mesh position={[0, 0.01, 0]} material={mats.monitorBezelDark}>
          <boxGeometry args={[0.26, 0.015, 0.18]} />
        </mesh>
        <mesh position={[0, 0.16, -0.06]} material={mats.monitorBezelDark}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        </mesh>
        {/* Frame / Bezel */}
        <mesh position={[0, 0.35, -0.02]} material={mats.monitorBezelDark}>
          <boxGeometry args={[0.88, 0.52, 0.03]} />
        </mesh>
        {/* Screen Display */}
        <mesh position={[0, 0.35, 0.0]}>
          <planeGeometry args={[0.84, 0.48]} />
          <meshBasicMaterial color="#34d399" />
        </mesh>
        {/* Digital Time & Date Display */}
        <Text position={[0, 0.38, 0.01]} fontSize={0.095} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
          11:39
        </Text>
        <Text position={[0, 0.28, 0.01]} fontSize={0.04} color="#f0fdf4" anchorX="center" anchorY="middle">
          MON 28 SEP
        </Text>
      </group>

      {/* 3. Secondary Right Monitor (Dark Code / Editor Display - Angled toward User) */}
      <group position={[0.48, 0.74, -0.18]} rotation={[0, -0.15, 0]}>
        {/* Base & Neck */}
        <mesh position={[0, 0.01, 0]} material={mats.monitorBezelDark}>
          <boxGeometry args={[0.26, 0.015, 0.18]} />
        </mesh>
        <mesh position={[0, 0.16, -0.06]} material={mats.monitorBezelDark}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
        </mesh>
        {/* Bezel */}
        <mesh position={[0, 0.35, -0.02]} material={mats.monitorBezelDark}>
          <boxGeometry args={[0.84, 0.52, 0.03]} />
        </mesh>
        {/* Dark Code IDE Screen with subtle glow */}
        <mesh position={[0, 0.35, 0.0]} material={mats.monitorCodeScreen}>
          <planeGeometry args={[0.8, 0.48]} />
        </mesh>
        {/* Terminal Text Lines */}
        <Text position={[-0.34, 0.52, 0.01]} fontSize={0.035} color="#38bdf8" anchorX="left" anchorY="top">
          {'> main.ts\nimport express\nconst app = express()\napp.listen(3000)'}
        </Text>
      </group>

      {/* 4. Desktop Accessories (Keyboard, Mouse, Notepad, Mugs) */}
      {/* Slim Low-profile White Keyboard in Center */}
      <mesh position={[0, 0.745, 0.12]} material={mats.keyboardWhite} receiveShadow>
        <boxGeometry args={[0.46, 0.012, 0.14]} />
      </mesh>
      {/* Slim White Mouse on Right */}
      <mesh position={[0.34, 0.745, 0.13]} material={mats.mouseWhite}>
        <boxGeometry args={[0.07, 0.015, 0.11]} />
      </mesh>
      {/* White Paper / Document on Left */}
      <mesh position={[-0.32, 0.742, 0.15]} rotation={[0, 0.06, 0]} material={mats.paperWhite}>
        <boxGeometry args={[0.28, 0.003, 0.22]} />
      </mesh>
      {/* Green Soda Can / Pen Holder on Left */}
      <mesh position={[-0.8, 0.79, 0.08]} material={mats.greenCan}>
        <cylinderGeometry args={[0.035, 0.035, 0.1, 12]} />
      </mesh>
      {/* Green/Teal Coffee Mug on Right */}
      <mesh position={[0.75, 0.785, 0.08]} material={mats.tealMug}>
        <cylinderGeometry args={[0.04, 0.04, 0.085, 12]} />
      </mesh>

      {/* 5. Realistic Ergonomic 5-Star Swivel Chair (Facing Desk at z = 0.55) */}
      <group position={[0, 0, 0.55]}>
        {/* Central Hydraulic Piston */}
        <mesh position={[0, 0.24, 0]} material={mats.handrailChrome}>
          <cylinderGeometry args={[0.035, 0.035, 0.36, 12]} />
        </mesh>
        {/* 5-Star Radial Base */}
        {[0, 1, 2, 3, 4].map((i) => {
          const rad = (i * 2 * Math.PI) / 5;
          return (
            <group key={`spoke-${i}`} rotation={[0, rad, 0]}>
              <mesh position={[0, 0.06, 0.16]} rotation={[0.15, 0, 0]} material={mats.chairBaseChrome}>
                <boxGeometry args={[0.035, 0.025, 0.32]} />
              </mesh>
              {/* Caster Wheel */}
              <mesh position={[0, 0.03, 0.32]} material={mats.chairBaseChrome}>
                <sphereGeometry args={[0.03, 8, 8]} />
              </mesh>
            </group>
          );
        })}

        {/* Padded Contoured Seat Cushion (Height y = 0.44m) */}
        <mesh position={[0, 0.44, 0]} material={mats.chairMeshBlack} castShadow>
          <boxGeometry args={[0.5, 0.07, 0.48]} />
        </mesh>

        {/* Ergonomic Curved Mesh Backrest */}
        <mesh position={[0, 0.74, 0.22]} rotation={[-0.08, 0, 0]} material={mats.chairMeshBlack} castShadow>
          <boxGeometry args={[0.44, 0.54, 0.05]} />
        </mesh>

        {/* Left Armrest */}
        <group position={[-0.26, 0.56, 0.04]}>
          <mesh position={[0, 0, 0]} material={mats.chairMeshBlack}>
            <boxGeometry args={[0.05, 0.03, 0.26]} />
          </mesh>
          <mesh position={[0, -0.1, -0.05]} material={mats.chairBaseChrome}>
            <cylinderGeometry args={[0.015, 0.015, 0.18, 8]} />
          </mesh>
        </group>

        {/* Right Armrest */}
        <group position={[0.26, 0.56, 0.04]}>
          <mesh position={[0, 0, 0]} material={mats.chairMeshBlack}>
            <boxGeometry args={[0.05, 0.03, 0.26]} />
          </mesh>
          <mesh position={[0, -0.1, -0.05]} material={mats.chairBaseChrome}>
            <cylinderGeometry args={[0.015, 0.015, 0.18, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  );

  return (
    <group>
      {/* ============================================================== */}
      {/* 🌳 1. DAYLIGHT CAMPUS PARK & SURROUNDINGS                      */}
      {/* ============================================================== */}
      {/* Lawn Ground */}
      <mesh position={[0, -0.4, 0]} receiveShadow material={mats.floorGrass}>
        <boxGeometry args={[140, 0.4, 120]} />
      </mesh>

      {/* Main Entrance Plaza Paving (Outside strictly: z = 24 to 44) */}
      <mesh position={[0, -0.02, 30]} receiveShadow material={mats.floorPaving}>
        <boxGeometry args={[52, 0.08, 20]} />
      </mesh>

      {/* Garden Trees */}
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

      {/* City Skyline Background Towers */}
      {[
        [-55, 18, -45, 20, 45, 20],
        [-30, 22, -50, 22, 50, 22],
        [30, 20, -50, 20, 46, 20],
        [55, 16, -42, 18, 40, 18],
      ].map(([x, y, z, w, h, d], idx) => (
        <group key={`bg-bldg-${idx}`} position={[x, y, z]}>
          <mesh material={mats.frameMetalDark}>
            <boxGeometry args={[w, h, d]} />
          </mesh>
          <mesh position={[0, 0, d / 2 + 0.1]} material={mats.wallGlassClear}>
            <planeGeometry args={[w * 0.8, h * 0.8]} />
          </mesh>
        </group>
      ))}

      {/* ============================================================== */}
      {/* 🏛️ 2. 4 MEGA STRUCTURAL COLUMNS (Spans height y = 0..27)       */}
      {/* ============================================================== */}
      {[
        [-24, 13.5, -18],
        [24, 13.5, -18],
        [-24, 13.5, 18],
        [24, 13.5, 18],
      ].map(([px, py, pz], idx) => (
        <group key={`megapillar-${idx}`} position={[px, py, pz]}>
          <mesh material={mats.pillarSteel} castShadow>
            <boxGeometry args={[1.5, 27, 1.5]} />
          </mesh>
          {[0, 9, 18, 27].map((fy, f) => (
            <mesh key={`ring-${f}`} position={[0, -13.5 + fy, 0]} material={mats.trimGold}>
              <boxGeometry args={[1.7, 0.25, 1.7]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Rear Structural Mullions */}
      {[-16, -8, 0, 8, 16].map((rx, idx) => (
        <mesh key={`rear-mullion-${idx}`} position={[rx, 13.5, -18.1]} material={mats.pillarSteel}>
          <boxGeometry args={[0.3, 27, 0.3]} />
        </mesh>
      ))}

      {/* Full Height Rear Glass Curtain Wall */}
      <mesh position={[0, 13.5, -18]}>
        <planeGeometry args={[48, 27]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.2} roughness={0.05} metalness={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Side Glass Panels */}
      <mesh position={[-24, 13.5, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[36, 27]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.2} roughness={0.05} metalness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[24, 13.5, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[36, 27]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.2} roughness={0.05} metalness={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Glass Elevator Tower (x = 20) */}
      <group position={[20, 13.5, 0]}>
        <mesh material={mats.wallGlassClear}>
          <boxGeometry args={[3.8, 27, 3.8]} />
        </mesh>
        {[-1.8, 1.8].map((bx) =>
          [-1.8, 1.8].map((bz) => (
            <mesh key={`ebeam-${bx}-${bz}`} position={[bx, 0, bz]} material={mats.pillarSteel}>
              <boxGeometry args={[0.2, 27, 0.2]} />
            </mesh>
          ))
        )}
        <mesh position={[0, 0, 0]} material={mats.frameMetalDark}>
          <boxGeometry args={[3.2, 3.2, 3.2]} />
        </mesh>
      </group>

      {/* Architectural Stairs (x = -20) */}
      <group position={[-20, 0, 0]}>
        {Array.from({ length: 3 }).map((_, f) => (
          <group key={`stair-flight-${f}`} position={[0, f * 9, 0]}>
            {Array.from({ length: 9 }).map((_, step) => (
              <mesh key={`stair-step-${step}`} position={[0, step * 1, -2 + step * 0.45]} material={mats.pillarSteel}>
                <boxGeometry args={[2.8, 0.15, 0.5]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* ============================================================== */}
      {/* 🏢 3 FLOOR SLABS & CEILINGS                                    */}
      {/* ============================================================== */}
      {/* --- L1 GROUND SLAB (y = 0) --- */}
      <mesh position={[0, 0.08, 0]} receiveShadow material={mats.floorMarbleWhite}>
        <boxGeometry args={[48, 0.16, 36]} />
      </mesh>
      <mesh position={[0, -0.05, 0]} material={mats.spandrelFascia}>
        <boxGeometry args={[48.4, 0.35, 36.4]} />
      </mesh>
      {/* Drop Ceiling below Level 1 */}
      <group position={[0, 8.85, 0]}>
        <mesh material={mats.ceilingPanel}>
          <boxGeometry args={[47.6, 0.1, 35.6]} />
        </mesh>
        {[-14, -4, 4, 14].map((lx) =>
          [-8, 0, 8].map((lz) => (
            <mesh key={`dl1-${lx}-${lz}`} position={[lx, -0.06, lz]} material={mats.ceilingDownlight}>
              <cylinderGeometry args={[0.45, 0.45, 0.05, 16]} />
            </mesh>
          ))
        )}
      </group>

      {/* --- L2 MEGA TECH STUDIO SLAB (y = 9) --- */}
      <mesh position={[0, 8.95, 0]} receiveShadow material={mats.floorMarbleWhite}>
        <boxGeometry args={[48, 0.1, 36]} />
      </mesh>
      <mesh position={[0, 8.95, 0]} material={mats.spandrelFascia}>
        <boxGeometry args={[48.4, 0.35, 36.4]} />
      </mesh>
      {/* Front Safety Glass Railing */}
      <group position={[0, 9.45, 17.8]}>
        <mesh material={mats.railingGlass}>
          <boxGeometry args={[47.6, 0.9, 0.05]} />
        </mesh>
        <mesh position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.handrailChrome}>
          <cylinderGeometry args={[0.04, 0.04, 47.6, 8]} />
        </mesh>
      </group>
      {/* Drop Ceiling below Level 2 */}
      <group position={[0, 17.85, 0]}>
        <mesh material={mats.ceilingPanel}>
          <boxGeometry args={[47.6, 0.1, 35.6]} />
        </mesh>
        {[-14, -4, 4, 14].map((lx) =>
          [-8, 0, 8].map((lz) => (
            <mesh key={`dl2-${lx}-${lz}`} position={[lx, -0.06, lz]} material={mats.ceilingDownlight}>
              <cylinderGeometry args={[0.45, 0.45, 0.05, 16]} />
            </mesh>
          ))
        )}
      </group>

      {/* --- L3 PENTHOUSE & ROOFTOP HELIPAD SLAB (y = 18) --- */}
      {/* Penthouse Interior Slab (Silver Metallic, Left Wing) */}
      <mesh position={[-8, 17.95, 0]} receiveShadow material={mats.floorSilverCEO}>
        <boxGeometry args={[32, 0.1, 36]} />
      </mesh>
      {/* Helipad Exterior Concrete Slab (Right Wing) */}
      <mesh position={[16, 17.95, 0]} receiveShadow material={mats.floorHelipadConcrete}>
        <boxGeometry args={[16, 0.12, 36]} />
      </mesh>
      <mesh position={[0, 17.95, 0]} material={mats.spandrelFascia}>
        <boxGeometry args={[48.4, 0.35, 36.4]} />
      </mesh>
      {/* Front Safety Glass Railing */}
      <group position={[0, 18.45, 17.8]}>
        <mesh material={mats.railingGlass}>
          <boxGeometry args={[47.6, 0.9, 0.05]} />
        </mesh>
        <mesh position={[0, 0.48, 0]} rotation={[0, 0, Math.PI / 2]} material={mats.handrailChrome}>
          <cylinderGeometry args={[0.04, 0.04, 47.6, 8]} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 🏢 FLOOR 1 (Ground): GRAND LOBBY, SALES, CS & ESPRESSO CAFE   */}
      {/* ============================================================== */}
      <group position={[0, FLOOR_HEIGHTS.L1_GROUND, 0]}>
        {/* Reception & Security Post */}
        <group position={[0, 0, 10]}>
          <mesh position={[0, 0.6, 0]} material={mats.floorMarbleBlack}>
            <boxGeometry args={[5.5, 1.2, 1.8]} />
          </mesh>
          <mesh position={[0, 1.22, 0]} material={mats.trimGold}>
            <boxGeometry args={[5.7, 0.05, 1.9]} />
          </mesh>
          <mesh position={[-0.8, 1.5, 0.1]} material={mats.monitorOn}>
            <boxGeometry args={[0.7, 0.45, 0.05]} />
          </mesh>
        </group>

        {/* Satpam Pak Joko Post */}
        <group position={[10, 0, 12]}>
          <mesh position={[0, 0.5, 0]} material={mats.deskModern}>
            <boxGeometry args={[2.5, 1.0, 0.8]} />
          </mesh>
          <mesh position={[0, 1.3, -0.4]} material={mats.monitorOn}>
            <boxGeometry args={[2.4, 0.8, 0.1]} />
          </mesh>
        </group>

        {/* Espresso Bar & Pantry on Back Left */}
        <group position={[-16, 0, -14]}>
          <mesh position={[0, 0.6, 0]} material={mats.floorMarbleBlack}>
            <boxGeometry args={[6.5, 1.2, 1.6]} />
          </mesh>
          <mesh position={[-1.2, 1.5, 0]} material={mats.fridgeMetal}>
            <boxGeometry args={[1.4, 0.6, 0.8]} />
          </mesh>
          <mesh position={[3.5, 1.6, 0]} material={mats.frameMetalDark}>
            <boxGeometry args={[1.6, 3.2, 1.2]} />
          </mesh>
        </group>

        {/* World Client Map on Back Right Wall */}
        <group position={[12, 3.8, -17.4]}>
          <mesh material={mats.frameMetalDark}>
            <boxGeometry args={[14, 4.0, 0.1]} />
          </mesh>
          <mesh position={[0, 0, 0.06]} material={mats.serverLedCyan}>
            <planeGeometry args={[13.2, 3.4]} />
          </mesh>
        </group>

        {/* Round Meeting Cafe Table & Sofa in Lobby */}
        <RoundMeetingTable position={[0, 0, -2]} />
        <LoungeSofa position={[-12, 0, 12]} rotation={[0, Math.PI / 2, 0]} color={mats.sofaNavy} />

        {/* Dense Accessories: Bookshelves & Potted Plants */}
        <Bookshelf position={[-22, 0, -12]} rotation={[0, Math.PI / 2, 0]} />
        <Bookshelf position={[22, 0, -12]} rotation={[0, -Math.PI / 2, 0]} />
        <PottedPlant position={[-5, 0, 14]} />
        <PottedPlant position={[5, 0, 14]} />
        <PottedPlant position={[-16, 0, 8]} />
        <PottedPlant position={[16, 0, 8]} />
      </group>

      {/* ============================================================== */}
      {/* 💻 FLOOR 2 (Level 1): MEGA TECH, CREATIVE & DESIGN STUDIO      */}
      {/* ============================================================== */}
      <group position={[0, FLOOR_HEIGHTS.L2_STUDIO, 0]}>
        {/* Giant Sprint Kanban Whiteboard on Back Center Wall */}
        <group position={[0, 3.8, -17.4]}>
          <mesh material={mats.whiteboardFrame}>
            <boxGeometry args={[18, 4.2, 0.1]} />
          </mesh>
          <mesh position={[0, 0, 0.06]} material={mats.whiteboardBg}>
            <planeGeometry args={[17.2, 3.6]} />
          </mesh>
          {[-6, -4, -2, 0, 2, 4, 6].map((sx, idx) => (
            <mesh key={`stk-${idx}`} position={[sx, idx % 2 === 0 ? 0.6 : -0.6, 0.08]} material={idx % 2 === 0 ? mats.helipadYellow : mats.serverLedCyan}>
              <planeGeometry args={[1.1, 0.9]} />
            </mesh>
          ))}
        </group>

        {/* DevOps 8 High-Density Server Racks with Glowing LEDs (Right Wing) */}
        {[-14, -9, -4, 1].map((rz, idx) => (
          <group key={`srack-${idx}`} position={[20, 0, rz]}>
            <mesh position={[0, 2.0, 0]} material={mats.serverRack} castShadow>
              <boxGeometry args={[1.6, 4.0, 1.8]} />
            </mesh>
            <mesh position={[-0.75, 2.0, 0]} material={idx % 2 === 0 ? mats.serverLedCyan : mats.serverLedGreen}>
              <boxGeometry args={[0.08, 3.4, 1.4]} />
            </mesh>
          </group>
        ))}

        {/* Overhead Yellow Cable Management Trays */}
        {[-8, 8].map((tx) => (
          <mesh key={`ctray-${tx}`} position={[tx, 7.4, -4]} material={mats.cableTray}>
            <boxGeometry args={[1.2, 0.2, 24]} />
          </mesh>
        ))}

        {/* Art Gallery Canvas Posters on Left Wall */}
        {[-12, -4, 4].map((az, idx) => (
          <mesh key={`art-${idx}`} position={[-23.5, 3.8, az]} rotation={[0, Math.PI / 2, 0]} material={idx % 3 === 0 ? mats.artCanvas1 : idx % 3 === 1 ? mats.artCanvas2 : mats.artCanvas3}>
            <boxGeometry args={[3.0, 2.8, 0.08]} />
          </mesh>
        ))}

        {/* 2 Round Collaboration Scrum Tables */}
        <RoundMeetingTable position={[-10, 0, 3]} />
        <RoundMeetingTable position={[10, 0, 3]} />

        {/* Comfy Green Lounge Sofa (Inspired by Reference Image 2!) */}
        <LoungeSofa position={[0, 0, 4]} color={mats.sofaGreen} />

        {/* Dense Accessories: Bookshelves & Potted Plants Across the Studio */}
        <Bookshelf position={[-23.5, 0, -14]} rotation={[0, Math.PI / 2, 0]} />
        <Bookshelf position={[-18, 0, -17]} />
        <Bookshelf position={[18, 0, -17]} />
        <PottedPlant position={[-16, 0, -14]} />
        <PottedPlant position={[16, 0, -14]} />
        <PottedPlant position={[-6, 0, 4]} />
        <PottedPlant position={[6, 0, 4]} />
        <PottedPlant position={[-16, 0, 14]} />
        <PottedPlant position={[16, 0, 14]} />
      </group>

      {/* ============================================================== */}
      {/* 👑 FLOOR 3 (Level 2): EXECUTIVE PENTHOUSE & HELIPAD ROOFTOP    */}
      {/* ============================================================== */}
      <group position={[0, FLOOR_HEIGHTS.L3_PENTHOUSE, 0]}>
        {/* Rendy CEO Executive Suite (Left Wing) */}
        <group position={[-10, 0, -8]}>
          <mesh position={[0, 0.65, 0]} material={mats.deskExecutive} castShadow>
            <boxGeometry args={[4.8, 1.3, 2.2]} />
          </mesh>
          <mesh position={[0, 1.32, 0]} material={mats.trimGold}>
            <boxGeometry args={[5.0, 0.05, 2.4]} />
          </mesh>
          <mesh position={[0, 0.7, 1.4]} material={mats.chairLeatherChesterfield}>
            <boxGeometry args={[1.2, 1.4, 1.2]} />
          </mesh>
          {/* Trophy Display Bookcase */}
          <mesh position={[0, 3.2, -7.8]} material={mats.deskExecutive}>
            <boxGeometry args={[8.0, 3.6, 0.8]} />
          </mesh>
        </group>

        {/* Chesterfield Leather Guest Couch */}
        <LoungeSofa position={[-10, 0, 4]} color={mats.chairLeatherChesterfield} />

        {/* Luxury Billiard Table & PS5 Lounge */}
        <group position={[-18, 0, 8]}>
          <mesh position={[0, 0.75, 0]} material={mats.billiardCloth} receiveShadow>
            <boxGeometry args={[4.8, 0.25, 2.6]} />
          </mesh>
          <mesh position={[0, 0.75, 0]} material={mats.billiardWood}>
            <boxGeometry args={[5.2, 0.35, 3.0]} />
          </mesh>
        </group>

        {/* Putting Green Mini Golf with Red Flag */}
        <group position={[-4, 0, 8]}>
          <mesh position={[0, 0.02, 0]} receiveShadow material={mats.golfTurf}>
            <boxGeometry args={[6, 0.04, 8]} />
          </mesh>
          <mesh position={[1.5, 1.2, -1.5]} material={mats.golfPole}>
            <cylinderGeometry args={[0.03, 0.03, 2.4, 8]} />
          </mesh>
          <mesh position={[1.8, 2.1, -1.5]} material={mats.golfFlag}>
            <boxGeometry args={[0.6, 0.35, 0.02]} />
          </mesh>
        </group>

        {/* Penthouse Bookshelves & Potted Plants */}
        <Bookshelf position={[-23, 0, -6]} rotation={[0, Math.PI / 2, 0]} />
        <PottedPlant position={[-18, 0, -4]} />
        <PottedPlant position={[-2, 0, -4]} />
        <PottedPlant position={[-18, 0, 14]} />

        {/* --- Exterior Helipad Deck (Right Wing) --- */}
        <group position={[10, 0, 0]}>
          {/* Yellow Flat Aviation Landing Circle */}
          <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.helipadYellow}>
            <ringGeometry args={[5.8, 7.0, 64]} />
          </mesh>
          {/* Flat Bold "H" Aviation Marking in Center */}
          <Text
            position={[0, 0.07, 0]}
            fontSize={5.0}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            rotation={[-Math.PI / 2, 0, 0]}
          >
            H
          </Text>

          {/* Perimeter Blue Runway Beacon Lights */}
          {[-7, 0, 7].map((bx) =>
            [-8, 8].map((bz) => (
              <mesh key={`hbcn-${bx}-${bz}`} position={[bx, 0.15, bz]} material={mats.beaconLight}>
                <cylinderGeometry args={[0.2, 0.2, 0.3, 12]} />
              </mesh>
            ))
          )}

          {/* 3D Luxury Executive Helicopter Parked Realistically on Deck */}
          <ExecutiveHelicopter position={[0, 0.06, 0]} />
        </group>
      </group>

      {/* ============================================================== */}
      {/* 🧑‍💼 30 AGENTS SCANDINAVIAN WORKSTATIONS                         */}
      {/* ============================================================== */}
      {AGENT_REGISTRY_30.map((agent) => {
        // Skip custom static counters (Siti Reception, Pak Joko Security, Rendy CEO Desk)
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
