import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import Constants from 'expo-constants';

let isExpoGo = true;
try { isExpoGo = Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo'; } catch (_) {}

let Notifications: typeof import('expo-notifications') | null = null;
let Device: typeof import('expo-device') | null = null;

function loadNotifications() {
  if (isExpoGo) return;
  try {
    const NotifModule = require('expo-notifications');
    if (NotifModule && typeof NotifModule.getPermissionsAsync === 'function') {
      Notifications = NotifModule;
    }
  } catch {
    Notifications = null;
  }
  try {
    Device = require('expo-device');
  } catch {
    Device = null;
  }
  if (Notifications) {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch {
      Notifications = null;
    }
  }
}

// Delay loading to avoid synchronous crash during module init in Expo Go SDK 53+
setTimeout(loadNotifications, 0);

// --- Keys ---
const IDX_MOTIVATIONAL = 'nq_notif_idx_motivational';

// --- Push token registration ---

/**
 * Called at every sign-in. Creates the Android channels (each on its own, so
 * one failure — e.g. Expo Go's NullPointerException — can't abort the rest or
 * the token), then registers the push token ONLY if permission was already
 * granted. Asking happens in onboarding (StepNotifications): prompting here
 * popped the system dialog at a random moment, and a "Don't allow" then meant
 * onboarding could never ask again.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications || !Device) return null;
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    const channels: [string, Parameters<typeof Notifications.setNotificationChannelAsync>[1]][] = [
      ['default', { name: 'Default', importance: Notifications.AndroidImportance.MAX, vibrationPattern: [0, 250, 250, 250], lightColor: '#FF231F7C' }],
      ['motivational', { name: 'Motivation', importance: Notifications.AndroidImportance.HIGH }],
      ['swipes', { name: 'Daily Swipes', importance: Notifications.AndroidImportance.HIGH }],
    ];
    for (const [id, config] of channels) {
      try {
        await Notifications.setNotificationChannelAsync(id, config);
      } catch (error) {
        if (__DEV__) console.log(`Notification channel "${id}" not created (non-fatal):`, error);
      }
    }
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return null;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '24bd2a4b-c0d1-4133-9ab2-4d8ba7dbfd18',
    });
    return token.data;
  } catch (error) {
    if (__DEV__) console.log('Error registering for push notifications:', error);
    return null;
  }
}

export async function savePushToken(userId: string, pushToken: string) {
  try {
    // Try upsert on user_id only - one token per user
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert({
        user_id: userId,
        push_token: pushToken,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    if (error) {
      // Fallback: plain insert if constraint doesn't match
      if (__DEV__) console.log('Push token upsert fallback:', error.message);
      await supabase.from('user_push_tokens').insert({
        user_id: userId,
        push_token: pushToken,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    if (__DEV__) console.log('Error saving push token (non-critical):', e);
  }
}

// --- Rotation helper ---

async function getAndAdvanceIndex(key: string, total: number): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const idx = raw ? parseInt(raw, 10) : 0;
    const current = isNaN(idx) ? 0 : idx % total;
    await AsyncStorage.setItem(key, String((current + 1) % total));
    return current;
  } catch {
    return 0;
  }
}

// --- Cancel helpers ---

async function cancelByType(type: string) {
  if (!Notifications) return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of scheduled) {
      if (n.content.data?.type === type) {
        await Notifications.cancelScheduledNotificationAsync(n.identifier);
      }
    }
  } catch {}
}

// ============================================================
// 50 MOTIVATIONAL / "START SWIPING" MESSAGES
// ============================================================

const MOTIVATIONAL_MESSAGES = [
  "Your dream job won't apply itself! Start swiping and make it happen!",
  "Opportunities are waiting. Open the app and start swiping!",
  "The perfect role could be just one swipe away. Don't miss it! 👆",
  "Feeling stuck? A quick swipe session could change everything!",
  "Your next career move is hiding in your feed. Start swiping! 🔍",
  "15 minutes of swiping today could lead to a lifetime of success! ⏱️",
  "The best candidates are proactive. Be one - start swiping now!",
  "New jobs just dropped! Swipe through them before they're gone! 🆕",
  "Your skills deserve the spotlight. Swipe right on your future!",
  "Don't let great opportunities pass you by. Start swiping!",
  "A little effort every day goes a long way. Time to swipe! 📈",
  "Your competition is swiping right now. Stay ahead of the game!",
  "The job market is hot today. Get in there and start swiping!",
  "One swipe could lead to one interview could lead to one offer!",
  "Invest in your future - it only takes a few swipes! 💰",
  "Fresh opportunities are waiting for you. Start swiping!",
  "Your career won't build itself. Take action - swipe now!",
  "The afternoon is perfect for a quick job hunt. Start swiping! 🌤️",
  "Remember why you started. Now keep going - swipe!",
  "Success favors the bold. Be bold and start swiping! 🦁",
  "Your next big break is one swipe away. Go find it!",
  "Take a break from the routine - swipe on something exciting! 🎢",
  "The right job is looking for someone exactly like you. Swipe! 🤝",
  "Don't wait for opportunity to knock. Swipe the door open! 🚪",
  "A few swipes a day keeps unemployment away! Start now! 😄",
  "Your future self is cheering you on. Start swiping! 📣",
  "Great things never came from comfort zones. Swipe into action! 🌊",
  "The afternoon slump is real. Beat it with a swipe session!",
  "Your talent is too good to sit idle. Start swiping!",
  "Every swipe is a step toward your dream career. Take one now!",
  "The best time to swipe was yesterday. The next best time is now!",
  "Unlock new possibilities with just a few swipes! 🔓",
  "Your profile is looking great. Now put it to work - swipe!",
  "Momentum is everything. Keep it going with a quick swipe! 🎳",
  "The job market rewards consistency. Swipe a little every day! 🔄",
  "You're closer than you think. One more swipe session could do it!",
  "Turn your afternoon into a career-building session. Start swiping! 🏋️",
  "New matches are waiting for you. Open up and start swiping! 💌",
  "Your resume is ready. Your skills are sharp. Now swipe!",
  "Don't let today pass without making a move. Swipe now! 🎬",
  "The perfect job doesn't wait. Neither should you. Start swiping!",
  "A swipe a day keeps career regret away! Let's go!",
  "Your network grows with every application. Start swiping! 🕸️",
  "Feeling motivated? Channel that energy into swiping!",
  "The afternoon is young and so is your career. Swipe!",
  "Small actions create big results. Start with a swipe! 🧩",
  "Your dream company might have just posted a role. Check it out! 🏢",
  "Stay in the game. A quick swipe session keeps you competitive! 🎮",
  "You've got the skills, the drive, and the app. Now swipe! 📱",
  "End your afternoon on a high note - swipe into your future! 🎵",
];

// ============================================================
// WELCOME NOTIFICATION
// ============================================================

export async function sendWelcomeNotification(firstName: string) {
  if (!Notifications) return;
  try {
    const name = firstName || 'there';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Welcome to Iris, ${name}!`,
        body: "Your profile is set up! Start swiping to discover your dream job. We're rooting for you!",
        data: { type: 'welcome' },
        ...(Platform.OS === 'android' && { channelId: 'default' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 3,
      },
    });
  } catch (e) {
    if (__DEV__) console.log('Error sending welcome notification:', e);
  }
}

// ============================================================
// SUBSCRIPTION UPGRADE NOTIFICATION
// ============================================================

const SUBSCRIPTION_NOTIFICATIONS: Record<string, { title: string; body: string }> = {
  premium: { title: 'Welcome to Premium! \u{1F451}', body: 'You\'ve unlocked unlimited applications and all exclusive features. Go land your dream job!' },
  coupon: { title: 'Plan Activated! \u{1F381}', body: 'Your coupon has been applied and your plan is now active. Enjoy!' },
};

export async function sendSubscriptionNotification(planType: string, isCoupon?: boolean) {
  if (!Notifications) return;
  try {
    const config = isCoupon ? SUBSCRIPTION_NOTIFICATIONS.coupon : (SUBSCRIPTION_NOTIFICATIONS[planType] || SUBSCRIPTION_NOTIFICATIONS.custom);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: config.title,
        body: config.body,
        data: { type: 'subscription_upgrade', plan: planType },
        ...(Platform.OS === 'android' && { channelId: 'default' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  } catch (e) {
    if (__DEV__) console.log('Error sending subscription notification:', e);
  }
}

// ============================================================
// SCHEDULE MOTIVATIONAL / "START SWIPING" (4 PM daily, rotating)
// ============================================================

export async function scheduleMotivationalReminder(firstName: string) {
  if (!Notifications) return;
  try {
    await cancelByType('motivational_reminder');
    const idx = await getAndAdvanceIndex(IDX_MOTIVATIONAL, MOTIVATIONAL_MESSAGES.length);
    const name = firstName || 'there';
    const msg = MOTIVATIONAL_MESSAGES[idx];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Hey ${name}, time to swipe!`,
        body: msg,
        data: { type: 'motivational_reminder' },
        ...(Platform.OS === 'android' && { channelId: 'motivational' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 16,
        minute: 0,
      },
    });
  } catch (e) {
    if (__DEV__) console.log('Error scheduling motivational notification:', e);
  }
}

export async function cancelMotivationalReminder() {
  await cancelByType('motivational_reminder');
}

// ============================================================
// 20 "WE MISS YOU" MESSAGES
// ============================================================

const MISS_YOU_MESSAGES = [
  "We're missing you! New jobs are waiting for your swipe. Come back!",
  "It's been a while! Fresh opportunities have been added just for you.",
  "Your dream job might have just been posted. Don't miss out!",
  "Hey, we noticed you've been away. The job market is buzzing - come check it out!",
  "Swipe Jobs misses you! New roles from top companies are live now. 🏢",
  "Opportunities don't wait forever. Come back and keep swiping!",
  "Your next career move could be one swipe away. We miss you!",
  "The best candidates stay active. Come back and stay ahead!",
  "New jobs matching your profile just dropped. Come take a look!",
  "We've been saving the best jobs for you. Come back and explore!",
  "Your profile is still looking great. Now put it to work - come swipe! 📱",
  "Miss swiping? We miss you too! New opportunities await. 👋",
  "The job market never sleeps, and neither should your hustle. Come back!",
  "Great things happen to those who show up. We're waiting for you!",
  "Your career journey isn't over. Come back and keep building!",
  "Recruiters are looking for someone like you. Don't keep them waiting! 🤝",
  "A quick swipe session could change everything. We miss you!",
  "New companies, new roles, new possibilities. Come see what's new! 🆕",
  "Your competition is swiping. Stay in the game - come back! 🎮",
  "We saved your spot. Come back and pick up where you left off! 🔖",
];

// ============================================================
// SCHEDULE "WE MISS YOU" (fires 24h after last app open)
// ============================================================

export async function scheduleMissYouNotification(firstName: string) {
  if (!Notifications) return;
  try {
    await cancelByType('miss_you');
    const name = firstName || 'there';
    const idx = Math.floor(Math.random() * MISS_YOU_MESSAGES.length);
    const msg = MISS_YOU_MESSAGES[idx];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `We miss you, ${name}! 👋`,
        body: msg,
        data: { type: 'miss_you' },
        ...(Platform.OS === 'android' && { channelId: 'default' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 24 * 60 * 60, // 24 hours
      },
    });
  } catch (e) {
    if (__DEV__) console.log('Error scheduling miss-you notification:', e);
  }
}

export async function cancelMissYouNotification() {
  await cancelByType('miss_you');
}

// ============================================================
// SCHEDULE TRENDING JOB (7 PM daily, random job with deep link)
// ============================================================

async function fetchRandomJob(): Promise<{ id: string; title: string; company: string } | null> {
  try {
    const { count } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
    if (!count || count === 0) return null;

    const randomOffset = Math.floor(Math.random() * count);
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, job_title, company_name')
      .range(randomOffset, randomOffset)
      .limit(1)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      title: data.title || data.job_title || 'A new role',
      company: data.company_name || 'a top company',
    };
  } catch {
    return null;
  }
}

export async function scheduleTrendingJobNotification(firstName: string) {
  if (!Notifications) return;
  try {
    await cancelByType('trending_job');
    const job = await fetchRandomJob();
    if (!job) return;

    const name = firstName || 'there';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔥 Trending Job Alert, ${name}!`,
        body: `${job.title} at ${job.company} is trending right now! Tap to view details.`,
        data: { type: 'trending_job', job_id: job.id },
        ...(Platform.OS === 'android' && { channelId: 'default' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 19,
        minute: 0,
      },
    });
  } catch (e) {
    if (__DEV__) console.log('Error scheduling trending job notification:', e);
  }
}

export async function cancelTrendingJobNotification() {
  await cancelByType('trending_job');
}

// ============================================================
// MASTER SCHEDULER - call on every app open / login
// ============================================================

export async function scheduleAllNotifications(firstName: string) {
  await scheduleMotivationalReminder(firstName);
  await scheduleMissYouNotification(firstName);
  await scheduleTrendingJobNotification(firstName);
}

// ============================================================
// DAILY SWIPES RESTORED NOTIFICATION
// ============================================================

export async function scheduleSwipesRestoredNotification(secondsUntilReset: number, firstName: string) {
  if (!Notifications || secondsUntilReset <= 0) return;
  try {
    await cancelByType('swipes_restored');
    const name = firstName || 'there';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Your swipes are back, ${name}!`,
        body: 'Your 10 free monthly swipes have been renewed. Start swiping and land your dream job!',
        data: { type: 'swipes_restored' },
        ...(Platform.OS === 'android' && { channelId: 'swipes' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.ceil(secondsUntilReset)),
      },
    });
  } catch (e) {
    if (__DEV__) console.log('Error scheduling swipes restored notification:', e);
  }
}

export async function cancelSwipesRestoredNotification() {
  await cancelByType('swipes_restored');
}

// ============================================================
// JOBS READY NOTIFICATION
// ============================================================

export async function sendJobsReadyNotification(firstName: string) {
  if (!Notifications) return;
  try {
    const name = firstName || 'there';
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Your jobs are ready, ${name}! 🎉`,
        body: "We've loaded your personalized job feed. Tap to start swiping!",
        data: { type: 'jobs_ready', screen: '/(tabs)/(home)' },
        ...(Platform.OS === 'android' && { channelId: 'default' }),
      },
      trigger: null, // fire immediately
    });
  } catch (e) {
    if (__DEV__) console.log('Error sending jobs ready notification:', e);
  }
}

// ============================================================
// NEW EMAIL NOTIFICATION
// ============================================================

export async function sendNewEmailNotification(fromName: string, subject: string) {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: fromName || 'New email',
        body: subject || '(no subject)',
        data: { type: 'new_email' },
        ...(Platform.OS === 'android' && { channelId: 'default' }),
      },
      trigger: null,
    });
  } catch (e) {
    if (__DEV__) console.log('Error sending new email notification:', e);
  }
}

// ============================================================
// REMOTE NOTIFICATIONS (Supabase - kept for compatibility)
// ============================================================

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'broadcast' | 'user_specific';
  data: Record<string, any>;
  created_at: string;
  read?: boolean;
}

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`target_user_id.is.null,target_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return [];

    return (data || []).map((n: any) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      data: n.data || {},
      created_at: n.created_at,
    }));
  } catch {
    return [];
  }
}
