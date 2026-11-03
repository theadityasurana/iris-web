/**
 * Public share links. Job, post and invite links use the irisjobs.live domain;
 * old nextquark.in links keep working (same pages, same app routes).
 * The invite link base is also in remote config (copy.share.invite_link_base).
 */
export const SHARE_LINK_ORIGIN = 'https://irisjobs.live';

export const jobShareLink = (jobId: string) => `${SHARE_LINK_ORIGIN}/job/${jobId}`;
export const postShareLink = (postId: string) => `${SHARE_LINK_ORIGIN}/post/${postId}`;
