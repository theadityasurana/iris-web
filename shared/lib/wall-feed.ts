import { WallPost, PostTag, Reactions } from './wall-store';
import { fetchBlogsForCategory, fetchAllBlogs } from './wall-blogs';

// Generate realistic avatar URL from username
function getAvatar(seed: string): string {
  // Use pravatar.cc for realistic human photos
  const hash = Math.abs(seed.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(seed + hash)}`;
}

const EMPTY_REACTIONS: Reactions = { '🔥': 0, '👏': 0, '💡': 0, '🎯': 0, '❤️': 0 };

// Category → source mapping
const CATEGORY_SOURCES: Record<PostTag, { subreddits: string[]; devtoTag?: string; useHN?: boolean; useProductHunt?: boolean; useGitHub?: boolean }> = {
  'Tech': { subreddits: ['technology', 'programming'], useHN: true, useGitHub: true },
  'IIT BHU': { subreddits: ['iitbhu'] },
  'DSA/CP': { subreddits: ['leetcode'] },
  'Placements': { subreddits: ['Btechtards'] },
  'AI': { subreddits: ['artificial', 'MachineLearning'], devtoTag: 'ai' },
  'Career Advice': { subreddits: ['cscareerquestions', 'careerguidance'] },
  'Job Hunt': { subreddits: ['jobs', 'recruitinghell'] },
  'Startups': { subreddits: ['startups', 'Entrepreneur'], useProductHunt: true },
  'Memes': { subreddits: ['ProgrammerHumor', 'programmingmemes'] },
  'General': { subreddits: ['technology', 'Futurology'], devtoTag: 'beginners' },
};

// HackerNews
async function fetchHackerNews(offset = 0, limit = 10): Promise<WallPost[]> {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const ids: number[] = await res.json();
    const slice = ids.slice(offset, offset + limit);
    const posts: WallPost[] = [];

    const items = await Promise.all(
      slice.map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json()))
    );

    for (const item of items) {
      if (!item || !item.title) continue;
      const hasUrl = !!item.url;
      posts.push({
        id: `hn_${item.id}`,
        userId: 'system_hn',
        userName: item.by || 'HackerNews',
        userAvatar: getAvatar(item.by || 'hn_user'),
        userFlair: 'Tech News',
        content: `${item.title}${item.text ? '\n\n' + item.text.replace(/<[^>]*>/g, '').slice(0, 280) : ''}${hasUrl ? '\n\n' + item.url : ''}`,
        images: [],
        tag: 'Tech' as PostTag,
        reactions: { ...EMPTY_REACTIONS, '🔥': item.score || 0 },
        myReaction: null,
        comments: [],
        quotedPost: null,
        createdAt: new Date((item.time || 0) * 1000).toISOString(),
      });
    }
    return posts;
  } catch (e) {
    console.log('HN fetch error:', e);
    return [];
  }
}

// Dev.to
async function fetchDevTo(tag = 'ai', page = 1, limit = 10): Promise<WallPost[]> {
  try {
    const res = await fetch(`https://dev.to/api/articles?tag=${tag}&page=${page}&per_page=${limit}`);
    const articles: any[] = await res.json();
    if (!Array.isArray(articles)) return [];

    return articles.map(a => ({
      id: `devto_${a.id}`,
      userId: 'system_devto',
      userName: a.user?.name || 'Dev.to',
      userAvatar: a.user?.profile_image || getAvatar(a.user?.name || 'devto'),
      userFlair: 'Developer',
      content: `${a.title}${a.description ? '\n\n' + a.description : ''}\n\n${a.url}`,
      images: a.cover_image ? [a.cover_image] : [],
      tag: (tag === 'ai' ? 'AI' : 'General') as PostTag,
      reactions: { ...EMPTY_REACTIONS, '❤️': a.public_reactions_count || 0 },
      myReaction: null,
      comments: [],
      quotedPost: null,
      createdAt: a.published_at || new Date().toISOString(),
    }));
  } catch (e) {
    console.log('Dev.to fetch error:', e);
    return [];
  }
}

