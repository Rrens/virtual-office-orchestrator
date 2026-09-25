// PRD §23: Role-to-Avatar mapping using ReadyPlayerMe public sample avatars
// These are pre-generated public sample avatars. Replace with your own ReadyPlayerMe URLs if needed.
export const ROLE_AVATAR_MAP: Record<string, { modelUrl: string; outfitColor: string }> = {
  orchestrator: {
    modelUrl: 'https://models.readyplayer.me/6460d300eb29239845287376.glb',
    outfitColor: '#818cf8',
  },
  'product-manager': {
    modelUrl: 'https://models.readyplayer.me/6460d342eb29239845287382.glb',
    outfitColor: '#a78bfa',
  },
  'backend-engineer': {
    modelUrl: 'https://models.readyplayer.me/6460d38feb29239845287390.glb',
    outfitColor: '#38bdf8',
  },
  'frontend-engineer': {
    modelUrl: 'https://models.readyplayer.me/6460d3c0eb29239845287399.glb',
    outfitColor: '#34d399',
  },
  'ui-ux-designer': {
    modelUrl: 'https://models.readyplayer.me/6460d3faeb292398452873a4.glb',
    outfitColor: '#f472b6',
  },
  'qa-engineer': {
    modelUrl: 'https://models.readyplayer.me/6460d42eeb292398452873b2.glb',
    outfitColor: '#fbbf24',
  },
  devops: {
    modelUrl: 'https://models.readyplayer.me/6460d45beb292398452873bd.glb',
    outfitColor: '#f87171',
  },
};

export const STATUS_EMOJI: Record<string, string> = {
  idle: '☕ Idle',
  assigned: '📋 Assigned',
  thinking: '💡 Thinking...',
  working: '⚡ Working',
  reviewing: '🔍 Reviewing',
  completed: '🎉 Done',
  error: '⚡ Error',
  escalated: '🚨 Escalated',
};
