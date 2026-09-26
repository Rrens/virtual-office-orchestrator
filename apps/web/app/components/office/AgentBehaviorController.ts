import { AGENT_REGISTRY_30, OFFICE_WAYPOINTS, FLOOR_HEIGHTS } from './OfficeWaypoints';

export type BehaviorState =
  | 'working'
  | 'typing'
  | 'thinking'
  | 'coffee_break'
  | 'gaming_ps5'
  | 'playing_billiard'
  | 'playing_guitar'
  | 'playing_piano'
  | 'playing_drums'
  | 'chatting'
  | 'pacing'
  | 'walking'
  | 'meeting'
  | 'error'
  | 'success'
  | 'idle';

export interface AgentBehavior {
  id: string;
  role: string;
  name: string;
  title: string;
  department: string;
  state: BehaviorState;
  targetPos: [number, number, number];
  currentPos: [number, number, number];
  facingTarget?: [number, number, number];
  message?: string;
  chatPartner?: string;
  idleTimer: number;
}

export interface GlobalElevatorState {
  currentY: number;
  targetY: number;
  doorOpenProgress: number; // 0 (closed) to 1 (fully open)
  state:
    | 'idle'
    | 'calling'
    | 'opening_for_entry'
    | 'ceo_entering'
    | 'closing_for_transit'
    | 'transit'
    | 'opening_for_exit'
    | 'ceo_exiting'
    | 'closing_after_exit';
  timer: number;
}

export const globalElevatorState: GlobalElevatorState = {
  currentY: FLOOR_HEIGHTS.L3_PENTHOUSE, // Starts on CEO Penthouse floor
  targetY: FLOOR_HEIGHTS.L3_PENTHOUSE,
  doorOpenProgress: 0,
  state: 'idle',
  timer: 0,
};

const IDLE_TIMEOUT_MIN = 45;
const IDLE_TIMEOUT_MAX = 95;

const BREAK_ACTIVITIES: BehaviorState[] = [
  'pacing',
  'chatting',
  'coffee_break',
  'gaming_ps5',
  'playing_billiard',
];

// Weighted distribution: 40% pacing at desk, 30% chatting with peer, 18% coffee break, 6% PS5, 6% Billiard
const BREAK_WEIGHTS = [0.4, 0.3, 0.18, 0.06, 0.06];

