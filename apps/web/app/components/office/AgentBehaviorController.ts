import { AGENT_REGISTRY_30, OFFICE_WAYPOINTS } from './OfficeWaypoints';

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

const IDLE_TIMEOUT_MIN = 8;
const IDLE_TIMEOUT_MAX = 20;

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

const BREAK_WEIGHTS = [0.20, 0.15, 0.15, 0.10, 0.10, 0.08, 0.12, 0.10];

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
  switch (state) {
    case 'working':
    case 'typing':
    case 'thinking':
    case 'idle':
    case 'success':
    case 'error':
      return getHomeDeskByRole(role);

    case 'coffee_break':
      return OFFICE_WAYPOINTS.COFFEE_BAR;

    case 'gaming_ps5': {
      const couch: [number, number, number][] = [
        OFFICE_WAYPOINTS.PS5_COUCH_LEFT,
        OFFICE_WAYPOINTS.PS5_COUCH_CENTER,
        OFFICE_WAYPOINTS.PS5_COUCH_RIGHT,
      ];
      return couch[Math.floor(Math.random() * couch.length)];
    }

    case 'playing_billiard':
      return Math.random() > 0.5 ? OFFICE_WAYPOINTS.BILLIARD_PLAYER_1 : OFFICE_WAYPOINTS.BILLIARD_PLAYER_2;

    case 'playing_guitar':
      return OFFICE_WAYPOINTS.MUSIC_GUITAR;

    case 'playing_piano':
      return OFFICE_WAYPOINTS.MUSIC_PIANO;

    case 'playing_drums':
      return OFFICE_WAYPOINTS.MUSIC_DRUMS;

    case 'chatting':
      if (chatPartnerRole) return getHomeDeskByRole(chatPartnerRole);
      return OFFICE_WAYPOINTS.WATER_COOLER;

    case 'pacing': {
      const home = getHomeDeskByRole(role);
      const dx = (Math.random() - 0.5) * 4;
      const dz = (Math.random() - 0.5) * 3;
      return [home[0] + dx, 0, home[2] + dz];
    }

    case 'meeting':
      return OFFICE_WAYPOINTS.MEETING_ROOM_1;

    default:
      return getHomeDeskByRole(role);
  }
}

export function pickBreakActivity(role: string, allRoles: string[]): {
  state: BehaviorState;
  chatPartner?: string;
  message: string;
} {
  const idx = weightedRandom(BREAK_WEIGHTS);
  const state = BREAK_ACTIVITIES[idx];

  if (state === 'coffee_break') {
    const msgs = ['Ngopi bentar...', 'Need caffeine...', 'Kopi dulu bro!', 'Break dulu~'];
    return { state, message: msgs[Math.floor(Math.random() * msgs.length)] };
  }
  if (state === 'gaming_ps5') {
    const msgs = ['Main FIFA dulu bro!', 'Warzone dulu!', 'GG WP!', 'PS5 time~'];
    return { state, message: msgs[Math.floor(Math.random() * msgs.length)] };
  }
  if (state === 'playing_billiard') {
    const msgs = ['Main billiard ah', 'Tricky shot!', '8-ball break!', 'Main stik dulu'];
    return { state, message: msgs[Math.floor(Math.random() * msgs.length)] };
  }
  if (state === 'playing_guitar') {
    const msgs = ['Jaming gitar 🎸', 'Melodi santai~', 'Latihan solo', 'Akustikan...'];
    return { state, message: msgs[Math.floor(Math.random() * msgs.length)] };
  }
  if (state === 'playing_piano') {
    const msgs = ['Main piano 🎹', 'Klasik santai~', 'Lagu baru...', 'Harmony mode'];
    return { state, message: msgs[Math.floor(Math.random() * msgs.length)] };
  }
  if (state === 'playing_drums') {
    const msgs = ['Jaming drum 🥁', 'Beat santai!', 'Latihan ritem', 'Gebuk drum dulu'];
    return { state, message: msgs[Math.floor(Math.random() * msgs.length)] };
  }
  if (state === 'chatting') {
    const others = allRoles.filter((r) => r !== role);
    const partner = others[Math.floor(Math.random() * others.length)];
    const msgs = ['Ngobrol bentar', 'Diskusi santai', 'Tanya progress', 'Bahas ide baru'];
    return { state, chatPartner: partner, message: msgs[Math.floor(Math.random() * msgs.length)] };
  }

  const msgs = ['Kenapa ini error ya...', 'Mikir logic...', 'Hmm...', 'Cari solusi...'];
  return { state, message: msgs[Math.floor(Math.random() * msgs.length)] };
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

    const dx = b.targetPos[0] - b.currentPos[0];
    const dz = b.targetPos[2] - b.currentPos[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    const speed = 3.2;

    if (dist > 0.08) {
      const step = Math.min(speed * delta, dist);
      b.currentPos = [
        b.currentPos[0] + (dx / dist) * step,
        0,
        b.currentPos[2] + (dz / dist) * step,
      ];
    }

    const atTarget = dist < 0.2;

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

    next[role] = b;
  });

  return next;
}
