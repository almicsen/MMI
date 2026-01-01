export interface SessionResponse {
  userId: string;
  expiresAt: string;
  rotated?: boolean;
}

export async function createSession(idToken: string): Promise<SessionResponse | null> {
  const response = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      return null;
    }
    let message = 'Failed to create session';
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  return response.json();
}

export async function refreshSession(): Promise<SessionResponse | null> {
  const response = await fetch('/api/session', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function clearSession(): Promise<void> {
  await fetch('/api/session', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
}
