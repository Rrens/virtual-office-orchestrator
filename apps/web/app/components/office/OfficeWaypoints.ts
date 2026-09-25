export const AGENT_REGISTRY_30 = [
  // Executive (2)
  { role: 'orchestrator',          name: 'Budi',     title: 'CEO',         dept: 'executive',   pos: [-18, 0, -14] as [number, number, number] },
  { role: 'business-strategist',   name: 'Sari',     title: 'Strategi',    dept: 'executive',   pos: [-14, 0, -14] as [number, number, number] },

  // Product (4)
  { role: 'product-manager',       name: 'Andi',     title: 'PM',          dept: 'product',     pos: [-8, 0, -14]  as [number, number, number] },
  { role: 'business-analyst',      name: 'Dewi',     title: 'Analis',      dept: 'product',     pos: [-4, 0, -14]  as [number, number, number] },
  { role: 'ux-researcher',         name: 'Maya',     title: 'UX',          dept: 'product',     pos: [0, 0, -14]   as [number, number, number] },
  { role: 'product-analyst',       name: 'Toni',     title: 'Produk',      dept: 'product',     pos: [4, 0, -14]   as [number, number, number] },

  // Design (3)
  { role: 'ui-ux-designer',        name: 'Lulu',     title: 'Designer',    dept: 'design',      pos: [10, 0, -14]  as [number, number, number] },
  { role: 'design-system-designer',name: 'Rina',     title: 'DS Lead',     dept: 'design',      pos: [14, 0, -14]  as [number, number, number] },
  { role: 'brand-designer',        name: 'Citra',    title: 'Brand',       dept: 'design',      pos: [18, 0, -14]  as [number, number, number] },

  // Engineering (9)
  { role: 'backend-engineer',      name: 'Zaki',     title: 'Backend',     dept: 'engineering', pos: [-18, 0, -6]  as [number, number, number] },
  { role: 'frontend-engineer',     name: 'Reza',     title: 'Frontend',    dept: 'engineering', pos: [-14, 0, -6]  as [number, number, number] },
  { role: 'mobile-engineer',       name: 'Dafa',     title: 'Mobile',      dept: 'engineering', pos: [-10, 0, -6]  as [number, number, number] },
  { role: 'qa-engineer',           name: 'Risko',    title: 'QA Lead',     dept: 'engineering', pos: [-6, 0, -6]   as [number, number, number] },
  { role: 'security-engineer',     name: 'Bagas',    title: 'Security',    dept: 'engineering', pos: [-18, 0, -1]  as [number, number, number] },
  { role: 'penetration-tester',    name: 'Kresna',   title: 'Pentest',     dept: 'engineering', pos: [-14, 0, -1]  as [number, number, number] },
  { role: 'devops',                name: 'Fajar',    title: 'DevOps',      dept: 'engineering', pos: [-10, 0, -1]  as [number, number, number] },
  { role: 'performance-engineer',  name: 'Yogi',     title: 'Performa',    dept: 'engineering', pos: [-6, 0, -1]   as [number, number, number] },
  { role: 'ai-engineer',           name: 'Hana',     title: 'AI Eng',      dept: 'engineering', pos: [-2, 0, -1]   as [number, number, number] },

  // Growth / Marketing (4)
  { role: 'digital-marketer',      name: 'Dian',     title: 'Marketing',   dept: 'growth',      pos: [6, 0, -6]    as [number, number, number] },
  { role: 'seo-specialist',        name: 'Arif',     title: 'SEO',         dept: 'growth',      pos: [10, 0, -6]   as [number, number, number] },
  { role: 'content-creator',       name: 'Nadia',    title: 'Konten',      dept: 'growth',      pos: [14, 0, -6]   as [number, number, number] },
  { role: 'growth-analyst',        name: 'Gilang',   title: 'Growth',      dept: 'growth',      pos: [18, 0, -6]   as [number, number, number] },

  // Sales (3)
  { role: 'sales-representative',  name: 'Hendra',   title: 'Sales',       dept: 'sales',       pos: [-18, 0, 7]   as [number, number, number] },
  { role: 'sales-researcher',      name: 'Putri',    title: 'Riset',       dept: 'sales',       pos: [-14, 0, 7]   as [number, number, number] },
  { role: 'account-manager',       name: 'Rizal',    title: 'Account',     dept: 'sales',       pos: [-10, 0, 7]   as [number, number, number] },

  // Customer Support (2)
  { role: 'customer-service',      name: 'Ayu',      title: 'Support',     dept: 'customer',    pos: [-4, 0, 7]    as [number, number, number] },
  { role: 'customer-success',      name: 'Bayu',     title: 'CS',          dept: 'customer',    pos: [0, 0, 7]     as [number, number, number] },

  // Data & Operations (3)
  { role: 'data-engineer',         name: 'Vino',     title: 'Data Eng',    dept: 'data',        pos: [6, 0, 7]     as [number, number, number] },
  { role: 'data-analyst',          name: 'Sinta',    title: 'Analis',      dept: 'data',        pos: [10, 0, 7]    as [number, number, number] },
  { role: 'operations-manager',    name: 'Pak Bowo', title: 'Ops',         dept: 'operations',  pos: [16, 0, 7]    as [number, number, number] },
];

