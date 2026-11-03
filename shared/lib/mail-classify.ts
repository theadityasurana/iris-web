/**
 * Inbox category classifier (keyword rules), shared by the app's Messages tab
 * and the website inbox. Moved verbatim from app/(tabs)/messages/index.tsx.
 */
import type { InboundEmail, SentEmail } from '@/lib/resend';

export type CategoryTab = 'Primary' | 'Promotions' | 'Social' | 'Updates' | 'OTP' | 'Interview' | 'Job Offers' | 'Onboarding' | 'Reminder' | 'Rejection' | 'Assessment';
export const DEFAULT_CATEGORY_TABS: CategoryTab[] = ['Primary', 'Updates', 'Promotions', 'Social', 'OTP', 'Interview', 'Job Offers', 'Onboarding', 'Reminder', 'Rejection', 'Assessment'];
export type MailItem =
  | { kind: 'inbound'; data: InboundEmail }
  | { kind: 'sent'; data: SentEmail };

const OTP_KEYWORDS = [
  'otp', 'one-time password', 'one time password', 'verification code',
  'verify your email', 'confirm your email', 'your code is', 'your code:',
  'security code', 'login code', 'sign-in code', 'authentication code',
  '2fa code', 'two-factor', 'two factor', 'passcode', 'temporary password',
  'use this code', 'enter this code', 'your pin is', 'confirm code',
  'magic link', 'verify your account', 'enter the code', 'digit code',
  'valid for', 'one time code', 'email verification',
  'verify your identity', 'confirm your identity',
];
const INTERVIEW_KEYWORDS = [
  'interview scheduled', 'interview invitation', 'interview confirmation',
  'phone screen', 'technical interview', 'behavioral interview',
  'panel interview', 'interview round', 'interview slot',
  'interview reminder', 'meet the team', 'interview call',
  'hiring manager', 'recruiter call', 'screening call',
  'video interview', 'on-site interview', 'final round',
  'interview feedback', 'interview availability', 'schedule your interview',
  'interview link', 'interview details', 'interview invite',
  'interview with', 'your interview', 'upcoming interview',
  'next steps in your application', 'move forward with your application',
  'like to schedule', 'availability for a call',
  'shortlisted for', 'selected for the next round',
];
const INTERVIEW_SUBJECT_KEYWORDS = ['interview'];
const JOB_OFFER_KEYWORDS = [
  'job offer', 'offer letter', 'we are pleased to offer',
  'pleased to extend', 'offer of employment', 'compensation package',
  'salary offer', 'formal offer', 'contingent offer',
  'offer details', 'accept this offer', 'sign your offer',
  'congratulations on your offer', 'employment offer',
  'we would like to offer you', 'extend an offer',
  'your offer letter', 'offer acceptance', 'joining bonus',
  'we are excited to offer', 'offer from',
];
const ONBOARDING_KEYWORDS = [
  'onboarding', 'welcome aboard', 'welcome to the team',
  'first day at', 'your start date', 'new hire orientation',
  'new employee orientation', 'pre-boarding',
  'employee handbook', 'your equipment', 'laptop setup',
  'welcome kit', 'joining formalities', 'i-9 form', 'w-4 form',
  'background check completed', 'new joiner', 'getting started at',
  'your first week', 'day one', 'joining date',
  'reporting manager', 'your team', 'welcome to',
];
const REMINDER_KEYWORDS = [
  'gentle reminder', 'friendly reminder', 'just a reminder',
  'action required', 'action needed',
  'deadline approaching', 'expiring soon',
  'last chance to apply', 'time sensitive',
  'please complete your application', 'still waiting for your response',
  'follow up on your application', 'complete your profile',
  'pending application', 'application incomplete',
  'reminder to complete', 'don\'t forget to apply',
  'your application is pending',
];
const REJECTION_KEYWORDS = [
  'we regret to inform', 'not moving forward with your',
  'decided not to proceed', 'will not be proceeding',
  'not selected for', 'application unsuccessful',
  'position has been filled', 'we have decided to go with another',
  'unable to offer you the position', 'your application was not successful',
  'not shortlisted for', 'unfortunately we will not be',
  'not be moving forward with your', 'we have chosen another',
  'will not be advancing your', 'did not move forward with your',
  // Common real-world rejection phrases
  'decided not to move forward', 'have decided not to move forward',
  'not move forward with your application', 'not move forward with your candidacy',
  'not to move forward with your', 'decided not to proceed with your',
  'not proceeding with your application', 'not proceeding with your candidacy',
  'after careful consideration', 'after reviewing your application',
  'after reviewing all applications', 'after reviewing all of the applications',
  'after receiving all the applications', 'after reviewing the applications we received',
  'we will not be moving forward', 'we are not moving forward',
  'we are unable to move forward', 'we are unable to offer you',
  'we have decided to pursue other candidates', 'pursue other candidates',
  'pursue candidates whose experience', 'pursue candidates with',
  'other candidates more closely', 'other candidates whose qualifications',
  'not the right fit', 'not a right fit', 'not the right match',
  'unfortunately, we will not', 'unfortunately we will not',
  'unfortunately, we have decided', 'unfortunately we have decided',
  'unfortunately, we are not', 'unfortunately we are not',
  'we appreciate your time', // often paired with rejection
  'we wish you the best', 'wish you all the best in your',
  'best of luck in your job search', 'best of luck with your search',
  'best of luck in your future', 'success in your job search',
];
// Rejection requires BOTH a polite phrase AND a negative signal
const REJECTION_NEGATIVE = [
  'not moving forward', 'will not be proceeding', 'not selected',
  'regret to inform', 'other candidates who more closely',
  'position has been filled', 'decided not to proceed',
  'not be advancing', 'did not move forward', 'unable to offer you',
  'not shortlisted', 'application unsuccessful',
  'will not be able to offer', 'chosen to move forward with another',
  'not a match', 'does not align',
  // Additional negative signals
  'decided not to move forward', 'not move forward with your',
  'not proceeding with your', 'pursue other candidates',
  'not the right fit', 'not a right fit', 'not an ideal fit', 'not the ideal fit',
  "isn't an ideal fit", "isn't a fit", "isn't the right fit",
  "isn’t an ideal fit", "isn’t a fit", "isn’t the right fit",
  "won't be moving forward", "we won't be moving forward",
  "won’t be moving forward", "we won’t be moving forward",
  'unfortunately, we', 'unfortunately we have decided',
  'unfortunately we will not', 'unfortunately we are not',
  'unfortunately, there', 'unfortunately there isn',
  'unfortunately, there isn’t', 'there isn’t a fit', 'there isn’t an ideal fit',
  "there isn't a fit", "there isn't an ideal fit",
  'after reviewing all', 'after receiving all the applications',
];
// Positive/neutral signals that indicate acknowledgement, NOT rejection
const APPLICATION_POSITIVE_SIGNALS = [
  'we will be in touch', 'will be in touch',
  'if your qualifications match', 'if your qualification matches',
  'keep an eye', 'please keep an eye',
  'we are delighted', 'delighted to receive',
  'excited to review',
  'under review', 'being reviewed', 'currently reviewing',
  'will review your', 'our team will review',
  'we will get back to you', 'get back to you',
  'hear from us', 'you will hear from us',
  'next steps will be shared', 'stay tuned',
  'thank you for your patience', 'application is being processed',
  'we appreciate your application', 'we appreciate your interest',
  'thank you for applying', 'thanks for applying',
  'thanks for your interest', 'thank you for your interest',
];
const ASSESSMENT_KEYWORDS = [
  'coding test', 'coding challenge', 'take-home assignment',
  'online test', 'aptitude test', 'skill assessment',
  'technical assessment', 'hackerrank', 'codility', 'leetcode',
  'codesignal', 'testgorilla', 'complete this test',
  'take-home', 'case study', 'work sample test',
  'assessment link', 'timed test', 'complete the assessment',
  'your test is ready', 'pre-employment test',
  'online assessment', 'coding round', 'complete the test',
  'test invitation', 'assessment invitation',
];
// Application submitted / acknowledgement  - goes to Updates
const APPLICATION_ACK_KEYWORDS = [
  'application received', 'application submitted',
  'we received your application', 'thank you for applying',
  'thanks for applying', 'application confirmation',
  'successfully applied', 'your application for',
  'application has been submitted', 'we have received your',
  'application status', 'applied to', 'applied for',
  'application to', 'your application has been',
];
const PROMO_KEYWORDS = [
  'unsubscribe from', 'discount code', 'sale ends', 'deal of the day',
  'promo code', 'coupon code', 'free trial', 'limited time offer',
  'buy now', 'shop now', 'order now', 'exclusive offer',
  '% off', 'clearance sale', 'black friday', 'cyber monday',
  'flash sale', 'newsletter', 'marketing email',
  'advertisement', 'sponsored content', 'cashback offer',
  'special offer', 'save up to', 'don\'t miss out',
  'act now', 'limited stock', 'best deal',
];
const PROMO_WEAK_KEYWORDS = [
  'offer', 'discount', 'sale', 'deal', 'promo', 'coupon',
  'exclusive', 'save', 'reward', 'subscribe',
];
const SOCIAL_KEYWORDS = [
  'followed you', 'liked your', 'commented on your',
  'mentioned you', 'tagged you in', 'friend request',
  'connection request', 'new follower', 'shared a post',
  'reacted to your', 'invitation to connect', 'endorsed you',
  'sent you a message', 'wants to connect',
  'accepted your request', 'posted in your',
];
const SOCIAL_SENDERS = [
  'facebook', 'twitter', 'linkedin', 'instagram', 'tiktok', 'snapchat',
  'reddit', 'discord', 'slack', 'whatsapp', 'telegram', 'pinterest',
  'youtube', 'twitch', 'x.com', 'threads', 'mastodon', 'noreply@github',
  'notifications@github', 'notify@twitter',
];
const UPDATE_KEYWORDS = [
  'your order has', 'shipping update', 'delivered to',
  'tracking number', 'payment receipt', 'payment confirmation',
  'invoice for', 'transaction alert', 'security alert',
  'password changed', 'password reset', 'account update',
  'billing statement', 'subscription renewed', 'subscription expiring',
  'your account has', 'sign-in from', 'new login from',
  'order confirmation', 'shipment update', 'delivery update',
];
// Known job platform senders  - helps classify ambiguous emails
const JOB_PLATFORM_SENDERS = [
  'naukri', 'indeed', 'linkedin', 'glassdoor', 'monster',
  'lever', 'greenhouse', 'workday', 'icims', 'smartrecruiters',
  'ashbyhq', 'bamboohr', 'jazz', 'breezy', 'recruitee',
  'wellfound', 'angellist', 'hired', 'triplebyte', 'turing',
  'toptal', 'instahyre', 'cutshort', 'hirist', 'foundit',
  'talent.com', 'ziprecruiter', 'dice', 'careerbuilder',
];

