/**
 * Built-in defaults for remote config (the `remote_config` table).
 *
 * These are exactly how the app behaved before remote config existed, and they
 * are what the app falls back to when the server is unreachable or a stored
 * value has the wrong shape. The SQL seed is generated from this file
 * (scripts/remote-config-seed.ts), so the database starts out identical.
 *
 * Text may contain placeholders, filled in by `fmt()` in lib/remote-config.ts:
 *   {code} {link} {referral_reward} {follow_reward} {countdown}
 *   {title} {company} (job share message only)
 *
 * Pure data: imported by the app and bundled into edge functions.
 */

export const DEFAULT_REMOTE_CONFIG = {
  /** Numbers that decide what users get. Also read by the database functions that grant them. */
  limits: {
    free_swipes_per_cycle: 10,
    free_cycle_days: 30,
    referral_reward_referrer: 5,
    referral_reward_referee: 5,
    social_follow_reward: 2,
    new_user_application_credits: 15,
  },

  /** On/off switches and small behaviour knobs. */
  features: {
    ai_role_filter_enabled: false,
    splash_min_ms: 1400,
    share_targets: ['story', 'x', 'whatsapp'] as string[],
    show_more_share_options: true,
    social_follow_enabled: true,
    /** 'client' = feed built on the phone (current); 'server' = built by the get-feed function. */
    feed_source: 'client' as string,
  },

  /** Social accounts users are asked to follow. */
  social: {
    links: {
      instagram: 'https://www.instagram.com/irisapp.si/',
      twitter: 'https://x.com/irisapp_si',
      linkedin: 'https://www.linkedin.com/company/tryiris/posts/?viewAsMember=true',
    } as Record<string, string>,
    follow_items: [
      { platform: 'instagram', label: 'Follow us on Instagram' },
      { platform: 'twitter', label: 'Follow us on Twitter' },
      { platform: 'linkedin', label: 'Follow us on LinkedIn' },
    ],
    /**
     * Meta (Facebook) App ID. Instagram only accepts a direct "Share to Story"
     * hand-off from apps that send one (iOS and Android); without it the app
     * falls back to the share sheet. Overrides EXPO_PUBLIC_FACEBOOK_APP_ID.
     */
    facebook_app_id: '',
  },

  /** Messages users send when they share. */
  'copy.share': {
    invite_link_base: 'https://irisjobs.live/invite/',
    x: "I'm using Iris: swipe right on a job and AI applies for you. Use my code {code} and we both get {referral_reward} free swipes.\n\n{link}",
    whatsapp: "Hey! I've been using Iris to apply to jobs. You just swipe right and AI handles the application. Use my code *{code}* and we both get {referral_reward} free swipes: {link}",
    story: 'Use my code {code} on Iris for {referral_reward} free swipes 👉 {link}',
    image_caption: "Hey! Check out Iris — it's like Tinder for jobs. Swipe right and AI applies for you automatically. Use my referral link and we both get {referral_reward} free swipes: {link}",
    invite_message: "Hey! Check out Iris  - think of it like Tinder for jobs. You swipe right on jobs you like and AI applies for you automatically. It's the fastest way to apply to hundreds of jobs. Use my referral link and we both get {referral_reward} free swipes to get started: {link}",
    job_share: 'Hey! Check out this role\n\n{title} at {company}\n\nYou can apply just by swiping right on Iris\n\n{link}',
  },

  /** The Free Swipes sheet (referrals + follows). */
  'copy.free_swipes': {
    title: 'Free Swipes',
    subtitle: 'Invite a friend — you both get {referral_reward} free swipes',
    code_label: 'YOUR REFERRAL CODE',
    code_generating: 'Generating…',
    copy_button: 'Copy Code',
    stat_friends: 'Friends Joined',
    stat_swipes: 'Swipes Earned',
    how_title: 'How it works',
    steps: ['Share your code with a friend', 'They sign up using your code', 'You both get {referral_reward} free swipes'],
    follow_title: 'Follow us for free swipes',
    follow_subtitle: 'Get {follow_reward} free swipes for each follow!',
    follow_badge: '+{follow_reward} swipes',
    follow_claimed: 'Claimed',
    share_story: 'Story',
    share_x: 'Post on X',
    share_whatsapp: 'WhatsApp',
    more_share: 'More ways to share',
    toast_caption_copied: 'Caption copied — paste it after sharing the image',
    toast_story_opened: 'Caption copied — paste it as a text sticker',
    toast_story_sheet: 'Caption copied — pick Instagram → Story, then paste it',
  },

  /** The "You're out of swipes" sheet on the home feed. */
  'copy.out_of_swipes': {
    title: 'You’re out of swipes',
    reset_countdown: 'Free swipes reset in {countdown}',
    reset_soon: 'Free swipes reset soon',
    body: 'Upgrade to keep applying now, or invite friends to earn free swipes.',
    premium_title: 'Go Premium',
    premium_badge: 'BEST VALUE',
    premium_benefits: ['From 75 applications a month', 'Iris auto-applies for you', 'Resume tailored to every job'],
    premium_cta: 'Upgrade to Premium',
    free_title: 'Or earn free swipes',
    invite_title: 'Invite friends',
    invite_body: '+{referral_reward} swipes for you and each friend',
    follow_title: 'Follow Iris',
    follow_body: '+{follow_reward} swipes for each follow',
    later: 'Maybe later',
  },

  /** Job card layout. Config can hide or reorder pieces the app already draws. */
  job_card: {
    header: { show_match_badge: true, show_location: false, show_linkedin: true },
    chips: {
      order: ['industry', 'company_type', 'employment_type', 'location_type', 'experience', 'posted', 'salary', 'level', 'requirements', 'education', 'work_authorization'] as string[],
      hidden: [] as string[],
    },
    sections: {
      order: ['requirements', 'fit_writeup', 'skills', 'benefits'] as string[],
      hidden: [] as string[],
      requirements_limit: 4,
      titles: {
        requirements: 'Requirements',
        fit_writeup: 'Why This Fits You',
        skills: 'Skills',
        benefits: 'Benefits',
        about: 'About the Role',
      } as Record<string, string>,
    },
    hint_text: 'Tap to see full details',
    show_link_button: true,
    show_share_button: true,
  },

  /** Paywall (premium screen). Prices always come from the App Store / Play Store. */
  paywall: {
    plan_order: ['starter', 'pro', 'ultra'] as string[],
    hidden_plans: [] as string[],
    highlighted_plan: 'pro',
    highlight_badge: 'POPULAR',
    default_plan: 'starter',
    default_billing_period: 'quarterly',
    features: {
      free: [
        { label: 'Job applications / month', included: '15' },
        { label: 'Resume uploads', included: '1' },
        { label: 'AI auto-fill', included: 'yes' },
        { label: 'Job matching & ranking', included: 'yes' },
        { label: 'Iris auto-apply', included: 'no' },
        { label: 'Resume tailoring', included: 'no' },
        { label: 'Iris AI mock interviews', included: 'no' },
        { label: 'Priority support', included: 'no' },
      ],
      starter: [
        { label: 'Job applications / month', included: '75' },
        { label: 'Resume uploads', included: '3' },
        { label: 'AI auto-fill', included: 'yes' },
        { label: 'Job matching & ranking', included: 'yes' },
        { label: 'Iris auto-apply', included: 'yes' },
        { label: 'Resume tailoring', included: 'yes' },
        { label: 'Iris AI mock interviews', included: 'no' },
        { label: 'Priority support', included: 'no' },
      ],
      pro: [
        { label: 'Job applications / month', included: '200' },
        { label: 'Resume uploads', included: '5' },
        { label: 'AI auto-fill', included: 'yes' },
        { label: 'Job matching & ranking', included: 'yes' },
        { label: 'Iris auto-apply', included: 'yes' },
        { label: 'Resume tailoring', included: 'yes' },
        { label: 'Iris AI mock interviews', included: 'yes' },
        { label: 'Priority support', included: 'yes' },
      ],
      ultra: [
        { label: 'Job applications / month', included: '500' },
        { label: 'Resume uploads', included: '5' },
        { label: 'AI auto-fill', included: 'yes' },
        { label: 'Job matching & ranking', included: 'yes' },
        { label: 'Iris auto-apply', included: 'yes' },
        { label: 'Resume tailoring', included: 'yes' },
        { label: 'Iris AI mock interviews', included: 'yes' },
        { label: 'Priority support', included: 'yes' },
      ],
    } as Record<string, { label: string; included: string }[]>,
    how_it_works: [
      { n: '01', title: 'Watches 50,000+ career pages', body: 'Workday, Greenhouse, Lever, Ashby and 15+ more ATSes — scanned the moment a role goes live.' },
      { n: '02', title: 'Tailors every application', body: 'Keyword-aligned, ATS-safe materials generated from the actual job description.' },
      { n: '03', title: 'Fills every field', body: 'Login, every field, open-ended questions in your voice, and the upload.' },
      { n: '04', title: 'Manages your pipeline', body: 'Recruiter emails land on the right application. Status moves on its own.' },
    ],
  },

  /** Where company logos come from, tried in order. */
  logos: {
    providers: ['company', 'logo_dev', 'google', 'duckduckgo'] as string[],
  },

  /** Job feed tuning. Used by the on-phone feed and by the get-feed function. */
  feed: {
    title_keywords_cap: 40,
    exclude_ids_cap: 500,
    rpc_timeout_ms: 12000,
    default_company_cap: 2,
    home_company_cap: 1,
    fallback_keyword_count: 8,
    adjacent_share: 0.2,
    adjacent_keywords_cap: 20,
    adjacent_core_ratio: 4,
    interleave_every: 5,
    starting_levels: {
      internship: [0, 1],
      entry_level: [0, 2],
      junior: [1, 3],
      mid: [1, 3],
      senior: [2, 4],
      expert: [4, 5],
    } as Record<string, number[]>,
    generic_single_words: [
      'developer', 'developers', 'engineer', 'engineers', 'programmer', 'research', 'researcher', 'analyst', 'manager',
      'consultant', 'designer', 'scientist', 'specialist', 'associate', 'lead', 'director', 'architect', 'code', 'coding',
      'intern', 'writer', 'operations', 'product', 'data', 'software', 'design', 'marketing', 'sales', 'analytics',
    ] as string[],
    /** Rank jobs in the user's city, then country, then elsewhere (search_jobs p_near_locations). */
    location_tiers_enabled: true,
    /** When a search / filter finds nothing, relax it step by step (lib/feed-search). Off: exact, then the user's own feed. */
    search_relaxation_enabled: true,
    /** Try a spelling-corrected reading of the search ("data analist" → "data analyst"). */
    spelling_correction_enabled: true,
    /** Show the line under the filters saying what was relaxed. */
    show_relax_notice: true,
  },
};

export type RemoteConfig = typeof DEFAULT_REMOTE_CONFIG;
export type RemoteConfigKey = keyof RemoteConfig;

/** One-line descriptions shown to admins (stored in remote_config.description). */
export const REMOTE_CONFIG_DESCRIPTIONS: Record<RemoteConfigKey, string> = {
  limits: 'Free swipes per cycle, cycle length, referral and follow rewards, starting credits. Enforced by the database.',
  features: 'Feature switches: AI role filter, splash duration, share buttons, social follow, feed source.',
  social: 'Social profile links and the "Follow us" rows in the Free Swipes sheet.',
  'copy.share': 'Messages users send when sharing invites or jobs.',
  'copy.free_swipes': 'All text in the Free Swipes (referral) sheet.',
  'copy.out_of_swipes': 'All text in the "You\'re out of swipes" sheet.',
  job_card: 'Job card layout: header items, chip order/visibility, section order/visibility/titles, buttons.',
  paywall: 'Premium screen: plan order, hidden plans, highlighted plan, defaults, feature rows, how-it-works.',
  logos: 'Order of company logo sources.',
  feed: 'Job feed tuning: keyword caps, timeouts, company caps, related-role share, starting levels, generic words, location tiers, search relaxation.',
};
