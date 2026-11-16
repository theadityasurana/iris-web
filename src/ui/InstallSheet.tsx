import { useEffect, useState, type ReactNode } from 'react';
import { Copy, Ellipsis, EllipsisVertical, Share, SquarePlus } from 'lucide-react';
import { Modal } from '@web/ui/Modal';
import { useToast } from '@web/ui/Toast';
import { isIOS, markShown, promptInstall, shouldAutoShow, useInstall } from '@web/lib/pwa';

function Step({ n, children }: { n: number; children: ReactNode }) {
  return <li><span className="install-n">{n}</span><span>{children}</span></li>;
}

/** The "Add Iris to your home screen" sheet. Content adapts to the phone and browser. */
export function InstallSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mode = useInstall();
  const toast = useToast();

  const install = async () => {
    const ok = await promptInstall();
    if (ok) toast('Iris is on your home screen', 'ok');
    onClose();
  };
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(window.location.origin + '/app/home'); toast('Link copied', 'ok'); }
    catch { toast('Could not copy. Open irisjobs.live/app in your browser.', 'error'); }
  };

  if (mode === 'none') return null;
  const title = mode === 'in-app' ? 'Open Iris in your browser' : 'Add Iris to your home screen';
  const subtitle = mode === 'in-app'
    ? 'This app’s built-in browser can’t add Iris to your home screen.'
    : 'Open Iris in one tap, full screen, just like an app. Nothing to download.';

  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle}
      footer={mode === 'prompt' ? <>
        <button className="btn secondary" onClick={onClose}>Not now</button>
        <button className="btn" onClick={install}><SquarePlus />Add to home screen</button>
      </> : <button className="btn" onClick={onClose}>Got it</button>}>
      <div className="install-sheet">
        <img src="/pwa/icon-192.png" alt="" width={64} height={64} className="install-icon" />
        {mode === 'ios' && (
          <ol className="install-steps">
            <Step n={1}>Tap <b>Share</b> <Share className="install-glyph" /> in Safari’s toolbar. On newer iPhones it’s under <Ellipsis className="install-glyph" />.</Step>
            <Step n={2}>Scroll down and tap <b>Add to Home Screen</b> <SquarePlus className="install-glyph" />.</Step>
            <Step n={3}>Tap <b>Add</b>. Iris appears on your home screen.</Step>
          </ol>
        )}
        {mode === 'android-menu' && (
          <ol className="install-steps">
            <Step n={1}>Tap the menu <EllipsisVertical className="install-glyph" /> at the top right of your browser.</Step>
            <Step n={2}>Tap <b>Add to Home screen</b> or <b>Install app</b>.</Step>
            <Step n={3}>Confirm. Iris appears on your home screen.</Step>
          </ol>
        )}
        {mode === 'in-app' && (
          <>
            <ol className="install-steps">
              <Step n={1}>Tap the <Ellipsis className="install-glyph" /> menu at the top of this screen.</Step>
              <Step n={2}>Choose <b>{isIOS ? 'Open in Safari' : 'Open in browser'}</b>, then add Iris from there.</Step>
            </ol>
            <button className="btn outline sm" style={{ marginTop: 14 }} onClick={copyLink}><Copy />Copy link instead</button>
          </>
        )}
        {mode === 'prompt' && <p className="t-callout soft">Same account. You stay signed in.</p>}
        {mode === 'ios' && <p className="t-caption muted" style={{ marginTop: 12 }}>The first time you open it from your home screen, sign in once more.</p>}
      </div>
    </Modal>
  );
}

/** Opens the sheet automatically on phones: at most 3 times, a week apart, never once installed. */
export function AutoInstallSheet() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!shouldAutoShow()) return;
    const t = setTimeout(() => { markShown(); setOpen(true); }, 1500);
    return () => clearTimeout(t);
  }, []);
  return <InstallSheet open={open} onClose={() => setOpen(false)} />;
}
