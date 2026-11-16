import { useEffect } from 'react';

const APP_STORE = 'https://apps.apple.com/in/app/nextquark/id6761863089';

/** The iOS app is back: old /app/ios links forward to the App Store. */
export default function IosMaintenance() {
  useEffect(() => { window.location.replace(APP_STORE); }, []);
  return null;
}
