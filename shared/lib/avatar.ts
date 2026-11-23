/**
 * Profile picture when the person hasn't uploaded one (shared by the app and
 * irisjobs.live via iris-web/shared/lib/avatar.ts):
 *   1. their Google / LinkedIn sign-in photo (from the auth session),
 *   2. their Gravatar, looked up by email,
 *   3. Gravatar's neutral silhouette when they have neither.
 * Nothing is stored: it is worked out each time the profile is mapped.
 */

let authPhoto: string | null = null;

/** Called with the signed-in user (Supabase session.user) so mapping can use their provider photo. */
export function rememberAuthPhoto(user: { user_metadata?: Record<string, unknown> | null } | null | undefined) {
  const meta = user?.user_metadata ?? {};
  const url = (meta.avatar_url ?? meta.picture ?? null) as string | null;
  authPhoto = typeof url === 'string' && /^https?:\/\//.test(url) ? url : null;
}

/** The signed-in user's provider photo, if any. */
export function getAuthPhoto(): string | null {
  return authPhoto;
}

/** Gravatar for an email; Gravatar's silhouette when the email has none (or no email). */
export function gravatarUrl(email?: string | null, size = 200): string {
  const e = (email ?? '').trim().toLowerCase();
  const hash = e ? md5(e) : '';
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`;
}

/** Default picture for a profile with no uploaded photo. */
export function defaultAvatar(email?: string | null, opts: { isSelf?: boolean } = {}): string {
  if (opts.isSelf !== false && authPhoto) return authPhoto;
  return gravatarUrl(email);
}

// ── MD5 (RFC 1321), as Gravatar addresses photos by md5(email) ──────────────
function md5(input: string): string {
  const utf8 = unescape(encodeURIComponent(input));
  const words: number[] = [];
  for (let i = 0; i < utf8.length; i++) words[i >> 2] |= utf8.charCodeAt(i) << ((i % 4) * 8);
  const bitLen = utf8.length * 8;
  words[bitLen >> 5] |= 0x80 << (bitLen % 32);
  words[(((bitLen + 64) >>> 9) << 4) + 14] = bitLen;

  const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) | 0);
  let a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476;
  const add = (x: number, y: number) => (x + y) | 0;
  const rotl = (x: number, c: number) => (x << c) | (x >>> (32 - c));

  for (let blk = 0; blk < words.length; blk += 16) {
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if (i < 16) { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * i) % 16; }
      const tmp = d;
      d = c;
      c = b;
      b = add(b, rotl(add(add(a, f), add(K[i], words[blk + g] | 0)), S[(i >> 4) * 4 + (i % 4)]));
      a = tmp;
    }
    a0 = add(a0, a); b0 = add(b0, b); c0 = add(c0, c); d0 = add(d0, d);
  }
  const hex = (n: number) => Array.from({ length: 4 }, (_, i) => ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, '0')).join('');
  return hex(a0) + hex(b0) + hex(c0) + hex(d0);
}