export const OFFICE_WAYPOINTS = {
  // Shared leisure areas
  COFFEE_BAR:        [-14, 0, 16] as [number, number, number],
  WATER_COOLER:      [-11, 0, 16] as [number, number, number],

  // Billiard Table Area
  BILLIARD_TABLE:    [-4, 0, 16]  as [number, number, number],
  BILLIARD_PLAYER_1: [-5.5, 0, 16] as [number, number, number],
  BILLIARD_PLAYER_2: [-2.5, 0, 16] as [number, number, number],

  // Music Studio
  MUSIC_GUITAR:      [5, 0, 16]   as [number, number, number],
  MUSIC_DRUMS:       [8, 0, 17]   as [number, number, number],
  MUSIC_PIANO:       [11, 0, 16]  as [number, number, number],
  MUSIC_MIC:         [7, 0, 15]   as [number, number, number],

  // PS5 Lounge
  PS5_COUCH_LEFT:    [15, 0, 15]  as [number, number, number],
  PS5_COUCH_CENTER:  [17, 0, 15]  as [number, number, number],
  PS5_COUCH_RIGHT:   [19, 0, 15]  as [number, number, number],

  // Meeting Rooms
  MEETING_ROOM_1:    [-14, 0, -1] as [number, number, number],
  MEETING_ROOM_2:    [14, 0, -1]  as [number, number, number],
  WHITEBOARD_1:      [-14, 0, -3] as [number, number, number],
};

export const DEPT_THEMES: Record<string, { name: string; color: string; floorColor: string }> = {
  executive:   { name: 'Executive Suite',     color: '#1e3a5f', floorColor: '#c2a884' },
  product:     { name: 'Product Studio',      color: '#5b3d8a', floorColor: '#d6c5ad' },
  design:      { name: 'Design Studio',       color: '#c76b2f', floorColor: '#e0d5c3' },
  engineering: { name: 'Engineering Lab',    color: '#1a5c42', floorColor: '#b0a390' },
  growth:      { name: 'Growth & Marketing',  color: '#1a6b3c', floorColor: '#cfc4b0' },
  sales:       { name: 'Sales Floor',         color: '#8b1a1a', floorColor: '#c8bcab' },
  customer:    { name: 'Customer Support',    color: '#1a4a8b', floorColor: '#d2c8b8' },
  data:        { name: 'Data Platform',       color: '#4a3a8b', floorColor: '#b8ad9e' },
  operations:  { name: 'Operations Hub',     color: '#5a5a5a', floorColor: '#c5baa9' },
};
