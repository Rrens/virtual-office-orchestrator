'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  position?: [number, number, number];
  virtualHours?: number;
  virtualMinutes?: number;
}

export function ExecutiveHelicopter({ position = [0, 0, 0], virtualHours = 12, virtualMinutes = 0 }: Props) {
  const rootGroupRef = useRef<THREE.Group>(null);
  const mainRotorRef = useRef<THREE.Group>(null);
  const tailRotorRef = useRef<THREE.Group>(null);
  const beaconRef = useRef<THREE.PointLight>(null);

  // Time-in-minutes of the virtual day (0..1440)
  const currentVirtualMinutes = virtualHours * 60 + virtualMinutes;
  // Landing window: 07:30 (450m) to 08:00 (480m)
  // Parked window: 08:00 (480m) to 17:00 (1020m)
  // Takeoff window: 17:00 (1020m) to 17:30 (1050m)
  // Away window: 17:30 to 07:30 next morning

  useFrame((state, delta) => {
    const isAway = currentVirtualMinutes < 450 || currentVirtualMinutes > 1050;
    const isLanding = currentVirtualMinutes >= 450 && currentVirtualMinutes < 480;
    const isParked = currentVirtualMinutes >= 480 && currentVirtualMinutes <= 1020;
    const isTakingOff = currentVirtualMinutes > 1020 && currentVirtualMinutes <= 1050;

    if (rootGroupRef.current) {
      if (isAway) {
        rootGroupRef.current.position.set(0, -999, 0); // Hide completely
        rootGroupRef.current.visible = false;
        return;
      }

      rootGroupRef.current.visible = true;

      if (isParked) {
        // Firmly grounded on helipad
        rootGroupRef.current.position.set(position[0], position[1], position[2]);
        rootGroupRef.current.rotation.set(0, 0, 0);
      } else if (isLanding) {
        // Inbound flight from distance + descent
        const progress = (currentVirtualMinutes - 450) / 30; // 0 to 1
        const invProgress = 1 - progress;
        const flightX = position[0] + invProgress * 40;
        const flightY = position[1] + invProgress * 25 + Math.sin(state.clock.getElapsedTime() * 2) * 0.3;
        const flightZ = position[2] + invProgress * 30;
        rootGroupRef.current.position.set(flightX, flightY, flightZ);
        rootGroupRef.current.rotation.set(invProgress * 0.1, 0, -invProgress * 0.08);
      } else if (isTakingOff) {
        // Outbound ascent and bank away
        const progress = (currentVirtualMinutes - 1020) / 30; // 0 to 1
        const flightX = position[0] - progress * 45;
        const flightY = position[1] + progress * 30 + Math.sin(state.clock.getElapsedTime() * 2) * 0.3;
        const flightZ = position[2] - progress * 35;
        rootGroupRef.current.position.set(flightX, flightY, flightZ);
        rootGroupRef.current.rotation.set(progress * 0.15, 0.4, progress * 0.12);
      }
    }

    // Rotor spinning speed based on flight status
    const rotorSpeed = isParked ? 3 : 25;
    if (mainRotorRef.current) {
      mainRotorRef.current.rotation.y += delta * rotorSpeed;
    }
    if (tailRotorRef.current) {
      tailRotorRef.current.rotation.x += delta * (rotorSpeed * 1.5);
    }
    // Pulsing strobe aviation beacon on tail
    if (beaconRef.current) {
      const t = state.clock.getElapsedTime();
      beaconRef.current.intensity = Math.sin(t * 8) > 0.7 ? 2.5 : 0.2;
    }
  });

  return (
    <group ref={rootGroupRef} position={position}>
      {/* ============================================================== */}
      {/* 🚁 1. LANDING SKIDS (Pipa Penyangga Pendaratan)                */}
      {/* ============================================================== */}
      {/* Left Skid */}
      <mesh position={[-1.3, 0.15, 0]}>
        <boxGeometry args={[0.12, 0.1, 4.8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Left Skid Curved Tips */}
      <mesh position={[-1.3, 0.35, 2.45]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Left Skid Struts */}
      <mesh position={[-0.9, 0.65, 0.8]} rotation={[0, 0, -0.45]}>
        <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.9, 0.65, -0.8]} rotation={[0, 0, -0.45]}>
        <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Right Skid */}
      <mesh position={[1.3, 0.15, 0]}>
        <boxGeometry args={[0.12, 0.1, 4.8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Right Skid Curved Tips */}
      <mesh position={[1.3, 0.35, 2.45]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Right Skid Struts */}
      <mesh position={[0.9, 0.65, 0.8]} rotation={[0, 0, 0.45]}>
        <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.9, 0.65, -0.8]} rotation={[0, 0, 0.45]}>
        <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ============================================================== */}
      {/* 🚁 2. FUSELAGE / CABIN BODY (Metallic Obsidian & Gold Stripe)  */}
      {/* ============================================================== */}
      <group position={[0, 1.45, 0.2]}>
        {/* Main Cabin Core */}
        <mesh>
          <boxGeometry args={[2.2, 1.6, 3.4]} />
          <meshStandardMaterial color="#090d16" metalness={0.65} roughness={0.25} />
        </mesh>

        {/* Aerodynamic Rounded Nose */}
        <mesh position={[0, -0.15, 1.8]} rotation={[0.25, 0, 0]}>
          <boxGeometry args={[2.0, 1.2, 0.9]} />
          <meshStandardMaterial color="#090d16" metalness={0.65} roughness={0.25} />
        </mesh>

        {/* Executive Gold Accent Belt Trim */}
        <mesh position={[0, -0.1, 0]}>
          <boxGeometry args={[2.24, 0.12, 3.44]} />
          <meshStandardMaterial color="#facc15" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Cockpit Windshield (Tinted Cyan Architectural Glass) */}
        <mesh position={[0, 0.35, 1.6]} rotation={[-0.32, 0, 0]}>
          <boxGeometry args={[1.9, 0.85, 0.5]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.5} roughness={0.05} metalness={0.4} />
        </mesh>

        {/* Side Passenger Windows */}
        <mesh position={[-1.12, 0.2, 0]}>
          <boxGeometry args={[0.05, 0.65, 2.2]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.4} roughness={0.05} />
        </mesh>
        <mesh position={[1.12, 0.2, 0]}>
          <boxGeometry args={[0.05, 0.65, 2.2]} />
          <meshStandardMaterial color="#38bdf8" transparent opacity={0.4} roughness={0.05} />
        </mesh>

        {/* Engine Doghouse Cowling Top */}
        <mesh position={[0, 0.95, -0.3]}>
          <boxGeometry args={[1.4, 0.55, 2.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Exhaust Pipes */}
        <mesh position={[-0.65, 0.9, -1.2]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.6, 12]} />
          <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.65, 0.9, -1.2]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.6, 12]} />
          <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 🚁 3. TAIL BOOM, VERTICAL FIN & HORIZONTAL STABILIZER          */}
      {/* ============================================================== */}
      {/* Tapered Boom */}
      <mesh position={[0, 1.6, -3.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.55, 3.6, 12]} />
        <meshStandardMaterial color="#090d16" metalness={0.65} roughness={0.25} />
      </mesh>
      {/* Gold Trim on Boom */}
      <mesh position={[0, 1.6, -3.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.31, 0.33, 0.3, 12]} />
        <meshStandardMaterial color="#facc15" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Vertical Tail Fin */}
      <mesh position={[0, 2.45, -5.0]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.15, 1.8, 0.8]} />
        <meshStandardMaterial color="#090d16" metalness={0.65} roughness={0.25} />
      </mesh>

      {/* Horizontal Stabilizer Wings */}
      <mesh position={[0, 2.0, -4.6]}>
        <boxGeometry args={[2.0, 0.08, 0.5]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* ============================================================== */}
      {/* 🚁 4. MAIN ROTOR (Poros & 4 Bilah Berputar Halus)               */}
      {/* ============================================================== */}
      <group position={[0, 2.75, -0.1]}>
        {/* Rotor Mast Shaft */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.45, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Spinning Blades Assembly */}
        <group ref={mainRotorRef}>
          {/* Central Hub */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.18, 16]} />
            <meshStandardMaterial color="#020617" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* 4 Carbon Fiber Aerodynamic Blades */}
          {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
            <group key={`blade-${i}`} rotation={[0, angle, 0]} position={[0, 0.35, 0]}>
              <mesh position={[0, 0, 3.2]} rotation={[0.08, 0, 0]}>
                <boxGeometry args={[0.26, 0.03, 5.8]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
              </mesh>
              {/* High-visibility yellow safety tip */}
              <mesh position={[0, 0, 6.0]}>
                <boxGeometry args={[0.27, 0.035, 0.4]} />
                <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* ============================================================== */}
      {/* 🚁 5. TAIL ROTOR (Baling-Baling Ekor Berputar)                 */}
      {/* ============================================================== */}
      <group position={[0.18, 2.8, -5.2]} ref={tailRotorRef}>
        {/* Tail Hub */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.15, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        {/* Tail 2 Blades */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.02, 0.9, 0.12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <boxGeometry args={[0.02, 0.9, 0.12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 💡 6. AVIATION NAVIGATION & STROBE BEACON LIGHTS               */}
      {/* ============================================================== */}
      {/* Port Red Nav Light (Left) */}
      <mesh position={[-1.2, 1.45, 0.5]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2.5} />
      </mesh>
      <pointLight position={[-1.25, 1.45, 0.5]} color="#ef4444" intensity={0.6} distance={3} />

      {/* Starboard Green Nav Light (Right) */}
      <mesh position={[1.2, 1.45, 0.5]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2.5} />
      </mesh>
      <pointLight position={[1.25, 1.45, 0.5]} color="#22c55e" intensity={0.6} distance={3} />

      {/* White Flashing Strobe Beacon on Tail Fin */}
      <mesh position={[0, 3.4, -4.9]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.5} />
      </mesh>
      <pointLight ref={beaconRef} position={[0, 3.45, -4.9]} color="#ffffff" intensity={1.5} distance={6} />
    </group>
  );
}
