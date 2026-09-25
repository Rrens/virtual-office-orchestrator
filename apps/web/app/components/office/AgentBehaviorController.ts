import { OFFICE_WAYPOINTS, AGENT_HOME_DESKS } from './OfficeWaypoints';

export { OFFICE_WAYPOINTS, AGENT_HOME_DESKS };

export type AgentId = 'pingot' | 'zaki' | 'lulu' | 'risko';

export type BehaviorState =
  | 'working'
  | 'typing'
  | 'thinking'
  | 'coffee_break'
  | 'gaming_ps5'
  | 'chatting'
  | 'pacing'
  | 'walking'
  | 'meeting'
  | 'error'
  | 'success'
  | 'idle';

export interface AgentBehavior {
  id: AgentId;
  state: BehaviorState;
  targetPos: [number, number, number];
  currentPos: [number, number, number];
  facingTarget?: [number, number, number];
  message?: string;
  chatPartner?: AgentId;
  idleTimer: number;
}

const IDLE_TIMEOUT_MIN = 8;
const IDLE_TIMEOUT_MAX = 18;

const BREAK_ACTIVITIES: BehaviorState[] = ['coffee_break', 'gaming_ps5', 'chatting', 'pacing'];
const BREAK_WEIGHTS = [0.35, 0.25, 0.25, 0.15];

