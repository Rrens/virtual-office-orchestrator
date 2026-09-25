'use client';

import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { DEPT_THEMES, AGENT_REGISTRY_30 } from './OfficeWaypoints';

export function OfficeEnvironment() {
  const mats = useMemo(() => ({
    floorBase: new THREE.MeshStandardMaterial({ color: '#cfc6b8', roughness: 0.5 }),
    wallMain: new THREE.MeshStandardMaterial({ color: '#e8e2d8', roughness: 0.8 }),
    wallPartition: new THREE.MeshStandardMaterial({ color: '#d8cfc0', roughness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: '#87ceeb', opacity: 0.35, transparent: true, roughness: 0.1 }),
    woodDesk: new THREE.MeshStandardMaterial({ color: '#8c6843', roughness: 0.4 }),
    metalLeg: new THREE.MeshStandardMaterial({ color: '#2b2a28', roughness: 0.3 }),
    leatherChair: new THREE.MeshStandardMaterial({ color: '#3a3834', roughness: 0.5 }),
    monitorOff: new THREE.MeshStandardMaterial({ color: '#1a1917', roughness: 0.2 }),
    monitorOn: new THREE.MeshStandardMaterial({ color: '#0a1628', emissive: '#2255cc', emissiveIntensity: 0.6 }),
    serverRack: new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.4 }),
    serverLed: new THREE.MeshStandardMaterial({ color: '#10b981', emissive: '#10b981', emissiveIntensity: 0.8 }),
    billiardCloth: new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.7 }),
    billiardWood: new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.3 }),
    billiardBallWhite: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
    billiardBallRed: new THREE.MeshStandardMaterial({ color: '#dc2626' }),
    billiardBallBlack: new THREE.MeshStandardMaterial({ color: '#171717' }),
    billiardBallYellow: new THREE.MeshStandardMaterial({ color: '#facc15' }),
    couchSage: new THREE.MeshStandardMaterial({ color: '#7a8f7b', roughness: 0.8 }),
    pianoBody: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.2 }),
    pianoKeys: new THREE.MeshStandardMaterial({ color: '#f8fafc' }),
    drumCymbal: new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.8, roughness: 0.2 }),
    drumBody: new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.3 }),
    guitarBody: new THREE.MeshStandardMaterial({ color: '#d9772f', roughness: 0.4 }),
    ampMetal: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 }),
    plantPot: new THREE.MeshStandardMaterial({ color: '#e6ded4', roughness: 0.7 }),
    plantLeaf: new THREE.MeshStandardMaterial({ color: '#3b7a57', roughness: 0.6 }),
    whiteboard: new THREE.MeshStandardMaterial({ color: '#fcfcfc', roughness: 0.15 }),
    neonSign: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#38bdf8', emissiveIntensity: 0.8 }),
  }), []);

  return (
    <group>
      {/* Mega Floor (60x45) */}
      <mesh position={[0, -0.05, 0]} receiveShadow material={mats.floorBase}>
        <boxGeometry args={[60, 0.1, 45]} />
      </mesh>

      {/* Outer Walls */}
      {/* Back Wall */}
      <mesh position={[0, 4, -22.5]} material={mats.wallMain}>
        <boxGeometry args={[60, 8, 0.4]} />
      </mesh>
      {/* Front Wall */}
      <mesh position={[0, 4, 22.5]} material={mats.wallMain}>
        <boxGeometry args={[60, 8, 0.4]} />
      </mesh>
      {/* Left Wall */}
      <mesh position={[-30, 4, 0]} material={mats.wallMain}>
        <boxGeometry args={[0.4, 8, 45]} />
      </mesh>
      {/* Right Wall */}
      <mesh position={[30, 4, 0]} material={mats.wallMain}>
        <boxGeometry args={[0.4, 8, 45]} />
      </mesh>

      {/* Internal Department Dividers (half walls z=-10, z=2, z=12) */}
      <mesh position={[0, 1.2, -10]} material={mats.wallPartition}>
        <boxGeometry args={[56, 2.4, 0.2]} />
      </mesh>
      <mesh position={[0, 1.2, 3]} material={mats.wallPartition}>
        <boxGeometry args={[56, 2.4, 0.2]} />
      </mesh>
      <mesh position={[0, 1.2, 11]} material={mats.wallPartition}>
        <boxGeometry args={[56, 2.4, 0.2]} />
      </mesh>

      {/* Vertical Dividers */}
      <mesh position={[-11, 1.2, -16]} material={mats.wallPartition}>
        <boxGeometry args={[0.2, 2.4, 12]} />
      </mesh>
      <mesh position={[7, 1.2, -16]} material={mats.wallPartition}>
        <boxGeometry args={[0.2, 2.4, 12]} />
      </mesh>
      <mesh position={[3, 1.2, -3.5]} material={mats.wallPartition}>
        <boxGeometry args={[0.2, 2.4, 13]} />
      </mesh>
      <mesh position={[-7, 1.2, 7]} material={mats.wallPartition}>
        <boxGeometry args={[0.2, 2.4, 8]} />
      </mesh>
      <mesh position={[3, 1.2, 7]} material={mats.wallPartition}>
        <boxGeometry args={[0.2, 2.4, 8]} />
      </mesh>

      {/* Department Room Signs */}
      <Text position={[-16, 3.2, -21.8]} fontSize={0.7} color="#1e3a5f" anchorX="center">
        👔 EXECUTIVE SUITE
      </Text>
      <Text position={[-2, 3.2, -21.8]} fontSize={0.7} color="#5b3d8a" anchorX="center">
        🎯 PRODUCT STUDIO
      </Text>
      <Text position={[14, 3.2, -21.8]} fontSize={0.7} color="#c76b2f" anchorX="center">
        🎨 DESIGN STUDIO
      </Text>
      <Text position={[-10, 3.2, -9.8]} fontSize={0.9} color="#1a5c42" anchorX="center">
        💻 ENGINEERING LAB
      </Text>
      <Text position={[14, 3.2, -9.8]} fontSize={0.8} color="#1a6b3c" anchorX="center">
        📈 GROWTH & MARKETING
      </Text>
      <Text position={[-14, 3.2, 3.2]} fontSize={0.7} color="#8b1a1a" anchorX="center">
        💼 SALES FLOOR
      </Text>
      <Text position={[-2, 3.2, 3.2]} fontSize={0.7} color="#1a4a8b" anchorX="center">
        🎧 CUSTOMER SUPPORT
      </Text>
      <Text position={[12, 3.2, 3.2]} fontSize={0.7} color="#4a3a8b" anchorX="center">
        📊 DATA & OPERATIONS
      </Text>
      <Text position={[0, 3.2, 11.2]} fontSize={0.9} color="#b45309" anchorX="center">
        ☕ LOUNGE, MUSIC & BILLIARD CLUB 🎱
      </Text>

      {/* All 30 Desks & Workstations */}
      {AGENT_REGISTRY_30.map((agent, i) => (
        <group key={i} position={agent.pos}>
          {/* Wood Table */}
          <mesh position={[0, 0.72, 0]} material={mats.woodDesk} castShadow>
            <boxGeometry args={[1.5, 0.05, 0.8]} />
          </mesh>
          {/* Table Legs */}
          {[[-0.65, -0.3], [0.65, -0.3], [-0.65, 0.3], [0.65, 0.3]].map(([lx, lz], li) => (
            <mesh key={li} position={[lx, 0.35, lz]} material={mats.metalLeg}>
              <cylinderGeometry args={[0.025, 0.025, 0.7, 8]} />
            </mesh>
          ))}
          {/* Monitor */}
          <mesh position={[0, 1.05, -0.25]} material={mats.monitorOn}>
            <boxGeometry args={[0.55, 0.35, 0.04]} />
          </mesh>
          <mesh position={[0, 0.82, -0.25]} material={mats.metalLeg}>
            <cylinderGeometry args={[0.02, 0.03, 0.15, 8]} />
          </mesh>
          {/* Chair */}
          <mesh position={[0, 0.45, 0.6]} material={mats.leatherChair}>
            <boxGeometry args={[0.45, 0.06, 0.45]} />
          </mesh>
          <mesh position={[0, 0.8, 0.8]} material={mats.leatherChair}>
            <boxGeometry args={[0.45, 0.5, 0.06]} />
          </mesh>
        </group>
      ))}

      {/* ==================================================== */}
      {/* RECREATION ZONE: BILLIARD TABLE AREA */}
      {/* ==================================================== */}
      <group position={[-4, 0, 16]}>
        {/* Billiard Table Outer Wood Rim */}
        <mesh position={[0, 0.75, 0]} material={mats.billiardWood}>
          <boxGeometry args={[3.4, 0.2, 2.0]} />
        </mesh>
        {/* Green Felt Surface */}
        <mesh position={[0, 0.86, 0]} material={mats.billiardCloth}>
          <boxGeometry args={[3.0, 0.04, 1.6]} />
        </mesh>
        {/* 4 Sturdy Legs */}
        {[[-1.4, -0.7], [1.4, -0.7], [-1.4, 0.7], [1.4, 0.7]].map(([bx, bz], bi) => (
          <mesh key={bi} position={[bx, 0.38, bz]} material={mats.billiardWood}>
            <cylinderGeometry args={[0.1, 0.1, 0.75, 12]} />
          </mesh>
        ))}
        {/* Billiard Balls */}
        <mesh position={[-0.6, 0.92, 0]} material={mats.billiardBallWhite}>
          <sphereGeometry args={[0.04, 12, 12]} />
        </mesh>
        <mesh position={[0.5, 0.92, 0]} material={mats.billiardBallRed}>
          <sphereGeometry args={[0.04, 12, 12]} />
        </mesh>
        <mesh position={[0.6, 0.92, 0.08]} material={mats.billiardBallYellow}>
          <sphereGeometry args={[0.04, 12, 12]} />
        </mesh>
        <mesh position={[0.6, 0.92, -0.08]} material={mats.billiardBallBlack}>
          <sphereGeometry args={[0.04, 12, 12]} />
        </mesh>
        {/* Billiard Overhead Lamp */}
        <mesh position={[0, 3.2, 0]} material={mats.billiardCloth}>
          <boxGeometry args={[1.8, 0.15, 0.4]} />
        </mesh>
        <pointLight position={[0, 2.8, 0]} intensity={1.5} color="#fef08a" distance={5} />
      </group>

      {/* ==================================================== */}
      {/* RECREATION ZONE: MUSIC STUDIO (Gitar, Piano, Drum) */}
      {/* ==================================================== */}
      <group position={[8, 0, 16]}>
        {/* Acoustic carpet */}
        <mesh position={[0, 0.01, 0]} material={mats.floorBase}>
          <boxGeometry args={[10, 0.02, 6]} />
        </mesh>

        {/* DRUM SET */}
        <group position={[-2, 0, 1]}>
          {/* Bass Drum */}
          <mesh position={[0, 0.5, 0]} material={mats.drumBody} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.4, 18]} />
          </mesh>
          {/* Snare Drum */}
          <mesh position={[-0.45, 0.65, 0.2]} material={mats.drumBody}>
            <cylinderGeometry args={[0.22, 0.22, 0.15, 14]} />
          </mesh>
          {/* Cymbals */}
          <mesh position={[0.5, 1.2, 0.1]} material={mats.drumCymbal}>
            <cylinderGeometry args={[0.3, 0.3, 0.015, 16]} />
          </mesh>
          <mesh position={[-0.5, 1.1, -0.2]} material={mats.drumCymbal}>
            <cylinderGeometry args={[0.25, 0.25, 0.015, 16]} />
          </mesh>
        </group>

        {/* PIANO / SYNTHESIZER */}
        <group position={[3, 0, 0]}>
          <mesh position={[0, 0.75, 0]} material={mats.pianoBody}>
            <boxGeometry args={[2.0, 0.2, 0.6]} />
          </mesh>
          {/* White keys */}
          <mesh position={[0, 0.86, 0.1]} material={mats.pianoKeys}>
            <boxGeometry args={[1.8, 0.02, 0.25]} />
          </mesh>
          {/* 2 Piano Stand Legs */}
          <mesh position={[-0.8, 0.38, 0]} material={mats.metalLeg}>
            <boxGeometry args={[0.08, 0.75, 0.5]} />
          </mesh>
          <mesh position={[0.8, 0.38, 0]} material={mats.metalLeg}>
            <boxGeometry args={[0.08, 0.75, 0.5]} />
          </mesh>
          {/* Piano Bench */}
          <mesh position={[0, 0.45, 0.7]} material={mats.leatherChair}>
            <boxGeometry args={[0.8, 0.08, 0.35]} />
          </mesh>
        </group>

        {/* ELECTRIC GUITAR ON STAND */}
        <group position={[-0.5, 0, -1]}>
          {/* Amplifier */}
          <mesh position={[0, 0.35, 0]} material={mats.ampMetal}>
            <boxGeometry args={[0.6, 0.7, 0.4]} />
          </mesh>
          {/* Guitar body */}
          <mesh position={[0.5, 0.5, 0]} material={mats.guitarBody} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.25, 0.5, 0.06]} />
          </mesh>
          {/* Guitar neck */}
          <mesh position={[0.55, 0.9, 0]} material={mats.woodDesk} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.05, 0.5, 0.04]} />
          </mesh>
        </group>
      </group>

      {/* ==================================================== */}
      {/* COFFEE BAR & WATER COOLER */}
      {/* ==================================================== */}
      <group position={[-14, 0, 16]}>
        {/* Coffee Counter */}
        <mesh position={[0, 0.5, 0]} material={mats.woodDesk}>
          <boxGeometry args={[3.5, 1.0, 1.0]} />
        </mesh>
        {/* Espresso Machine */}
        <mesh position={[-0.8, 1.25, 0]} material={mats.serverRack}>
          <boxGeometry args={[0.6, 0.5, 0.5]} />
        </mesh>
        {/* Water Cooler Dispenser */}
        <group position={[2.5, 0, 0]}>
          <mesh position={[0, 0.6, 0]} material={mats.wallPartition}>
            <cylinderGeometry args={[0.25, 0.25, 1.2, 16]} />
          </mesh>
          {/* Blue Water Gallon */}
          <mesh position={[0, 1.5, 0]} material={mats.glass}>
            <cylinderGeometry args={[0.24, 0.24, 0.6, 16]} />
          </mesh>
        </group>
      </group>

      {/* ==================================================== */}
      {/* PS5 GAMING LOUNGE */}
      {/* ==================================================== */}
      <group position={[17, 0, 15]}>
        {/* Sage Couch */}
        <mesh position={[0, 0.35, 0]} material={mats.couchSage}>
          <boxGeometry args={[3.2, 0.4, 1.0]} />
        </mesh>
        <mesh position={[0, 0.8, -0.45]} material={mats.couchSage}>
          <boxGeometry args={[3.2, 0.6, 0.2]} />
        </mesh>
        {/* Big TV Screen on wall */}
        <mesh position={[0, 2.2, 2.8]} material={mats.monitorOff}>
          <boxGeometry args={[3.0, 1.6, 0.1]} />
        </mesh>
        <mesh position={[0, 2.2, 2.74]} material={mats.monitorOn}>
          <planeGeometry args={[2.8, 1.4]} />
        </mesh>
      </group>

      {/* ==================================================== */}
      {/* SERVER RACKS (Engineering Lab) */}
      {/* ==================================================== */}
      {[-20, -17, -14].map((rx, ri) => (
        <group key={ri} position={[rx, 0, 1]}>
          <mesh position={[0, 1.4, 0]} material={mats.serverRack}>
            <boxGeometry args={[0.8, 2.8, 0.8]} />
          </mesh>
          {[0.4, 0.9, 1.4, 1.9, 2.4].map((ly, li) => (
            <mesh key={li} position={[0, ly, 0.41]} material={mats.serverLed}>
              <boxGeometry args={[0.6, 0.05, 0.02]} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ==================================================== */}
      {/* WHITEBOARDS & PRESENTATION BOARDS */}
      {/* ==================================================== */}
      {/* Engineering Kanban */}
      <mesh position={[-6, 2.5, -9.8]} material={mats.whiteboard}>
        <boxGeometry args={[6.0, 2.2, 0.05]} />
      </mesh>
      {/* Marketing Sprint Board */}
      <mesh position={[14, 2.5, -9.8]} material={mats.whiteboard}>
        <boxGeometry args={[5.0, 2.0, 0.05]} />
      </mesh>
    </group>
  );
}
