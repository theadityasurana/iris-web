import { Linking, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { rc, fmt } from '@/lib/remote-config';

/**
 * One-tap referral sharing to Instagram Stories, X and WhatsApp.
 *
 * Each target opens the app itself with the content in place:
 * - Instagram Stories: the invite card becomes the story background (native
 *   module + Facebook App ID on iOS; Android needs only the native module).
 *   The caption is copied so it can be pasted as a text sticker.
 * - X: Android attaches the invite card and text to the X composer; iOS opens
 *   the X composer with the text and link (iOS gives apps no way to hand X an
 *   image directly; the link unfurls into a preview card).
 * - WhatsApp: the chat picker with the message filled in.
 *
 * Expo Go and builds made before react-native-share was added have no native
 * module, so Stories falls back to the share sheet with the image (tap
 * Instagram → Story there) and X to its app/web composer with the text.
 */

let RNShare: any = null;
try {
  RNShare = require('react-native-share').default;
} catch {
  RNShare = null;
}

/**
 * Meta requires a Facebook App ID for direct Instagram Stories sharing (iOS
 * and Android). App Control (social.facebook_app_id) wins over the build env,
 * so it can be added without a rebuild.
 */
const facebookAppId = () => rc('social').facebook_app_id || process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || '';

const asFileUrl = (path: string) => (path.startsWith('file://') ? path : `file://${path}`);

/** Share messages, from remote config (copy.share). */
export const SHARE_COPY = {
  x: (code: string, link: string) => fmt(rc('copy.share').x, { code, link }),
  whatsapp: (code: string, link: string) => fmt(rc('copy.share').whatsapp, { code, link }),
  story: (code: string, link: string) => fmt(rc('copy.share').story, { code, link }),
  imageCaption: (code: string, link: string) => fmt(rc('copy.share').image_caption, { code, link }),
  invite: (code: string, link: string) => fmt(rc('copy.share').invite_message, { code, link }),
};

/** Invite link for a referral code. */
export function inviteLink(code: string): string {
  return `${rc('copy.share').invite_link_base}${code}`;
}

/** What happened, so the UI can tell the user what to do next. */
export type ShareOutcome = 'opened' | 'sheet';

async function copy(text: string) {
  try { await Clipboard.setStringAsync(text); } catch {}
}

async function openFirst(urls: string[]): Promise<boolean> {
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      // App not installed / scheme not handled: try the next one.
    }
  }
  return false;
}

async function imageSheet(imagePath: string | null, message: string) {
  if (imagePath && RNShare) {
    await RNShare.open({ url: asFileUrl(imagePath), type: 'image/png', message, failOnCancel: false });
    return;
  }
  const { shareAsync, isAvailableAsync } = require('expo-sharing');
  if (imagePath && (await isAvailableAsync())) {
    await shareAsync(asFileUrl(imagePath), { mimeType: 'image/png', dialogTitle: 'Share your Iris invite', UTI: 'public.png' });
    return;
  }
  const { Share } = require('react-native');
  await Share.share({ message });
}

/** Instagram Stories with the invite card as the background; caption copied for a text sticker. */
export async function shareToInstagramStory(imagePath: string | null, caption: string): Promise<ShareOutcome> {
  await copy(caption);
  const appId = facebookAppId();
  const canDirect = RNShare && imagePath && (Platform.OS === 'android' || !!appId);
  if (canDirect) {
    try {
      await RNShare.shareSingle({
        social: RNShare.Social.INSTAGRAM_STORIES,
        appId,
        backgroundImage: asFileUrl(imagePath!),
        backgroundBottomColor: '#0F0F0F',
        backgroundTopColor: '#0F0F0F',
      });
      return 'opened';
    } catch {
      // Instagram not installed: fall through.
    }
  }
  await imageSheet(imagePath, caption);
  return 'sheet';
}

/** X composer with the post text (and, on Android, the invite card attached). */
export async function shareToX(text: string, imagePath: string | null): Promise<ShareOutcome> {
  await copy(text);
  if (RNShare && imagePath && Platform.OS === 'android') {
    try {
      await RNShare.shareSingle({ social: RNShare.Social.TWITTER, message: text, url: asFileUrl(imagePath), type: 'image/png' });
      return 'opened';
    } catch {
      // X app not installed: fall through.
    }
  }
  const encoded = encodeURIComponent(text);
  await openFirst([`twitter://post?message=${encoded}`, `https://x.com/intent/post?text=${encoded}`]);
  return 'opened';
}

/** WhatsApp chat picker with the message filled in. */
export async function shareToWhatsApp(text: string): Promise<ShareOutcome> {
  const encoded = encodeURIComponent(text);
  await openFirst([`whatsapp://send?text=${encoded}`, `https://wa.me/?text=${encoded}`]);
  return 'opened';
}
