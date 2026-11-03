export function sanitizeError(msg?: string | null): string {
  if (!msg) return 'Something went wrong. Please try again.';
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login') || lower.includes('invalid credentials') || lower.includes('wrong password') || lower.includes('invalid email or password'))
    return 'Incorrect email or password.';
  if (lower.includes('email not confirmed'))
    return 'Please verify your email before signing in.';
  if (lower.includes('already registered') || lower.includes('already been registered'))
    return 'An account with this email already exists.';
  if (lower.includes('rate limit') || lower.includes('too many requests'))
    return 'Too many attempts. Please wait a moment and try again.';
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('504') || lower.includes('502') || lower.includes('503') || lower.includes('timeout') || lower.includes('timed out'))
    return 'Connection issue. Please check your internet and try again.';
  if (lower.includes('user not found'))
    return 'No account found with that email.';
  if (lower.includes('password should be') || lower.includes('password must be'))
    return 'Password must be at least 6 characters.';
  // Catch raw JSON blobs or HTTP response objects leaking through
  if (msg.startsWith('{') || msg.startsWith('[') || msg.includes('"status"') || msg.includes('statusText') || msg.includes('cf-ray') || msg.includes('supabase.co'))
    return 'Something went wrong on our end. Please try again.';
  // Pass through short, clean messages
  if (msg.length < 100 && !msg.includes('{') && !msg.includes('http'))
    return msg;
  return 'Something went wrong. Please try again.';
}
