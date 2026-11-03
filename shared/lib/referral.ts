import { supabase, SUPABASE_FUNCTIONS_URL } from './supabase';
import { addBonusDailySwipes } from './daily-swipes';
import { rc } from './remote-config';

// Rewards come from remote config (limits.*). The database functions
// claim_social_follow / apply_referral_code grant them; the client-side paths
// below are only used until those functions are deployed.
const isMissingRpc = (e: any) => e?.code === 'PGRST202' || e?.code === '42883';

export type SocialPlatform = 'instagram' | 'twitter' | 'linkedin';

const SOCIAL_COLUMN_MAP: Record<SocialPlatform, string> = {
  instagram: 'followed_instagram',
  twitter: 'followed_twitter',
  linkedin: 'followed_linkedin',
};

/** Profile links, from remote config (social.links). */
export function socialUrl(platform: SocialPlatform): string {
  return rc('social').links[platform] ?? '';
}

// Check which social platforms user has already followed
export async function getSocialFollowStatus(userId: string): Promise<Record<SocialPlatform, boolean>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('followed_instagram, followed_twitter, followed_linkedin')
      .eq('id', userId)
      .single();

    if (error || !data) return { instagram: false, twitter: false, linkedin: false };
    return {
      instagram: !!data.followed_instagram,
      twitter: !!data.followed_twitter,
      linkedin: !!data.followed_linkedin,
    };
  } catch {
    return { instagram: false, twitter: false, linkedin: false };
  }
}

// Claim free swipes for following a social platform
export async function claimSocialFollow(
  userId: string,
  platform: SocialPlatform
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: rows, error: rpcErr } = await supabase.rpc('claim_social_follow', { p_platform: platform });
    if (!rpcErr) {
      const row = Array.isArray(rows) ? rows[0] : rows;
      return row?.success ? { success: true } : { success: false, error: row?.message || 'Could not claim' };
    }
    if (!isMissingRpc(rpcErr)) return { success: false, error: rpcErr.message };

    const SWIPES_PER_SOCIAL_FOLLOW = rc('limits').social_follow_reward;
    const col = SOCIAL_COLUMN_MAP[platform];

    // Check if already claimed
    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('followed_instagram, followed_twitter, followed_linkedin, applications_remaining')
      .eq('id', userId)
      .single();

    if (fetchErr || !profile) return { success: false, error: 'Could not fetch profile' };
    if ((profile as any)[col]) return { success: false, error: 'Already claimed' };

    const newRemaining = (profile.applications_remaining || 0) + SWIPES_PER_SOCIAL_FOLLOW;

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({
        [col]: true,
        applications_remaining: newRemaining,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateErr) return { success: false, error: updateErr.message };
    await addBonusDailySwipes(userId, SWIPES_PER_SOCIAL_FOLLOW);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

// Generate unique 8-character referral code
export function generateReferralCode(name: string): string {
  const prefix = name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return prefix + random;
}

// Create referral code for user
export async function createReferralCode(userId: string, userName: string): Promise<string | null> {
  try {
    let code = generateReferralCode(userName);
    let attempts = 0;
    
    // Ensure unique code
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', code)
        .single();
      
      if (!existing) break;
      code = generateReferralCode(userName + attempts);
      attempts++;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ referral_code: code })
      .eq('id', userId);

    return error ? null : code;
  } catch (error) {
    console.error('Error creating referral code:', error);
    return null;
  }
}

