type SessionRecord = {
  address: `0x${string}`;
  signature: `0x${string}`;
  createdAt: number;
};

const sessions = new Map<string, SessionRecord>();

export function createSession(input: SessionRecord) {
  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, input);
  return sessionId;
}

export function getSession(sessionId: string) {
  return sessions.get(sessionId);
}

export function cleanupSessions(maxAgeMs = 1000 * 60 * 60 * 6) {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > maxAgeMs) {
      sessions.delete(id);
    }
  }
}
