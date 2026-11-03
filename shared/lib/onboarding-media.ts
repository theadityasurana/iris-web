export type ClassifiedMediaUri =
  | { kind: 'none' }
  | { kind: 'remote'; url: string }
  | { kind: 'local'; uri: string }
  | { kind: 'storage-key'; fileName: string };

function isRemoteUrl(uri: string): boolean {
  return uri.startsWith('http://') || uri.startsWith('https://');
}

function isLocalMediaUri(uri: string): boolean {
  return (
    uri.startsWith('file:') ||
    uri.startsWith('content:') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library:') ||
    uri.startsWith('data:')
  );
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/** Classify an onboarding resume/photo URI so we never fetch a storage filename as a URL. */
export function classifyOnboardingMediaUri(uri: string | null | undefined): ClassifiedMediaUri {
  if (!uri || !uri.trim()) return { kind: 'none' };
  const value = uri.trim();
  if (isRemoteUrl(value)) return { kind: 'remote', url: value };
  if (isLocalMediaUri(value)) return { kind: 'local', uri: value };
  const fileName = value.split('/').pop() || value;
  return { kind: 'storage-key', fileName };
}