// Validate and apply referral code during sign-up
export async function applyReferralCode(
  newUserId: string,
  referralCode: string
): Promise<{ success: boolean; message: string }> {
  try {
    if (__DEV__) console.log('🎁 [REFERRAL] Starting applyReferralCode:', { newUserId, referralCode });
    
    if (!referralCode.trim()) {
      if (__DEV__) console.log('❌ [REFERRAL] Empty referral code');
      return { success: false, message: 'Invalid referral code' };
    }

    // Server-side: one transaction, rewards from remote config.
    const { data: rpcRows, error: rpcErr } = await supabase.rpc('apply_referral_code', { p_code: referralCode });
    if (!rpcErr) {
      const row = Array.isArray(rpcRows) ? rpcRows[0] : rpcRows;
      if (row?.success && row.referrer_id) sendReferralNotification(row.referrer_id, newUserId).catch(() => {});
      return { success: !!row?.success, message: row?.message || 'Failed to apply referral code' };
    }
    if (!isMissingRpc(rpcErr)) return { success: false, message: 'Failed to apply referral code' };
    const SWIPES_PER_REFERRAL = rc('limits').referral_reward_referrer;

    // Find referrer by code (use service role to bypass RLS)
    if (__DEV__) console.log('🔍 [REFERRAL] Looking up referral code:', referralCode.toUpperCase());
    const { data: referrers, error: referrerError } = await supabase
      .from('profiles')
      .select('id, applications_remaining, applications_limit, referral_swipes_earned')
      .eq('referral_code', referralCode.toUpperCase())
      .limit(1);

    if (referrerError || !referrers || referrers.length === 0) {
      if (__DEV__) console.log('❌ [REFERRAL] Referral code not found:', referrerError?.message);
      return { success: false, message: 'Referral code not found' };
    }

    const referrer = referrers[0];
    if (__DEV__) console.log('✅ [REFERRAL] Found referrer:', referrer.id);

    // Prevent self-referral
    if (referrer.id === newUserId) {
      if (__DEV__) console.log('❌ [REFERRAL] Self-referral attempt');
      return { success: false, message: 'Cannot use your own referral code' };
    }

    // Check if user already used a referral code
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('referee_id', newUserId)
      .single();

    if (existingReferral) {
      if (__DEV__) console.log('❌ [REFERRAL] User already used a referral code');
      return { success: false, message: 'You have already used a referral code' };
    }

    if (__DEV__) console.log('💰 [REFERRAL] Awarding swipes to referrer...');
    if (__DEV__) console.log('🔍 [REFERRAL] Referrer current swipes:', {
      applications_remaining: referrer.applications_remaining,
      applications_limit: referrer.applications_limit
    });
    
    // Award swipes to referrer - add 5 swipes to their current balance
    const newReferrerRemaining = (referrer.applications_remaining || 0) + SWIPES_PER_REFERRAL;
    const newReferrerLimit = (referrer.applications_limit || 0) + SWIPES_PER_REFERRAL;
    const newReferrerEarned = ((referrer as any).referral_swipes_earned || 0) + SWIPES_PER_REFERRAL;
    
    // Try RPC function first, fallback to direct update
    let referrerUpdateError = null;
    try {
      const { error: rpcError } = await supabase.rpc('update_referrer_swipes', {
        referrer_user_id: referrer.id,
        swipes_to_add: SWIPES_PER_REFERRAL
      });
      referrerUpdateError = rpcError;
      
      if (rpcError) {
        if (__DEV__) console.log('⚠️ [REFERRAL] RPC failed, trying direct update:', rpcError.message);
        // Fallback: try direct update (might work if RLS allows)
        const { error: directError } = await supabase
          .from('profiles')
          .update({
            applications_remaining: newReferrerRemaining,
            applications_limit: newReferrerLimit,
            referral_swipes_earned: newReferrerEarned,
            updated_at: new Date().toISOString(),
          })
          .eq('id', referrer.id);
        referrerUpdateError = directError;
      }
    } catch (e: any) {
      if (__DEV__) console.log('⚠️ [REFERRAL] Exception updating referrer:', e);
      referrerUpdateError = e;
    }

    if (__DEV__) console.log('🔍 [REFERRAL] Referrer new swipes:', {
      applications_remaining: newReferrerRemaining,
      applications_limit: newReferrerLimit,
      referral_swipes_earned: newReferrerEarned
    });

    if (referrerUpdateError) {
      if (__DEV__) console.log('❌ [REFERRAL] Error updating referrer:', referrerUpdateError.message || referrerUpdateError);
      if (__DEV__) console.log('❌ [REFERRAL] Full error:', JSON.stringify(referrerUpdateError));
    } else {
      if (__DEV__) console.log('✅ [REFERRAL] Referrer updated successfully');
      await addBonusDailySwipes(referrer.id, SWIPES_PER_REFERRAL);
    }

    if (__DEV__) console.log('💰 [REFERRAL] Awarding swipes to new user...');
    // Award swipes to new user - ensure they get exactly 45 swipes (40 default + 5 bonus)
    const { data: newUser } = await supabase
      .from('profiles')
      .select('applications_remaining, applications_limit')
      .eq('id', newUserId)
      .single();

    if (__DEV__) console.log('🔍 [REFERRAL] New user current swipes:', {
      applications_remaining: newUser?.applications_remaining,
      applications_limit: newUser?.applications_limit
    });

    // Add referral bonus swipes to new user's existing balance
    const newUserRemaining = (newUser?.applications_remaining || 0) + SWIPES_PER_REFERRAL;
    
    const { error: newUserUpdateError } = await supabase
      .from('profiles')
      .update({
        applications_remaining: newUserRemaining,
        referred_by: referrer.id,
      })
      .eq('id', newUserId);

    if (__DEV__) console.log('🔍 [REFERRAL] New user final swipes:', {
      applications_remaining: newUserRemaining,
    });

    if (newUserUpdateError) {
      if (__DEV__) console.log('❌ [REFERRAL] Error updating new user:', newUserUpdateError.message);
    } else {
      if (__DEV__) console.log('✅ [REFERRAL] New user updated successfully');
      await addBonusDailySwipes(newUserId, SWIPES_PER_REFERRAL);
    }

    if (__DEV__) console.log('📝 [REFERRAL] Recording referral...');
    // Record referral
    const { error: insertError } = await supabase.from('referrals').insert({
      referrer_id: referrer.id,
      referee_id: newUserId,
      referral_code: referralCode.toUpperCase(),
      swipes_awarded: SWIPES_PER_REFERRAL,
    });

    if (insertError) {
      if (__DEV__) console.log('❌ [REFERRAL] Error inserting referral record:', insertError.message);
    } else {
      if (__DEV__) console.log('✅ [REFERRAL] Referral recorded successfully');
    }

    // Send push notification to referrer
    sendReferralNotification(referrer.id, newUserId).catch(() => {});

    if (__DEV__) console.log('🎉 [REFERRAL] Referral process completed successfully!');
    return { success: true, message: `Welcome! You received ${SWIPES_PER_REFERRAL} bonus swipes!` };
  } catch (error) {
    console.error('💥 [REFERRAL] Exception in applyReferralCode:', error);
    return { success: false, message: 'Failed to apply referral code' };
  }
}