function weightedRandom(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

const DESK_MAP = new Map<string, [number, number, number]>();
AGENT_REGISTRY_30.forEach((a) => DESK_MAP.set(a.role, a.pos));

export function getHomeDeskByRole(role: string): [number, number, number] {
  return DESK_MAP.get(role) ?? [0, 0, 0];
}

export function resolveTargetForState(
  role: string,
  state: BehaviorState,
  chatPartnerRole?: string
): [number, number, number] {
  if (role === 'security-guard') return OFFICE_WAYPOINTS.SECURITY_POST;
  if (role === 'receptionist') return OFFICE_WAYPOINTS.RECEPTION_DESK;

  const roleIdx = Math.max(0, AGENT_REGISTRY_30.findIndex((a) => a.role === role));
  const offsetX = ((roleIdx % 5) - 2) * 1.5;
  const offsetZ = ((Math.floor(roleIdx / 5) % 3) - 1) * 1.2;

  switch (state) {
    case 'working':
    case 'typing':
    case 'thinking':
    case 'idle':
    case 'success':
    case 'error':
      return getHomeDeskByRole(role);

    case 'coffee_break':
      return [
        (OFFICE_WAYPOINTS.COFFEE_BAR?.[0] ?? -16) + offsetX * 0.8,
        OFFICE_WAYPOINTS.COFFEE_BAR?.[1] ?? 0,
        (OFFICE_WAYPOINTS.COFFEE_BAR?.[2] ?? -14) + offsetZ * 0.8,
      ];

    case 'gaming_ps5':
    case 'playing_guitar':
    case 'playing_piano':
    case 'playing_drums':
      return [
        (OFFICE_WAYPOINTS.PS5_LOUNGE?.[0] ?? -4) + offsetX,
        OFFICE_WAYPOINTS.PS5_LOUNGE?.[1] ?? 18,
        (OFFICE_WAYPOINTS.PS5_LOUNGE?.[2] ?? 6) + offsetZ,
      ];

    case 'playing_billiard':
      return [
        (OFFICE_WAYPOINTS.BILLIARD_TABLE?.[0] ?? -10) + (roleIdx % 2 === 0 ? -1.5 : 1.5),
        OFFICE_WAYPOINTS.BILLIARD_TABLE?.[1] ?? 18,
        (OFFICE_WAYPOINTS.BILLIARD_TABLE?.[2] ?? 6) + offsetZ * 0.5,
      ];

    case 'chatting':
      if (chatPartnerRole) {
        const partnerHome = getHomeDeskByRole(chatPartnerRole);
        return [partnerHome[0] + 1.2, partnerHome[1], partnerHome[2] + 0.8];
      }
      return [
        (OFFICE_WAYPOINTS.WATER_COOLER?.[0] ?? 16) + offsetX * 0.6,
        OFFICE_WAYPOINTS.WATER_COOLER?.[1] ?? 0,
        (OFFICE_WAYPOINTS.WATER_COOLER?.[2] ?? -14) + offsetZ * 0.6,
      ];

    case 'pacing': {
      const home = getHomeDeskByRole(role);
      const dx = (Math.random() - 0.5) * 4;
      const dz = (Math.random() - 0.5) * 3;
      return [home[0] + dx, home[1], home[2] + dz] as [number, number, number];
    }

    case 'meeting':
      return [
        (OFFICE_WAYPOINTS.MEETING_ROUND_1?.[0] ?? -10) + offsetX,
        OFFICE_WAYPOINTS.MEETING_ROUND_1?.[1] ?? 9,
        (OFFICE_WAYPOINTS.MEETING_ROUND_1?.[2] ?? 3) + offsetZ,
      ];

    default:
      return getHomeDeskByRole(role);
  }
}

export function pickBreakActivity(role: string, allRoles: string[]): {
  state: BehaviorState;
  chatPartner?: string;
  message: string;
} {
  const chosenIndex = weightedRandom(BREAK_WEIGHTS);
  const state = BREAK_ACTIVITIES[chosenIndex];

  switch (state) {
    case 'coffee_break':
      return { state, message: 'Ngopi ke Cafe Pantry ☕' };

    case 'gaming_ps5':
      return { state, message: 'Main PS5 di Lounge 🎮' };

    case 'playing_billiard':
      return { state, message: 'Main Billiard di Sky Lounge 🎱' };

    case 'playing_guitar':
      return { state, message: 'Jamming gitar di Music Studio 🎸' };

    case 'playing_piano':
      return { state, message: 'Main piano di Music Studio 🎹' };

    case 'playing_drums':
      return { state, message: 'Main drum di Music Studio 🥁' };

    case 'chatting': {
      const myHome = getHomeDeskByRole(role);
      const peers = allRoles.filter((r) => {
        if (r === role || r === 'security-guard' || r === 'receptionist') return false;
        const pHome = getHomeDeskByRole(r);
        return Math.abs(pHome[1] - myHome[1]) < 0.5; // same floor
      });
      const partner = peers.length > 0 ? peers[Math.floor(Math.random() * peers.length)] : undefined;
      return { state, chatPartner: partner, message: 'Diskusi dengan rekan tim 💬' };
    }

    case 'pacing':
    default:
      return { state: 'pacing', message: 'Stretching & jalan santai 🚶' };
  }
}

export function initBehaviors30(): Record<string, AgentBehavior> {
  const result: Record<string, AgentBehavior> = {};

  AGENT_REGISTRY_30.forEach((a) => {
    result[a.role] = {
      id: a.role,
      role: a.role,
      name: a.name,
      title: a.title,
      department: a.dept,
      state: 'idle',
      targetPos: [...a.pos],
      currentPos: [...a.pos],
      idleTimer: IDLE_TIMEOUT_MIN + Math.random() * (IDLE_TIMEOUT_MAX - IDLE_TIMEOUT_MIN),
      message: '',
    };
  });

  return result;
}

export function tickBehaviors30(
  behaviors: Record<string, AgentBehavior>,
  delta: number
): Record<string, AgentBehavior> {
  const next: Record<string, AgentBehavior> = {};
  const roles = Object.keys(behaviors);

  roles.forEach((role) => {
    const b = { ...behaviors[role] };

    // Static lobby staff
    if (role === 'security-guard') {
      b.state = 'idle';
      b.message = 'Menjaga Keamanan Gedung 🛡️';
      b.targetPos = OFFICE_WAYPOINTS.SECURITY_POST;
      b.currentPos = OFFICE_WAYPOINTS.SECURITY_POST;
      next[role] = b;
      return;
    }

    if (role === 'receptionist') {
      b.state = 'idle';
      b.message = 'Menyambut Tamu di Lobby 👋';
      b.targetPos = OFFICE_WAYPOINTS.RECEPTION_DESK;
      b.currentPos = OFFICE_WAYPOINTS.RECEPTION_DESK;
      next[role] = b;
      return;
    }

    // Defensive fallback
    if (!b.targetPos || !Array.isArray(b.targetPos) || typeof b.targetPos[1] !== 'number') {
      b.targetPos = getHomeDeskByRole(role);
    }
    if (!b.currentPos || !Array.isArray(b.currentPos) || typeof b.currentPos[1] !== 'number') {
      b.currentPos = [...b.targetPos];
    }

    const currentY = b.currentPos[1];
    const targetY = b.targetPos[1];
    const isDifferentFloor = Math.abs(currentY - targetY) > 0.5;
    const speed = 1.6;

    // =========================================================================
    // 🛗 SPECIAL LOGIC: CEO RENDY USES EXCLUSIVE VIP GLASS ELEVATOR
    // =========================================================================
    if (role === 'orchestrator' && isDifferentFloor) {
      const currentFloorY = Math.round(currentY / 9) * 9;
      const targetFloorY = Math.round(targetY / 9) * 9;

      const elevatorWaitingX = 17.5;
      const elevatorCabinX = 20.0;
      const elevatorZ = 0;

      switch (globalElevatorState.state) {
        case 'idle': {
          const dxW = elevatorWaitingX - b.currentPos[0];
          const dzW = elevatorZ - b.currentPos[2];
          const distW = Math.sqrt(dxW * dxW + dzW * dzW);

          if (distW > 0.3) {
            const step = Math.min(speed * delta, distW);
            b.currentPos = [
              b.currentPos[0] + (dxW / distW) * step,
              currentFloorY,
              b.currentPos[2] + (dzW / distW) * step,
            ];
            b.message = 'Menuju Lift VIP 🛗';
          } else {
            b.message = 'Memanggil Lift VIP 🛗';
            globalElevatorState.targetY = currentFloorY;
            if (Math.abs(globalElevatorState.currentY - currentFloorY) < 0.1) {
              globalElevatorState.state = 'opening_for_entry';
            } else {
              globalElevatorState.state = 'calling';
            }
          }
          break;
        }

        case 'calling': {
          b.message = 'Menunggu Lift VIP Datang 🛗';
          const dyC = globalElevatorState.targetY - globalElevatorState.currentY;
          if (Math.abs(dyC) > 0.15) {
            globalElevatorState.currentY += Math.sign(dyC) * Math.min(6 * delta, Math.abs(dyC));
          } else {
            globalElevatorState.currentY = globalElevatorState.targetY;
            globalElevatorState.state = 'opening_for_entry';
          }
          break;
        }

        case 'opening_for_entry': {
          b.message = 'Pintu Lift VIP Terbuka 🛗';
          globalElevatorState.doorOpenProgress = Math.min(1, globalElevatorState.doorOpenProgress + delta * 2.5);
          if (globalElevatorState.doorOpenProgress >= 0.98) {
            globalElevatorState.state = 'ceo_entering';
          }
          break;
        }

        case 'ceo_entering': {
          b.message = 'Masuk ke Lift VIP 🛗';
          const dxIn = elevatorCabinX - b.currentPos[0];
          if (Math.abs(dxIn) > 0.1) {
            b.currentPos[0] += Math.sign(dxIn) * Math.min(speed * delta, Math.abs(dxIn));
          } else {
            b.currentPos = [elevatorCabinX, currentFloorY, elevatorZ];
            globalElevatorState.state = 'closing_for_transit';
          }
          break;
        }

        case 'closing_for_transit': {
          b.message = 'Pintu Lift VIP Tertutup 🛗';
          globalElevatorState.doorOpenProgress = Math.max(0, globalElevatorState.doorOpenProgress - delta * 2.5);
          if (globalElevatorState.doorOpenProgress <= 0.02) {
            globalElevatorState.targetY = targetFloorY;
            globalElevatorState.state = 'transit';
          }
          break;
        }

        case 'transit': {
          b.message = `Meluncur ke Lantai ${Math.round(targetFloorY / 9) + 1} 🛗`;
          const dyT = globalElevatorState.targetY - globalElevatorState.currentY;
          if (Math.abs(dyT) > 0.15) {
            globalElevatorState.currentY += Math.sign(dyT) * Math.min(5.5 * delta, Math.abs(dyT));
            b.currentPos = [elevatorCabinX, globalElevatorState.currentY, elevatorZ];
          } else {
            globalElevatorState.currentY = globalElevatorState.targetY;
            b.currentPos = [elevatorCabinX, globalElevatorState.targetY, elevatorZ];
            globalElevatorState.state = 'opening_for_exit';
          }
          break;
        }

        case 'opening_for_exit': {
          b.message = 'Pintu Lift VIP Terbuka 🛗';
          globalElevatorState.doorOpenProgress = Math.min(1, globalElevatorState.doorOpenProgress + delta * 2.5);
          if (globalElevatorState.doorOpenProgress >= 0.98) {
            globalElevatorState.state = 'ceo_exiting';
          }
          break;
        }

        case 'ceo_exiting': {
          b.message = 'Keluar dari Lift VIP 🚶';
          const dxOut = elevatorWaitingX - b.currentPos[0];
          if (Math.abs(dxOut) > 0.1) {
            b.currentPos[0] += Math.sign(dxOut) * Math.min(speed * delta, Math.abs(dxOut));
          } else {
            b.currentPos = [elevatorWaitingX, targetFloorY, elevatorZ];
            globalElevatorState.state = 'closing_after_exit';
          }
          break;
        }

        case 'closing_after_exit': {
          globalElevatorState.doorOpenProgress = Math.max(0, globalElevatorState.doorOpenProgress - delta * 2.5);
          if (globalElevatorState.doorOpenProgress <= 0.02) {
            globalElevatorState.state = 'idle';
          }
          break;
        }
      }

    // =========================================================================
    // 🪜 ALL OTHER 29 NON-CEO AGENTS USE ARCHITECTURAL STAIRS (x = -20)
    // =========================================================================
    } else if (isDifferentFloor) {
      const currentFloorY = Math.round(currentY / 9) * 9;
      const targetFloorY = Math.round(targetY / 9) * 9;
      const goingUp = targetFloorY > currentFloorY;

      // Stairs run along z from -4.1 to +4.1 on the left wing (x = -20)
      const stairX = -20;
      const stairEntryZ = goingUp ? -4.1 : 4.1;
      const stairExitZ = goingUp ? 4.1 : -4.1;

      const dxS = stairX - b.currentPos[0];
      const dzS = stairEntryZ - b.currentPos[2];
      const distToStairEntry = Math.sqrt(dxS * dxS + dzS * dzS);

      if (distToStairEntry > 0.4 && Math.abs(currentY - currentFloorY) < 0.2) {
        // 1. Walk towards stairs entrance on current floor
        const step = Math.min(speed * delta, distToStairEntry);
        b.currentPos = [
          b.currentPos[0] + (dxS / distToStairEntry) * step,
          currentFloorY,
          b.currentPos[2] + (dzS / distToStairEntry) * step,
        ];
        b.message = 'Menuju Tangga 🪜';
      } else {
        // 2. Traversal on the stairs with continuous diagonal ascent / descent
        b.message = goingUp ? 'Naik Tangga 🪜' : 'Turun Tangga 🪜';
        const stairDz = stairExitZ - b.currentPos[2];

        if (Math.abs(stairDz) > 0.25) {
          const stepZ = Math.sign(stairDz) * Math.min(speed * 0.9 * delta, Math.abs(stairDz));
          const newZ = b.currentPos[2] + stepZ;
          const progress = Math.min(1, Math.max(0, (newZ - stairEntryZ) / (stairExitZ - stairEntryZ)));
          const newY = currentFloorY + progress * (targetFloorY - currentFloorY);
          b.currentPos = [stairX, newY, newZ];
        } else {
          // Arrived on destination floor landing
          b.currentPos = [stairX + 2, targetFloorY, stairExitZ];
        }
      }

    } else {
      // Regular horizontal walking on the same floor
      const dx = b.targetPos[0] - b.currentPos[0];
      const dz = b.targetPos[2] - b.currentPos[2];
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.1) {
        const step = Math.min(speed * delta, dist);
        b.currentPos = [
          b.currentPos[0] + (dx / dist) * step,
          targetY,
          b.currentPos[2] + (dz / dist) * step,
        ];
      } else {
        b.currentPos = [b.targetPos[0], targetY, b.targetPos[2]];
      }

      const atTarget = dist < 0.25;

      if (atTarget && (b.state === 'idle' || b.state === 'working' || b.state === 'typing')) {
        b.idleTimer -= delta;
        if (b.idleTimer <= 0) {
          const { state, chatPartner, message } = pickBreakActivity(role, roles);
          b.state = 'walking';
          b.message = message;
          b.chatPartner = chatPartner;
          b.targetPos = resolveTargetForState(role, state, chatPartner);
          (b as any)._nextState = state;
          b.idleTimer = IDLE_TIMEOUT_MIN + Math.random() * (IDLE_TIMEOUT_MAX - IDLE_TIMEOUT_MIN);
        }
      }

      if (atTarget && b.state === 'walking' && (b as any)._nextState) {
        const ns = (b as any)._nextState as BehaviorState;
        b.state = ns;
        (b as any)._nextState = undefined;

        const stayDuration =
          ns.startsWith('playing_') || ns === 'gaming_ps5'
            ? 12000 + Math.random() * 8000
            : ns === 'coffee_break'
            ? 8000 + Math.random() * 5000
            : 6000 + Math.random() * 4000;

        setTimeout(() => {
          if (behaviors[role]) {
            behaviors[role].state = 'walking';
            behaviors[role].message = 'Kembali ke Meja Kerja 💻';
            behaviors[role].targetPos = getHomeDeskByRole(role);
            (behaviors[role] as any)._nextState = 'working';
          }
        }, stayDuration);
      }
    }

    next[role] = b;
  });

  return next;
}
