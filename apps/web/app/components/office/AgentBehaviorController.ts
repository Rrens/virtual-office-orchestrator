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

const IDLE_TIMEOUT_MIN = 12;
const IDLE_TIMEOUT_MAX = 28;

const BREAK_ACTIVITIES: BehaviorState[] = [
  'coffee_break',
  'gaming_ps5',
  'playing_billiard',
  'playing_guitar',
  'playing_piano',
  'playing_drums',
  'chatting',
  'pacing',
];

const BREAK_WEIGHTS = [0.25, 0.15, 0.15, 0.08, 0.08, 0.05, 0.12, 0.12];

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
      return { state, message: 'Naik lift ngopi ke L2 Pantry ☕' };

    case 'gaming_ps5':
      return { state, message: 'Naik lift main PS5 di L6 Lounge 🎮' };

    case 'playing_billiard':
      return { state, message: 'Main Billiard di L6 Sky Lounge 🎱' };

    case 'playing_guitar':
      return { state, message: 'Jamming gitar di Music Studio L6 🎸' };

    case 'playing_piano':
      return { state, message: 'Main piano di Music Studio L6 🎹' };

    case 'playing_drums':
      return { state, message: 'Main drum di Music Studio L6 🥁' };

    case 'chatting': {
      const peers = allRoles.filter((r) => r !== role && r !== 'security-guard' && r !== 'receptionist');
      const partner = peers[Math.floor(Math.random() * peers.length)];
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
  const roles = Object.keys(behaviors);
  const next = { ...behaviors };

  roles.forEach((role) => {
    const b = { ...next[role] };

    // Stationary decorative staff
    if (role === 'security-guard') {
      b.state = 'idle';
      b.message = 'Menjaga Keamanan Lobby 🛡️';
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

    // Defensive fallback: guarantee valid coordinates and prevent any runtime TypeError
    if (!b.targetPos || !Array.isArray(b.targetPos) || typeof b.targetPos[1] !== 'number') {
      b.targetPos = getHomeDeskByRole(role);
    }
    if (!b.currentPos || !Array.isArray(b.currentPos) || typeof b.currentPos[1] !== 'number') {
      b.currentPos = [...b.targetPos];
    }

    const currentY = b.currentPos[1];
    const targetY = b.targetPos[1];
    const isDifferentFloor = Math.abs(currentY - targetY) > 0.5;

    // Movement speed: deliberately slower for comfortable name readability
    const speed = 1.6;

    if (isDifferentFloor) {
      // Use a tiny per-agent deterministic queue offset to avoid name tag overlap in front of elevator
      const roleOffsetMap: Record<string, number> = {};
      roles.forEach((r, i) => (roleOffsetMap[r] = (i % 5 - 2) * 1.2));
      const elevatorBaseX = 22;
      const targetQueueX = elevatorBaseX + roleOffsetMap[role];

      // 1. Move horizontally to the elevator door queue position [targetQueueX, currentY, 0]
      const toElevatorDx = targetQueueX - b.currentPos[0];
      const toElevatorDz = 0 - b.currentPos[2];
      const distToElevator = Math.sqrt(toElevatorDx * toElevatorDx + toElevatorDz * toElevatorDz);

      if (distToElevator > 0.3) {
        const step = Math.min(speed * delta, distToElevator);
        b.currentPos = [
          b.currentPos[0] + (toElevatorDx / distToElevator) * step,
          currentY,
          b.currentPos[2] + (toElevatorDz / distToElevator) * step,
        ];
        b.message = 'Menuju Lift Kaca 🛗';
      } else {
        // 2. Inside elevator: ride vertically to target floor
        const dy = targetY - currentY;
        const elevatorSpeed = 4.5;
        const stepY = Math.sign(dy) * Math.min(elevatorSpeed * delta, Math.abs(dy));
        b.currentPos = [targetQueueX, currentY + stepY, 0];
        b.message = `Naik Lift ke Lantai ${Math.round(targetY / 8)} 🛗`;
      }
    } else {
      // Same floor: regular horizontal walking
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
          if (next[role]) {
            next[role].state = 'walking';
            next[role].targetPos = getHomeDeskByRole(role);
            (next[role] as any)._nextState = 'idle';
            next[role].message = '';
          }
        }, stayDuration);
      }
    }

    next[role] = b;
  });

  return next;
}