// Send push notification to referrer when someone uses their code
async function sendReferralNotification(referrerId: string, newUserId: string) {
  try {
    const { data: newUser } = await supabase
      .from('profiles')
      .select('full_name, first_name')
      .eq('id', newUserId)
      .single();

    const friendName = newUser?.full_name || newUser?.first_name || 'Someone';

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    await fetch(`${SUPABASE_FUNCTIONS_URL}/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: '🎉 Referral Bonus!',
        body: `${friendName} just signed up using your referral code! Enjoy ${rc('limits').referral_reward_referrer} free swipes.`,
        targetUserId: referrerId,
        type: 'referral',
        data: { type: 'referral', refereeId: newUserId },
      }),
    });
  } catch (e) {
    if (__DEV__) console.log('[REFERRAL] Notification error (non-critical):', e);
  }
}

// Get referral stats for user (includes social follow status)
export async function getReferralStats(userId: string) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code, referral_swipes_earned')
      .eq('id', userId)
      .single();

    const { data: referrals, count } = await supabase
      .from('referrals')
      .select('*', { count: 'exact' })
      .eq('referrer_id', userId);

    return {
      referralCode: profile?.referral_code || null,
      totalSwipesEarned: profile?.referral_swipes_earned || 0,
      totalReferrals: count || 0,
      referrals: referrals || [],
    };
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return null;
  }
}
