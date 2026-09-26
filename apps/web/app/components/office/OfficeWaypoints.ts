export const FLOOR_HEIGHTS = {
  L1_GROUND: 0,          // Ground Floor: Grand Lobby, Sales, CS & Espresso Pantry
  L2_STUDIO: 9,          // Level 1: Mega Tech, Creative & Growth Studio
  L3_PENTHOUSE: 18,      // Level 2: Executive Penthouse CEO Rendy, Lounge & Rooftop Helipad
};

export const FLOOR_LABELS: Record<number, string> = {
  [0]:  '🏢 GF: Grand Lobby, Sales & Cafe',
  [9]:  '💻 L1: Mega Tech & Design Studio',
  [18]: '👑 L2: Penthouse CEO & Helipad 🚁',
};

export const AGENT_REGISTRY_30: Array<{
  role: string;
  name: string;
  title: string;
  dept: string;
  pos: [number, number, number];
}> = [
  // =========================================================================
  // 🏢 FLOOR 1 (Ground, y = 0): GRAND LOBBY, SALES, CUSTOMER SUCCESS & PANTRY
  // =========================================================================
  { role: 'security-guard',        name: 'Pak Joko', title: 'Satpam',     dept: 'security',    pos: [10, FLOOR_HEIGHTS.L1_GROUND, 12] },
  { role: 'receptionist',          name: 'Siti',     title: 'Resepsionis',dept: 'operations',  pos: [0, FLOOR_HEIGHTS.L1_GROUND, 10] },

  // Sales & CS Team (Left Wing)
  { role: 'sales-representative',  name: 'Hendra',   title: 'Sales',       dept: 'sales',       pos: [-16, FLOOR_HEIGHTS.L1_GROUND, -4] },
  { role: 'sales-researcher',      name: 'Putri',    title: 'Riset',       dept: 'sales',       pos: [-10, FLOOR_HEIGHTS.L1_GROUND, -4] },
  { role: 'account-manager',       name: 'Rizal',    title: 'Account',     dept: 'sales',       pos: [-4, FLOOR_HEIGHTS.L1_GROUND, -4] },
  { role: 'customer-service',      name: 'Ayu',      title: 'Support',     dept: 'customer',    pos: [-16, FLOOR_HEIGHTS.L1_GROUND, 4] },
  { role: 'customer-success',      name: 'Bayu',     title: 'CS',          dept: 'customer',    pos: [-10, FLOOR_HEIGHTS.L1_GROUND, 4] },

  // Growth & Ops Hub (Right Wing Lobby)
  { role: 'digital-marketer',      name: 'Dian',     title: 'Marketing',   dept: 'growth',      pos: [6, FLOOR_HEIGHTS.L1_GROUND, -4] },
  { role: 'seo-specialist',        name: 'Arif',     title: 'SEO',         dept: 'growth',      pos: [12, FLOOR_HEIGHTS.L1_GROUND, -4] },
  { role: 'content-creator',       name: 'Nadia',    title: 'Konten',      dept: 'growth',      pos: [18, FLOOR_HEIGHTS.L1_GROUND, -4] },
  { role: 'growth-analyst',        name: 'Gilang',   title: 'Growth',      dept: 'growth',      pos: [12, FLOOR_HEIGHTS.L1_GROUND, 4] },
  { role: 'operations-manager',    name: 'Pak Bowo', title: 'Ops',         dept: 'operations',  pos: [18, FLOOR_HEIGHTS.L1_GROUND, 4] },

  // =========================================================================
  // 💻 FLOOR 2 (Level 1, y = 9): MEGA TECH LAB, DATA & CREATIVE STUDIO
  // =========================================================================
  // Engineering Team (Back Left Cluster)
  { role: 'backend-engineer',      name: 'Zaki',     title: 'Backend',     dept: 'engineering', pos: [-16, FLOOR_HEIGHTS.L2_STUDIO, -10] },
  { role: 'frontend-engineer',     name: 'Reza',     title: 'Frontend',    dept: 'engineering', pos: [-10, FLOOR_HEIGHTS.L2_STUDIO, -10] },
  { role: 'mobile-engineer',       name: 'Dafa',     title: 'Mobile',      dept: 'engineering', pos: [-4, FLOOR_HEIGHTS.L2_STUDIO, -10] },
  { role: 'qa-engineer',           name: 'Risko',    title: 'QA Lead',     dept: 'engineering', pos: [-16, FLOOR_HEIGHTS.L2_STUDIO, -2] },
  { role: 'security-engineer',     name: 'Bagas',    title: 'Security',    dept: 'engineering', pos: [-10, FLOOR_HEIGHTS.L2_STUDIO, -2] },
  { role: 'penetration-tester',    name: 'Kresna',   title: 'Pentest',     dept: 'engineering', pos: [-4, FLOOR_HEIGHTS.L2_STUDIO, -2] },

  // DevOps, AI & Data Team (Back Right Cluster near Server Racks)
  { role: 'devops',                name: 'Fajar',    title: 'DevOps',      dept: 'engineering', pos: [6, FLOOR_HEIGHTS.L2_STUDIO, -10] },
  { role: 'performance-engineer',  name: 'Yogi',     title: 'Performa',    dept: 'engineering', pos: [12, FLOOR_HEIGHTS.L2_STUDIO, -10] },
  { role: 'ai-engineer',           name: 'Hana',     title: 'AI Eng',      dept: 'engineering', pos: [18, FLOOR_HEIGHTS.L2_STUDIO, -10] },
  { role: 'data-engineer',         name: 'Vino',     title: 'Data Eng',    dept: 'data',        pos: [12, FLOOR_HEIGHTS.L2_STUDIO, -2] },
  { role: 'data-analyst',          name: 'Sinta',    title: 'Analis',      dept: 'data',        pos: [18, FLOOR_HEIGHTS.L2_STUDIO, -2] },

  // Product & Design Team (Front Cluster)
  { role: 'product-manager',       name: 'Andi',     title: 'PM',          dept: 'product',     pos: [-16, FLOOR_HEIGHTS.L2_STUDIO, 8] },
  { role: 'business-analyst',      name: 'Dewi',     title: 'Analis',      dept: 'product',     pos: [-10, FLOOR_HEIGHTS.L2_STUDIO, 8] },
  { role: 'ux-researcher',         name: 'Maya',     title: 'UX',          dept: 'product',     pos: [-4, FLOOR_HEIGHTS.L2_STUDIO, 8] },
  { role: 'product-analyst',       name: 'Toni',     title: 'Produk',      dept: 'product',     pos: [2, FLOOR_HEIGHTS.L2_STUDIO, 8] },
  { role: 'ui-ux-designer',        name: 'Lulu',     title: 'Designer',    dept: 'design',      pos: [8, FLOOR_HEIGHTS.L2_STUDIO, 8] },
  { role: 'design-system-designer',name: 'Rina',     title: 'DS Lead',     dept: 'design',      pos: [14, FLOOR_HEIGHTS.L2_STUDIO, 8] },
  { role: 'brand-designer',        name: 'Citra',    title: 'Brand',       dept: 'design',      pos: [20, FLOOR_HEIGHTS.L2_STUDIO, 8] },

  // =========================================================================
  // 👑 FLOOR 3 (Level 2, y = 18): EXECUTIVE PENTHOUSE CEO & HELIPAD
  // =========================================================================
  { role: 'orchestrator',          name: 'Rendy',    title: 'CEO',         dept: 'executive',   pos: [-10, FLOOR_HEIGHTS.L3_PENTHOUSE, -8] },
  { role: 'business-strategist',   name: 'Sari',     title: 'Strategi',    dept: 'executive',   pos: [-4, FLOOR_HEIGHTS.L3_PENTHOUSE, -8] },
];

