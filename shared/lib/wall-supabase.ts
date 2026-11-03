import { supabase } from './supabase';
import { WallPost, PostTag, POST_TAGS, Reactions, WallComment, CrossroadsData, LootDropData } from './wall-store';
import { decode } from 'base64-arraybuffer';

const EMPTY_REACTIONS: Reactions = { '🔥': 0, '👏': 0, '💡': 0, '🎯': 0, '❤️': 0 };

// ─── Auto-tag detection based on content keywords ───

const TAG_KEYWORDS: Record<PostTag, string[]> = {
  'Tech': ['react', 'javascript', 'typescript', 'python', 'rust', 'golang', 'frontend', 'backend', 'devops', 'cloud', 'aws', 'docker', 'kubernetes', 'api', 'framework', 'library', 'open source', 'github', 'code', 'programming', 'developer', 'software'],
  'IIT BHU': ['iit bhu', 'iitbhu', 'varanasi', 'banaras', 'bhu'],
  'DSA/CP': ['leetcode', 'dsa', 'competitive programming', 'codeforces', 'data structure', 'algorithm', 'dp', 'binary search', 'tree', 'graph', 'neetcode'],
  'Placements': ['placement', 'campus', 'on-campus', 'off-campus', 'package', 'offer letter', 'day 1', 'tier-1', 'tier-2', 'tier-3'],
  'Job Hunt': ['job', 'hiring', 'interview', 'resume', 'application', 'recruiter', 'linkedin', 'referral', 'offer', 'rejected'],
  'Career Advice': ['career', 'advice', 'mentor', 'growth', 'promotion', 'switch', 'transition', 'experience'],
  'Memes': ['meme', 'lol', 'funny', 'humor', '😂', '🤣', 'joke'],
  'Startups': ['startup', 'founder', 'mvp', 'launch', 'mrr', 'vc', 'funding', 'bootstrap', 'saas', 'product'],
  'AI': ['ai', 'artificial intelligence', 'gpt', 'llm', 'machine learning', 'deep learning', 'neural', 'openai', 'chatgpt', 'claude', 'gemini', 'model'],
  'General': [],
};

export function detectTag(content: string): PostTag {
  const lower = content.toLowerCase();
  let bestTag: PostTag = 'General';
  let bestScore = 0;

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (tag === 'General') continue;
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestTag = tag as PostTag;
    }
  }
  return bestTag;
}

// ─── Upload image to Supabase Storage ───

export async function uploadPostImage(userId: string, uri: string): Promise<string | null> {
  try {
    const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });
    const base64 = await base64Promise;

    const { error } = await supabase.storage
      .from('wall-images')
      .upload(fileName, decode(base64), { contentType: `image/${ext}`, upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from('wall-images').getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (e) {
    console.error('Image upload failed:', e);
    return null;
  }
}

// ─── Create post in Supabase ───

// Generate a deterministic ghost avatar from userId
export function getGhostAvatar(userId: string): string {
  const hash = Math.abs(userId.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));
  return `https://api.dicebear.com/9.x/shapes/png?seed=ghost_${hash}&size=200&backgroundColor=1a1a2e,16213e,0f3460,533483,4a0e4e&shape1Color=7c3aed,a855f7,c084fc`;
}

// Generate a deterministic ghost name from userId
export function getGhostName(userId: string): string {
  const adjectives = ['Shadow', 'Phantom', 'Silent', 'Midnight', 'Cryptic', 'Void', 'Nebula', 'Stealth', 'Obsidian', 'Spectral', 'Ethereal', 'Mystic', 'Lunar', 'Rogue', 'Cipher'];
  const nouns = ['Fox', 'Owl', 'Wolf', 'Raven', 'Lynx', 'Hawk', 'Viper', 'Ghost', 'Wraith', 'Shade', 'Echo', 'Spark', 'Drift', 'Pulse', 'Flare'];
  const hash = Math.abs(userId.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));
  return `${adjectives[hash % adjectives.length]}${nouns[(hash >> 4) % nouns.length]}`;
}