// Reddit
async function fetchReddit(subreddit: string, tag: PostTag, after = '', limit = 10): Promise<{ posts: WallPost[]; after: string | null }> {
  try {
    // Add small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}${after ? `&after=${after}` : ''}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'IrisApp/1.0' } });
    if (!res.ok) return { posts: [], after: null };
    const text = await res.text();
    if (text.startsWith('<')) return { posts: [], after: null }; // HTML response = rate limited
    const data = JSON.parse(text);
    const children = data?.data?.children || [];
    const nextAfter = data?.data?.after || null;
    const posts: WallPost[] = [];

    for (const child of children) {
      const p = child.data;
      if (!p || p.stickied || p.over_18) continue;

      const hasExternalUrl = p.url && !p.url.includes('reddit.com') && !p.is_self;
      const isImage = p.post_hint === 'image' || (p.url && /\.(jpg|jpeg|png|gif|webp)/i.test(p.url));
      const hasVideo = p.is_video || p.post_hint === 'hosted:video' || p.post_hint === 'rich:video';
      const videoUrl = p.media?.reddit_video?.fallback_url || p.secure_media?.reddit_video?.fallback_url || null;
      const imageUrl = isImage ? p.url : (p.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') || null);

      posts.push({
        id: `reddit_${p.id}`,
        userId: 'system_reddit',
        userName: p.author || 'Reddit',
        userAvatar: getAvatar(p.author || 'reddit_user'),
        userFlair: 'Community',
        content: `${p.title}${p.selftext ? '\n\n' + p.selftext.slice(0, 300) : ''}${hasExternalUrl && !isImage ? '\n\n' + p.url : ''}`,
        images: imageUrl ? [imageUrl] : [],
        tag,
        reactions: { ...EMPTY_REACTIONS, '🔥': p.ups || 0 },
        myReaction: null,
        comments: [],
        quotedPost: null,
        createdAt: new Date((p.created_utc || 0) * 1000).toISOString(),
        videoUrl: hasVideo ? videoUrl : undefined,
      } as any);
    }
    return { posts, after: nextAfter };
  } catch (e) {
    console.log(`Reddit r/${subreddit} fetch error:`, e);
    return { posts: [], after: null };
  }
}

// ProductHunt  - daily top products (free, no key needed via unofficial endpoint)
async function fetchProductHunt(limit = 5): Promise<WallPost[]> {
  try {
    // Use the public RSS-to-JSON approach via Dev.to alternative
    const res = await fetch('https://www.reddit.com/r/ProductHuntReviews/hot.json?limit=' + limit, {
      headers: { 'User-Agent': 'IrisApp/1.0' },
    });
    const data = await res.json();
    const children = data?.data?.children || [];
    const posts: WallPost[] = [];

    for (const child of children) {
      const p = child.data;
      if (!p || p.stickied) continue;
      const hasImage = p.thumbnail && p.thumbnail.startsWith('http');
      posts.push({
        id: `ph_${p.id}`,
        userId: 'system_ph',
        userName: p.author || 'ProductHunt',
        userAvatar: getAvatar(p.author || 'producthunt'),
        userFlair: 'Product Launch',
        content: `🚀 ${p.title}${p.selftext ? '\n\n' + p.selftext.slice(0, 250) : ''}`,
        images: hasImage ? [p.thumbnail] : [],
        tag: 'Startups' as PostTag,
        reactions: { ...EMPTY_REACTIONS, '🔥': p.ups || 0 },
        myReaction: null,
        comments: [],
        quotedPost: null,
        createdAt: new Date((p.created_utc || 0) * 1000).toISOString(),
      });
    }
    return posts;
  } catch (e) {
    console.log('ProductHunt fetch error:', e);
    return [];
  }
}

// GitHub Trending  - top repos
async function fetchGitHubTrending(limit = 5): Promise<WallPost[]> {
  try {
    const res = await fetch('https://api.github.com/search/repositories?q=stars:>1000+pushed:>' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + '&sort=stars&order=desc&per_page=' + limit);
    const data = await res.json();
    if (!data.items) return [];

    return data.items.map((repo: any) => ({
      id: `gh_${repo.id}`,
      userId: 'system_gh',
      userName: repo.owner?.login || 'GitHub',
      userAvatar: repo.owner?.avatar_url || getAvatar('github'),
      userFlair: 'Open Source',
      content: `⭐ ${repo.stargazers_count.toLocaleString()} stars\n\n${repo.full_name}\n${repo.description || ''}\n\nhttps://github.com/${repo.full_name}`,
      images: repo.owner?.avatar_url ? [] : [],
      tag: 'Tech' as PostTag,
      reactions: { ...EMPTY_REACTIONS, '🔥': repo.stargazers_count || 0 },
      myReaction: null,
      comments: [],
      quotedPost: null,
      createdAt: repo.pushed_at || new Date().toISOString(),
    }));
  } catch (e) {
    console.log('GitHub fetch error:', e);
    return [];
  }
}

// Pagination state per category
const paginationState: Record<string, { hnOffset: number; devtoPage: number; redditAfters: Record<string, string> }> = {};

function getState(category: PostTag) {
  if (!paginationState[category]) {
    paginationState[category] = { hnOffset: 0, devtoPage: 1, redditAfters: {} };
  }
  return paginationState[category];
}

// Fetch posts for a specific category (with pagination)
export async function fetchCategoryPosts(category: PostTag, limit = 8): Promise<WallPost[]> {
  const sources = CATEGORY_SOURCES[category];
  if (!sources) return [];
  const state = getState(category);
  const all: WallPost[] = [];

  // HackerNews
  if (sources.useHN) {
    const hn = await fetchHackerNews(state.hnOffset, Math.ceil(limit / 2));
    state.hnOffset += hn.length;
    all.push(...hn);
  }

  // Dev.to
  if (sources.devtoTag) {
    const devto = await fetchDevTo(sources.devtoTag, state.devtoPage, Math.ceil(limit / 2));
    state.devtoPage++;
    all.push(...devto);
  }

  // Reddit (only 1 subreddit at a time to avoid rate limiting)
  const sub = sources.subreddits[state.hnOffset % sources.subreddits.length];
  const after = state.redditAfters[sub] || '';
  const result = await fetchReddit(sub, category, after, limit);
  if (result.after) state.redditAfters[sub] = result.after;
  all.push(...result.posts);

  // ProductHunt
  if (sources.useProductHunt) {
    const ph = await fetchProductHunt(3);
    all.push(...ph);
  }

  // GitHub Trending
  if (sources.useGitHub) {
    const gh = await fetchGitHubTrending(3);
    all.push(...gh);
  }

  // Blogs
  try {
    const blogs = await fetchBlogsForCategory(category, 3);
    all.push(...blogs);
  } catch (e) {
    console.log('Blog fetch error for', category, e);
  }

  return all;
}

// Fetch "All"  - a mix from every category
export async function fetchAllPosts(limit = 10): Promise<WallPost[]> {
  // Fetch from only 3 random categories at a time to avoid rate limiting
  const categories: PostTag[] = ['Tech', 'AI', 'Career Advice', 'Job Hunt', 'Startups', 'Memes', 'General'];
  const shuffled = [...categories].sort(() => Math.random() - 0.5).slice(0, 3);
  const perCategory = Math.max(3, Math.ceil(limit / shuffled.length));

  const all: WallPost[] = [];
  for (const cat of shuffled) {
    const posts = await fetchCategoryPosts(cat, perCategory);
    all.push(...posts);
  }

  // Also fetch some blogs for the "All" feed
  try {
    const blogs = await fetchAllBlogs(4);
    all.push(...blogs);
  } catch (e) {
    console.log('All blogs fetch error:', e);
  }

  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return all;
}

// Reset pagination (call when switching tabs)
export function resetPagination(category?: PostTag) {
  if (category) {
    delete paginationState[category];
  } else {
    Object.keys(paginationState).forEach(k => delete paginationState[k]);
  }
}
