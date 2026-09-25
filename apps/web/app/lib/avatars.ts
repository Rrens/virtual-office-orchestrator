// PRD §23: Role-to-Avatar mapping
export const ROLE_AVATAR_MAP: Record<string, { modelUrl: string; outfitColor: string }> = {
  orchestrator: {
    modelUrl: 'https://models.readyplayer.me/6460d375e4ecc1d120084500.glb',
    outfitColor: '#818cf8',
  },
  'product-manager': {
    modelUrl: 'https://models.readyplayer.me/6460d375e4ecc1d120084501.glb',
    outfitColor: '#a78bfa',
  },
  'backend-engineer': {
    modelUrl: 'https://models.readyplayer.me/6460d375e4ecc1d120084502.glb',
    outfitColor: '#38bdf8',
  },
  'frontend-engineer': {
    modelUrl: 'https://models.readyplayer.me/6460d375e4ecc1d120084503.glb',
    outfitColor: '#34d399',
  },
  'ui-ux-designer': {
    modelUrl: 'https://models.readyplayer.me/6460d375e4ecc1d120084504.glb',
    outfitColor: '#f472b6',
  },
  'qa-engineer': {
    modelUrl: 'https://models.readyplayer.me/6460d375e4ecc1d120084505.glb',
    outfitColor: '#fbbf24',
  },
  devops: {
    modelUrl: 'https://models.readyplayer.me/6460d375e4ecc1d120084506.glb',
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
