export const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
export const isValidUrl = (s: string) => { try { const u = new URL(s.startsWith('http') ? s : `https://${s}`); return !!u.hostname.includes('.'); } catch { return false; } };
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
