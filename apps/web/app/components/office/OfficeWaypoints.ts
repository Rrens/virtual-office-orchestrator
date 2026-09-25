export const OFFICE_WAYPOINTS = {
  DESK_PINGOT: [-4, 0, -2] as [number, number, number],
  DESK_ZAKI: [0, 0, -2] as [number, number, number],
  DESK_LULU: [4, 0, -2] as [number, number, number],
  DESK_RISKO: [0, 0, 2] as [number, number, number],
  COFFEE_BAR: [6.2, 0, -4.5] as [number, number, number],
  PS5_COUCH_LEFT: [-6.8, 0, 3.8] as [number, number, number],
  PS5_COUCH_CENTER: [-6, 0, 3.8] as [number, number, number],
  PS5_COUCH_RIGHT: [-5.2, 0, 3.8] as [number, number, number],
  WATER_COOLER: [-3.5, 0, 4.5] as [number, number, number],
  MEETING_TABLE: [0, 0, -5.2] as [number, number, number],
  WHITEBOARD: [0, 0, -6.5] as [number, number, number],
};

export type WaypointKey = keyof typeof OFFICE_WAYPOINTS;

export const AGENT_HOME_DESKS = {
  pingot: 'DESK_PINGOT',
  zaki: 'DESK_ZAKI',
  lulu: 'DESK_LULU',
  risko: 'DESK_RISKO',
} as const;