export const OFFICE_WAYPOINTS: Record<string, [number, number, number]> = {
  // === L1 GROUND ===
  RECEPTION_DESK:    [0, FLOOR_HEIGHTS.L1_GROUND, 10],
  SECURITY_POST:     [10, FLOOR_HEIGHTS.L1_GROUND, 12],
  COFFEE_BAR:        [-16, FLOOR_HEIGHTS.L1_GROUND, -14],
  WATER_COOLER:      [16, FLOOR_HEIGHTS.L1_GROUND, -14],

  // === L2 MEGA STUDIO ===
  MEETING_ROUND_1:   [-10, FLOOR_HEIGHTS.L2_STUDIO, 3],
  MEETING_ROUND_2:   [10, FLOOR_HEIGHTS.L2_STUDIO, 3],
  KANBAN_WHITEBOARD: [0, FLOOR_HEIGHTS.L2_STUDIO, -14],
  DESIGN_LOUNGE:     [0, FLOOR_HEIGHTS.L2_STUDIO, 8],

  // === L3 PENTHOUSE & ROOFTOP ===
  RENDY_DESK:        [-10, FLOOR_HEIGHTS.L3_PENTHOUSE, -8],
  BILLIARD_TABLE:    [-10, FLOOR_HEIGHTS.L3_PENTHOUSE, 6],
  PS5_LOUNGE:        [-4, FLOOR_HEIGHTS.L3_PENTHOUSE, 6],
  MINI_GOLF:         [-16, FLOOR_HEIGHTS.L3_PENTHOUSE, 4],
  HELIPAD_CENTER:    [10, FLOOR_HEIGHTS.L3_PENTHOUSE, 0],
};

export const DEPT_THEMES: Record<string, { name: string; color: string; floorColor: string; neon: string }> = {
  executive:   { name: 'Executive Penthouse', color: '#1e293b', floorColor: '#cbd5e1', neon: '#94a3b8' },
  product:     { name: 'Product Studio',      color: '#5b3d8a', floorColor: '#f1f5f9', neon: '#a855f7' },
  design:      { name: 'Design Studio',       color: '#c76b2f', floorColor: '#f1f5f9', neon: '#f43f5e' },
  engineering: { name: 'Engineering Lab',     color: '#1a5c42', floorColor: '#f1f5f9', neon: '#06b6d4' },
  growth:      { name: 'Growth & Marketing',  color: '#1a6b3c', floorColor: '#f1f5f9', neon: '#f59e0b' },
  sales:       { name: 'Sales Floor',         color: '#8b1a1a', floorColor: '#f1f5f9', neon: '#e11d48' },
  customer:    { name: 'Customer Support',    color: '#1a4a8b', floorColor: '#f1f5f9', neon: '#38bdf8' },
  data:        { name: 'Data Platform',       color: '#4a3a8b', floorColor: '#f1f5f9', neon: '#a855f7' },
  operations:  { name: 'Operations Hub',      color: '#5a5a5a', floorColor: '#f1f5f9', neon: '#94a3b8' },
  security:    { name: 'Security & Guard',    color: '#0f172a', floorColor: '#cbd5e1', neon: '#10b981' },
};