function weightedRandom(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

export function getHomeDesk(id: AgentId): [number, number, number] {
  const key = AGENT_HOME_DESKS[id];
  return OFFICE_WAYPOINTS[key];
}

export function resolveTargetForState(
  id: AgentId,
  state: BehaviorState,
  chatPartner?: AgentId
): [number, number, number] {
  switch (state) {
    case 'working':
    case 'typing':
    case 'thinking':
    case 'idle':
    case 'success':
    case 'error':
      return getHomeDesk(id);
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
    case 'chatting':
      if (chatPartner) return getHomeDesk(chatPartner);
      return OFFICE_WAYPOINTS.WATER_COOLER;
    case 'pacing': {
      const pacingPoints: [number, number, number][] = [
        [-2, 0, 0], [2, 0, 0], [-1, 0, 1.5], [1, 0, -1.5],
      ];
      return pacingPoints[Math.floor(Math.random() * pacingPoints.length)];
    }
    case 'meeting':
      return OFFICE_WAYPOINTS.MEETING_TABLE;
    default:
      return getHomeDesk(id);
  }
}

export function pickBreakActivity(id: AgentId, allAgents: AgentId[]): {
  state: BehaviorState;
  chatPartner?: AgentId;
  message: string;
} {
  const idx = weightedRandom(BREAK_WEIGHTS);
  const state = BREAK_ACTIVITIES[idx];

  if (state === 'coffee_break') {
    const msgs = ['Ngopi bentar...', 'Coffee time!', 'Need caffeine...', 'Kopi dulu bro'];
    return { state, message: msgs[Math.floor(Math.random() * msgs.length)] };
  }
  if (state === 'gaming_ps5') {
    const msgs = ['Main PS5 dulu!', 'Break sebentar~', 'GG EZ!', 'Warzone time!'];
    return { state, message: msgs[Math.floor(Math.random() * msgs.length)] };
  }
  if (state === 'chatting') {
    const others = allAgents.filter((a) => a !== id);
    const partner = others[Math.floor(Math.random() * others.length)] as AgentId;
    const msgs = ['Eh review PR gw dong', 'Stucknih...', 'Ada bug aneh nih', 'Gimana progressnya?'];
    return { state, chatPartner: partner, message: msgs[Math.floor(Math.random() * msgs.length)] };
  }
  const msgs = ['Kenapa ini error ya...', 'Mikir dulu...', 'Hmm...', 'Logic-nya gimana ya'];
  return { state, message: msgs[Math.floor(Math.random() * msgs.length)] };
}

export function pickWorkMessage(state: BehaviorState): string {
  const map: Record<string, string[]> = {
    working: ['Ngoding...', 'On it!', 'Lagi implement...', 'Hampir selesai...'],
    typing: ['Ngetik kenceng...', 'Deadline approaching!', 'Kodenya jalan!', 'Push ke repo...'],
    thinking: ['Hmm...', 'Analisis dulu...', 'Cek dokumentasi...', 'Brainstorm...'],
    meeting: ['Diskusi sprint', 'Planning meeting', 'Review bareng'],
    error: ['Error nih!', 'Bug ketemu!', 'Perlu di-debug...', 'Stack overflow!'],
    success: ['Selesai!', 'Done!', 'Merged!', 'Task complete!'],
  };
  const msgs = map[state] ?? ['...'];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

export function initBehaviors(): Record<AgentId, AgentBehavior> {
  const ids: AgentId[] = ['pingot', 'zaki', 'lulu', 'risko'];
  const result = {} as Record<AgentId, AgentBehavior>;
  ids.forEach((id) => {
    const home = getHomeDesk(id);
    result[id] = {
      id,
      state: 'idle',
      targetPos: home,
      currentPos: [...home],
      idleTimer: IDLE_TIMEOUT_MIN + Math.random() * (IDLE_TIMEOUT_MAX - IDLE_TIMEOUT_MIN),
      message: '',
    };
  });
  return result;
}

export function tickBehaviors(
  behaviors: Record<AgentId, AgentBehavior>,
  delta: number
): Record<AgentId, AgentBehavior> {
  const ids: AgentId[] = ['pingot', 'zaki', 'lulu', 'risko'];
  const next = { ...behaviors };

  ids.forEach((id) => {
    const b = { ...next[id] };

    const dx = b.targetPos[0] - b.currentPos[0];
    const dz = b.targetPos[2] - b.currentPos[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    const speed = 2.5;

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
        const { state, chatPartner, message } = pickBreakActivity(id, ids);
        b.state = 'walking';
        b.message = message;
        b.chatPartner = chatPartner;
        b.targetPos = resolveTargetForState(id, state, chatPartner);
        (b as unknown as { _nextState: BehaviorState })._nextState = state;
        b.idleTimer = IDLE_TIMEOUT_MIN + Math.random() * (IDLE_TIMEOUT_MAX - IDLE_TIMEOUT_MIN);
      }
    }

    if (
      atTarget &&
      b.state === 'walking' &&
      (b as unknown as { _nextState?: BehaviorState })._nextState
    ) {
      const ns = (b as unknown as { _nextState: BehaviorState })._nextState;
      b.state = ns;
      (b as unknown as { _nextState?: BehaviorState })._nextState = undefined;

      if (ns === 'gaming_ps5') {
        setTimeout(() => {
          next[id].state = 'walking';
          next[id].targetPos = getHomeDesk(id);
          (next[id] as unknown as { _nextState: BehaviorState })._nextState = 'idle';
          next[id].message = 'Back to work...';
        }, 12000 + Math.random() * 8000);
      } else if (ns === 'coffee_break') {
        setTimeout(() => {
          next[id].state = 'walking';
          next[id].targetPos = getHomeDesk(id);
          (next[id] as unknown as { _nextState: BehaviorState })._nextState = 'working';
          next[id].message = 'Ready!';
        }, 8000 + Math.random() * 5000);
      } else if (ns === 'chatting') {
        setTimeout(() => {
          next[id].state = 'walking';
          next[id].targetPos = getHomeDesk(id);
          (next[id] as unknown as { _nextState: BehaviorState })._nextState = 'idle';
          next[id].message = '';
        }, 7000 + Math.random() * 5000);
      } else if (ns === 'pacing') {
        setTimeout(() => {
          next[id].state = 'walking';
          next[id].targetPos = getHomeDesk(id);
          (next[id] as unknown as { _nextState: BehaviorState })._nextState = 'thinking';
          next[id].message = 'Balik coding ah';
        }, 5000 + Math.random() * 4000);
      }
    }

    next[id] = b;
  });

  return next;
}

export function applyWSEventToBehaviors(
  behaviors: Record<AgentId, AgentBehavior>,
  eventType: string,
  agentRole: string
): Record<AgentId, AgentBehavior> {
  const roleToId: Record<string, AgentId> = {
    'orchestrator': 'pingot',
    'backend-engineer': 'zaki',
    'ui-ux-designer': 'lulu',
    'qa-engineer': 'risko',
  };
  const id = roleToId[agentRole];
  if (!id) return behaviors;

  const next = { ...behaviors };
  const b = { ...next[id] };

  if (eventType === 'task.assigned' || eventType === 'task.started') {
    b.state = 'walking';
    b.targetPos = getHomeDesk(id);
    (b as unknown as { _nextState: BehaviorState })._nextState = 'typing';
    b.message = pickWorkMessage('working');
  } else if (eventType === 'agent.thinking') {
    b.state = 'thinking';
    b.targetPos = getHomeDesk(id);
    b.message = pickWorkMessage('thinking');
  } else if (eventType === 'task.completed') {
    b.state = 'success';
    b.message = pickWorkMessage('success');
    b.targetPos = getHomeDesk(id);
  } else if (eventType === 'task.failed' || eventType === 'agent.error') {
    b.state = 'error';
    b.message = pickWorkMessage('error');
    b.targetPos = getHomeDesk(id);
  } else if (eventType === 'approval.requested') {
    b.state = 'walking';
    b.targetPos = OFFICE_WAYPOINTS.MEETING_TABLE;
    (b as unknown as { _nextState: BehaviorState })._nextState = 'meeting';
    b.message = 'Review needed!';
  } else if (eventType === 'workflow.started') {
    b.state = 'walking';
    b.targetPos = OFFICE_WAYPOINTS.WHITEBOARD;
    (b as unknown as { _nextState: BehaviorState })._nextState = 'meeting';
    b.message = 'Sprint planning!';
  }

  next[id] = b;
  return next;
}
