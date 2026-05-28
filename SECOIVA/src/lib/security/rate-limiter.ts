/**
 * NEXUS OS — Rate limiter abstraction.
 *
 * NOTE: this platform does not have managed rate-limit primitives
 * (no Redis / edge KV exposed). The in-memory `localRateLimiter` is a
 * per-process placeholder — adequate for local guardrails, NOT a defense
 * against distributed abuse. Swap `activeLimiter` for a real backend
 * (Upstash / Cloudflare KV / Durable Objects) when available without
 * touching call sites.
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimiter {
  readonly name: string;
  readonly distributed: boolean;
  check(key: string, opts: { limit: number; windowMs: number }): Promise<RateLimitResult>;
}

type Bucket = { count: number; resetAt: number };
const memory = new Map<string, Bucket>();

export const localRateLimiter: RateLimiter = {
  name: "in-memory",
  distributed: false,
  async check(key, { limit, windowMs }) {
    const now = Date.now();
    const b = memory.get(key);
    if (!b || b.resetAt < now) {
      const fresh = { count: 1, resetAt: now + windowMs };
      memory.set(key, fresh);
      return { allowed: true, remaining: limit - 1, resetAt: fresh.resetAt };
    }
    b.count += 1;
    return { allowed: b.count <= limit, remaining: Math.max(0, limit - b.count), resetAt: b.resetAt };
  },
};

const activeLimiter: RateLimiter = localRateLimiter;
export const rateLimiter = activeLimiter;

/** Canonical rate-limit policy table — single source of truth. */
export const RATE_LIMITS = {
  "auth.login":      { limit: 5,   windowMs: 60_000 },
  "auth.reset":      { limit: 3,   windowMs: 300_000 },
  "auth.signup":     { limit: 5,   windowMs: 300_000 },
  "approvals.write": { limit: 30,  windowMs: 60_000 },
  "uploads.create":  { limit: 20,  windowMs: 60_000 },
  "ai.analysis":     { limit: 10,  windowMs: 60_000 },
} as const;

export type RateLimitKey = keyof typeof RATE_LIMITS;

export async function enforceRateLimit(action: RateLimitKey, scope: string) {
  return rateLimiter.check(`${action}:${scope}`, RATE_LIMITS[action]);
}
