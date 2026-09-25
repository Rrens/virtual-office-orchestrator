import type { FastifyRequest, FastifyReply } from 'fastify';

export type UserRole = 'founder' | 'observer';

export interface AuthUser {
  userId: string;
  role: UserRole;
  name: string;
}

export function parseAuthHeader(req: FastifyRequest): AuthUser {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Default fallback for single-tenant mode
    return { userId: 'user-founder-1', role: 'founder', name: 'Founder User' };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (token === 'observer') {
    return { userId: 'user-observer-1', role: 'observer', name: 'Observer User' };
  }

  return { userId: 'user-founder-1', role: 'founder', name: 'Founder User' };
}

export async function requireFounder(req: FastifyRequest, reply: FastifyReply) {
  const user = parseAuthHeader(req);
  if (user.role !== 'founder') {
    return reply.status(403).send({ error: 'Forbidden: Action requires Founder role' });
  }
}