export async function createSupabasePost(post: {
  userId: string;
  userName: string;
  userAvatar: string;
  userFlair?: string;
  content: string;
  localImageUris: string[];
  localVideoUri?: string;
  tag?: PostTag;
  isGhost?: boolean;
}): Promise<WallPost | null> {
  try {
    // Upload images
    const imageUrls: string[] = [];
    for (const uri of post.localImageUris) {
      const url = await uploadPostImage(post.userId, uri);
      if (url) imageUrls.push(url);
    }

    // Upload video if present
    let videoUrl: string | null = null;
    if (post.localVideoUri) {
      videoUrl = await uploadPostVideo(post.userId, post.localVideoUri);
    }

    // Auto-detect tag if not provided
    const tag = post.tag || detectTag(post.content);

    const isGhost = post.isGhost || false;
    const ghostName = isGhost ? getGhostName(post.userId) : null;
    const ghostAvatar = isGhost ? getGhostAvatar(post.userId) : null;

    const { data, error } = await supabase
      .from('wall_posts')
      .insert({
        user_id: post.userId,
        user_name: isGhost ? ghostName : post.userName,
        user_avatar: isGhost ? ghostAvatar : post.userAvatar,
        user_flair: isGhost ? 'Ghost' : (post.userFlair || null),
        content: post.content,
        images: videoUrl ? [...imageUrls, videoUrl] : imageUrls,
        tag,
        likes_count: 0,
        comments_count: 0,
        is_ghost: isGhost,
        ghost_id: isGhost ? ghostName : null,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: `user_${data.id}`,
      userId: data.user_id,
      userName: isGhost ? ghostName! : data.user_name,
      userAvatar: isGhost ? ghostAvatar! : data.user_avatar,
      userFlair: isGhost ? 'Ghost' : (data.user_flair || undefined),
      content: data.content,
      images: data.images || [],
      tag: data.tag as PostTag,
      reactions: { ...EMPTY_REACTIONS, '❤️': data.likes_count || 0 },
      myReaction: null,
      comments: [],
      quotedPost: null,
      createdAt: data.created_at,
      isGhost,
      ghostId: isGhost ? ghostName! : undefined,
    };
  } catch (e) {
    console.error('Create post error:', e);
    return null;
  }
}

// ─── Fetch user posts from Supabase ───

export async function fetchUserPosts(limit = 30): Promise<WallPost[]> {
  try {
    const { data, error } = await supabase
      .from('wall_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!data) return [];

    return data.map(row => ({
      id: `user_${row.id}`,
      userId: row.user_id,
      userName: row.user_name,
      userAvatar: row.user_avatar,
      userFlair: row.user_flair || undefined,
      content: row.content,
      images: row.images || [],
      tag: row.tag as PostTag,
      reactions: { ...EMPTY_REACTIONS, '❤️': row.likes_count || 0 },
      myReaction: null,
      comments: [],
      quotedPost: null,
      createdAt: row.created_at,
      isGhost: row.is_ghost || false,
      ghostId: row.ghost_id || undefined,
      isCrossroads: row.is_crossroads || false,
      crossroads: row.is_crossroads ? {
        optionA: row.crossroads_option_a || '',
        optionB: row.crossroads_option_b || '',
        optionAImage: (row.images && row.images[0]) || null,
        optionBImage: (row.images && row.images[1]) || null,
        votesA: row.crossroads_votes_a || 0,
        votesB: row.crossroads_votes_b || 0,
        myVote: null,
        expiresAt: row.crossroads_expires_at || new Date().toISOString(),
        followUp: row.crossroads_follow_up || undefined,
      } : undefined,
      isLootDrop: row.is_loot_drop || false,
      lootDrop: row.is_loot_drop ? {
        expiresAt: row.loot_drop_expires_at || new Date().toISOString(),
        durationMinutes: row.loot_drop_duration_minutes || 15,
      } : undefined,
    }));
  } catch (e) {
    console.error('Fetch user posts error:', e);
    return [];
  }
}

// ─── Fetch posts with the current user's like status ───

export async function fetchUserPostsWithLikes(currentUserId: string, limit = 30): Promise<WallPost[]> {
  try {
    const { data: posts, error } = await supabase
      .from('wall_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!posts || posts.length === 0) return [];

    // Fetch user's likes
    const postIds = posts.map(p => p.id);
    const { data: likes } = await supabase
      .from('wall_post_likes')
      .select('post_id')
      .eq('user_id', currentUserId)
      .in('post_id', postIds);

    const likedPostIds = new Set((likes || []).map(l => l.post_id));

    // Fetch comments for these posts
    const { data: comments } = await supabase
      .from('wall_post_comments')
      .select('*')
      .in('post_id', postIds)
      .order('created_at', { ascending: true });

    const commentsByPost: Record<string, WallComment[]> = {};
    (comments || []).forEach(c => {
      if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
      commentsByPost[c.post_id].push({
        id: c.id,
        userId: c.user_id,
        userName: c.user_name,
        userAvatar: c.user_avatar,
        content: c.content,
        createdAt: c.created_at,
      });
    });

    return posts.map(row => ({
      id: `user_${row.id}`,
      userId: row.user_id,
      userName: row.user_name,
      userAvatar: row.user_avatar,
      userFlair: row.user_flair || undefined,
      content: row.content,
      images: row.images || [],
      tag: row.tag as PostTag,
      reactions: { ...EMPTY_REACTIONS, '❤️': row.likes_count || 0 },
      myReaction: likedPostIds.has(row.id) ? '❤️' : null,
      comments: commentsByPost[row.id] || [],
      quotedPost: null,
      createdAt: row.created_at,
      isGhost: row.is_ghost || false,
      ghostId: row.ghost_id || undefined,
      isCrossroads: row.is_crossroads || false,
      crossroads: row.is_crossroads ? {
        optionA: row.crossroads_option_a || '',
        optionB: row.crossroads_option_b || '',
        optionAImage: (row.images && row.images[0]) || null,
        optionBImage: (row.images && row.images[1]) || null,
        votesA: row.crossroads_votes_a || 0,
        votesB: row.crossroads_votes_b || 0,
        myVote: null,
        expiresAt: row.crossroads_expires_at || new Date().toISOString(),
        followUp: row.crossroads_follow_up || undefined,
      } : undefined,
      isLootDrop: row.is_loot_drop || false,
      lootDrop: row.is_loot_drop ? {
        expiresAt: row.loot_drop_expires_at || new Date().toISOString(),
        durationMinutes: row.loot_drop_duration_minutes || 15,
      } : undefined,
    }));
  } catch (e) {
    console.error('Fetch user posts with likes error:', e);
    return [];
  }
}

// ─── Toggle like on a user post ───

export async function togglePostLike(postId: string, userId: string): Promise<{ liked: boolean; newCount: number }> {
  // postId comes in as "user_123"  - extract the DB id
  const dbId = postId.replace('user_', '');

  try {
    // Check if already liked
    const { data: existing } = await supabase
      .from('wall_post_likes')
      .select('id')
      .eq('post_id', dbId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Unlike
      await supabase.from('wall_post_likes').delete().eq('id', existing.id);
      await supabase.rpc('decrement_likes', { post_id_input: dbId });
      const { data: post } = await supabase.from('wall_posts').select('likes_count').eq('id', dbId).single();
      return { liked: false, newCount: post?.likes_count || 0 };
    } else {
      // Like
      await supabase.from('wall_post_likes').insert({ post_id: dbId, user_id: userId });
      await supabase.rpc('increment_likes', { post_id_input: dbId });
      const { data: post } = await supabase.from('wall_posts').select('likes_count').eq('id', dbId).single();
      return { liked: true, newCount: post?.likes_count || 0 };
    }
  } catch (e) {
    console.error('Toggle like error:', e);
    return { liked: false, newCount: 0 };
  }
}

// ─── Add comment to a user post ───

export async function addPostComment(postId: string, comment: {
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  localImageUris?: string[];
}): Promise<WallComment | null> {
  const dbId = postId.replace('user_', '');

  try {
    // Upload images if any
    const imageUrls: string[] = [];
    if (comment.localImageUris && comment.localImageUris.length > 0) {
      for (const uri of comment.localImageUris) {
        const url = await uploadPostImage(comment.userId, uri);
        if (url) imageUrls.push(url);
      }
    }

    const insertData: any = {
      post_id: dbId,
      user_id: comment.userId,
      user_name: comment.userName,
      user_avatar: comment.userAvatar,
      content: comment.content,
    };
    // Try adding images if column exists
    if (imageUrls.length > 0) insertData.images = imageUrls;

    const { data, error } = await supabase
      .from('wall_post_comments')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // If images column doesn't exist, retry without it
      if (error.message?.includes('images')) {
        console.log('[COMMENT] images column not found, retrying without images');
        const { data: data2, error: error2 } = await supabase
          .from('wall_post_comments')
          .insert({
            post_id: dbId,
            user_id: comment.userId,
            user_name: comment.userName,
            user_avatar: comment.userAvatar,
            content: imageUrls.length > 0 ? `${comment.content}\n${imageUrls.join('\n')}` : comment.content,
          })
          .select()
          .single();
        if (error2) throw error2;
        try { await supabase.rpc('increment_comments', { post_id_input: dbId }); } catch {}
        return {
          id: data2.id,
          userId: data2.user_id,
          userName: data2.user_name,
          userAvatar: data2.user_avatar,
          content: data2.content,
          images: imageUrls,
          createdAt: data2.created_at,
        };
      }
      throw error;
    }

    // Increment comments count
    try { await supabase.rpc('increment_comments', { post_id_input: dbId }); } catch {}

    return {
      id: data.id,
      userId: data.user_id,
      userName: data.user_name,
      userAvatar: data.user_avatar,
      content: data.content,
      images: data.images || imageUrls,
      createdAt: data.created_at,
    };
  } catch (e) {
    console.error('Add comment error:', e);
    return null;
  }
}

// ─── Delete a user post ───

export async function deleteSupabasePost(postId: string, userId: string): Promise<boolean> {
  const dbId = postId.replace('user_', '');
  try {
    const { error } = await supabase
      .from('wall_posts')
      .delete()
      .eq('id', dbId)
      .eq('user_id', userId);

    return !error;
  } catch {
    return false;
  }
}

// ─── Delete a comment ───

export async function deletePostComment(commentId: string, userId: string, postOwnerId: string): Promise<boolean> {
  try {
    console.log('[DELETE-COMMENT] Attempting delete:', { commentId, userId, postOwnerId });

    // Allow delete if user owns the comment OR owns the post
    const { data: comment, error: fetchError } = await supabase
      .from('wall_post_comments')
      .select('user_id, post_id')
      .eq('id', commentId)
      .single();

    console.log('[DELETE-COMMENT] Fetched comment:', { comment, fetchError: fetchError?.message });

    if (!comment) {
      console.log('[DELETE-COMMENT] Comment not found');
      return false;
    }

    const isCommentOwner = comment.user_id === userId;
    const isPostOwner = postOwnerId === userId;
    console.log('[DELETE-COMMENT] Ownership check:', { isCommentOwner, isPostOwner, commentUserId: comment.user_id, currentUserId: userId });

    if (!isCommentOwner && !isPostOwner) {
      console.log('[DELETE-COMMENT] Not authorized to delete');
      return false;
    }

    const { error } = await supabase
      .from('wall_post_comments')
      .delete()
      .eq('id', commentId);

    console.log('[DELETE-COMMENT] Delete result:', { error: error?.message, code: error?.code });

    if (error) return false;

    // Decrement comments_count (best effort)
    try {
      const { error: rpcError } = await supabase.rpc('decrement_comments_count', { row_id: comment.post_id });
      if (rpcError) console.log('[DELETE-COMMENT] decrement RPC error (non-critical):', rpcError.message);
    } catch (rpcErr) {
      console.log('[DELETE-COMMENT] decrement RPC exception (non-critical):', rpcErr);
    }
    return true;
  } catch (e) {
    console.error('[DELETE-COMMENT] Exception:', e);
    return false;
  }
}

// ─── Upload video to Supabase Storage ───

export async function uploadPostVideo(userId: string, uri: string): Promise<string | null> {
  try {
    const ext = uri.split('.').pop()?.split('?')[0] || 'mp4';
    const fileName = `${userId}/videos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });
    const base64 = await base64Promise;

    const { error } = await supabase.storage
      .from('wall-images')
      .upload(fileName, decode(base64), { contentType: `video/${ext}`, upsert: false });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from('wall-images').getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (e) {
    console.error('Video upload failed:', e);
    return null;
  }
}

// ─── Helper: check if a post is user-created ───

export function isUserPost(post: WallPost): boolean {
  return post.id.startsWith('user_');
}

// ─── Crossroads: vote on a dilemma post ───

export async function voteCrossroads(postId: string, userId: string, vote: 'A' | 'B'): Promise<{ votesA: number; votesB: number } | null> {
  const dbId = postId.replace('user_', '');
  try {
    const { data, error } = await supabase.rpc('vote_crossroads', {
      post_id_input: dbId,
      user_id_input: userId,
      vote_input: vote,
    });
    if (error) throw error;
    return { votesA: data.votes_a, votesB: data.votes_b };
  } catch (e) {
    console.error('Vote crossroads error:', e);
    return null;
  }
}

// ─── Crossroads: create a dilemma post ───

export async function createCrossroadsPost(post: {
  userId: string;
  userName: string;
  userAvatar: string;
  userFlair?: string;
  content: string;
  optionA: string;
  optionB: string;
  optionAImage?: string | null;
  optionBImage?: string | null;
  tag?: PostTag;
  isGhost?: boolean;
}): Promise<WallPost | null> {
  try {
    const isGhost = post.isGhost || false;
    const ghostName = isGhost ? getGhostName(post.userId) : null;
    const ghostAvatar = isGhost ? getGhostAvatar(post.userId) : null;
    const tag = post.tag || detectTag(post.content);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // Upload option images if provided
    let optionAImageUrl: string | null = null;
    let optionBImageUrl: string | null = null;
    if (post.optionAImage) {
      optionAImageUrl = await uploadPostImage(post.userId, post.optionAImage);
    }
    if (post.optionBImage) {
      optionBImageUrl = await uploadPostImage(post.userId, post.optionBImage);
    }

    const { data, error } = await supabase
      .from('wall_posts')
      .insert({
        user_id: post.userId,
        user_name: isGhost ? ghostName : post.userName,
        user_avatar: isGhost ? ghostAvatar : post.userAvatar,
        user_flair: isGhost ? 'Ghost' : (post.userFlair || null),
        content: post.content,
        images: [optionAImageUrl, optionBImageUrl].filter(Boolean),
        tag,
        likes_count: 0,
        comments_count: 0,
        is_ghost: isGhost,
        is_crossroads: true,
        crossroads_option_a: post.optionA,
        crossroads_option_b: post.optionB,
        crossroads_votes_a: 0,
        crossroads_votes_b: 0,
        crossroads_expires_at: expiresAt,
      })
      .select()
      .single();

    console.log('[CROSSROADS] Insert result:', { data, error });
    if (error) throw error;

    return {
      id: `user_${data.id}`,
      userId: data.user_id,
      userName: isGhost ? ghostName! : data.user_name,
      userAvatar: isGhost ? ghostAvatar! : data.user_avatar,
      userFlair: isGhost ? 'Ghost' : (data.user_flair || undefined),
      content: data.content,
      images: [],
      tag: data.tag as PostTag,
      reactions: { ...EMPTY_REACTIONS },
      myReaction: null,
      comments: [],
      quotedPost: null,
      createdAt: data.created_at,
      isGhost,
      isCrossroads: true,
      crossroads: {
        optionA: post.optionA,
        optionB: post.optionB,
        optionAImage: optionAImageUrl,
        optionBImage: optionBImageUrl,
        votesA: 0,
        votesB: 0,
        myVote: null,
        expiresAt,
      },
    };
  } catch (e) {
    console.error('Create crossroads post error:', e);
    return null;
  }
}

// ─── Loot Drop: create a timed post ───

export async function createLootDropPost(post: {
  userId: string;
  userName: string;
  userAvatar: string;
  userFlair?: string;
  content: string;
  durationMinutes: number;
  tag?: PostTag;
  isGhost?: boolean;
}): Promise<WallPost | null> {
  try {
    const isGhost = post.isGhost || false;
    const ghostName = isGhost ? getGhostName(post.userId) : null;
    const ghostAvatar = isGhost ? getGhostAvatar(post.userId) : null;
    const tag = post.tag || 'General';
    const expiresAt = new Date(Date.now() + post.durationMinutes * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('wall_posts')
      .insert({
        user_id: post.userId,
        user_name: isGhost ? ghostName : post.userName,
        user_avatar: isGhost ? ghostAvatar : post.userAvatar,
        user_flair: isGhost ? 'Ghost' : (post.userFlair || null),
        content: post.content,
        images: [],
        tag,
        likes_count: 0,
        comments_count: 0,
        is_ghost: isGhost,
        is_loot_drop: true,
        loot_drop_expires_at: expiresAt,
        loot_drop_duration_minutes: post.durationMinutes,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: `user_${data.id}`,
      userId: data.user_id,
      userName: isGhost ? ghostName! : data.user_name,
      userAvatar: isGhost ? ghostAvatar! : data.user_avatar,
      userFlair: isGhost ? 'Ghost' : (data.user_flair || undefined),
      content: data.content,
      images: [],
      tag: data.tag as PostTag,
      reactions: { ...EMPTY_REACTIONS },
      myReaction: null,
      comments: [],
      quotedPost: null,
      createdAt: data.created_at,
      isGhost,
      isLootDrop: true,
      lootDrop: {
        expiresAt,
        durationMinutes: post.durationMinutes,
      },
    };
  } catch (e) {
    console.error('Create loot drop post error:', e);
    return null;
  }
}
