/** NetInfo backed by navigator.onLine. */
type State = { isConnected: boolean; isInternetReachable: boolean };
const current = (): State => ({ isConnected: navigator.onLine, isInternetReachable: navigator.onLine });

const NetInfo = {
  fetch: async () => current(),
  addEventListener(listener: (s: State) => void) {
    const h = () => listener(current());
    window.addEventListener('online', h);
    window.addEventListener('offline', h);
    return () => { window.removeEventListener('online', h); window.removeEventListener('offline', h); };
  },
};

export default NetInfo;