// Classification scans subject + body text; rows and tab badges ask for it on
// every render. React Query keeps item objects stable, so cache per object.
const classifyCache = new WeakMap<MailItem, CategoryTab>();
export function classifyEmail(item: MailItem): CategoryTab {
  const cached = classifyCache.get(item);
  if (cached) return cached;
  const result = classifyEmailUncached(item);
  classifyCache.set(item, result);
  return result;
}

function classifyEmailUncached(item: MailItem): CategoryTab {
  if (item.kind === 'sent') return 'Primary';
  const d = item.data as InboundEmail;
  const subject = (d.subject || '').toLowerCase();
  const bodyText = (d.body_text || '').toLowerCase();
  const senderEmail = (d.from_email || '').toLowerCase();
  const senderName = (d.from_name || '').toLowerCase();
  const blob = [senderEmail, senderName, subject, bodyText].join(' ');

  // Always Primary for internal Iris emails
  if (senderEmail === 'iris@nextquark.in' || senderEmail === 'founders.nextquark@gmail.com') return 'Primary';

  const has = (keywords: string[]) => keywords.some((k) => blob.includes(k));
  const subjectHas = (keywords: string[]) => keywords.some((k) => subject.includes(k));
  const isFromJobPlatform = JOB_PLATFORM_SENDERS.some((s) => senderEmail.includes(s));

  // 1. OTP  - highest priority
  if (has(OTP_KEYWORDS)) return 'OTP';

  // 2. Rejection  - only if negative signal present AND no positive/neutral acknowledgement signals
  const hasNegative = REJECTION_NEGATIVE.some((k) => blob.includes(k));
  // "thank you for applying" alone is NOT a positive signal if paired with rejection phrases
  const hasStrongPositiveSignal = APPLICATION_POSITIVE_SIGNALS
    .filter((k) => !['thank you for applying', 'thanks for applying', 'thank you for your interest', 'thanks for your interest', 'we appreciate your interest'].includes(k))
    .some((k) => blob.includes(k));
  if (hasNegative && !hasStrongPositiveSignal) return 'Rejection';
  if (has(REJECTION_KEYWORDS) && !hasStrongPositiveSignal && !has(APPLICATION_ACK_KEYWORDS)) return 'Rejection';

  // 3. Job Offers
  if (has(JOB_OFFER_KEYWORDS)) return 'Job Offers';

  // 4. Assessment  - coding tests, online assessments
  if (has(ASSESSMENT_KEYWORDS)) return 'Assessment';

  // 5. Interview  - multi-word phrases or "interview" in subject
  if (has(INTERVIEW_KEYWORDS) || subjectHas(INTERVIEW_SUBJECT_KEYWORDS)) return 'Interview';

  // 6. Onboarding
  if (has(ONBOARDING_KEYWORDS)) return 'Onboarding';

  // 7. Application acknowledgements → Updates ("thank you for applying" without rejection signals)
  if (has(APPLICATION_ACK_KEYWORDS) && !hasNegative) return 'Updates';

  // 8. Reminder (job-focused reminders)
  if (has(REMINDER_KEYWORDS)) return 'Reminder';

  // 9. Social
  if (SOCIAL_SENDERS.some((s) => senderEmail.includes(s))) return 'Social';
  if (has(SOCIAL_KEYWORDS)) return 'Social';

  // 10. Promotions
  if (has(PROMO_KEYWORDS)) return 'Promotions';
  if (bodyText.includes('unsubscribe') && PROMO_WEAK_KEYWORDS.some((k) => blob.includes(k))) return 'Promotions';

  // 11. Updates  - transactional + job platform generic emails
  if (has(UPDATE_KEYWORDS)) return 'Updates';
  if (isFromJobPlatform) return 'Updates';

  return 'Primary';
}
