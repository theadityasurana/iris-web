import { WallPost, PostTag, Reactions } from './wall-store';

const EMPTY_REACTIONS: Reactions = { '🔥': 0, '👏': 0, '💡': 0, '🎯': 0, '❤️': 0 };

function getAvatar(seed: string): string {
  const hash = Math.abs(seed.split('').reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0));
  return `https://i.pravatar.cc/150?u=${encodeURIComponent(seed + hash)}`;
}

// Strip HTML tags from content
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}

// RSS feed sources mapped to tags
const RSS_FEEDS: { url: string; tag: PostTag; source: string }[] = [
  // Tech
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https://techcrunch.com/feed/', tag: 'Tech', source: 'TechCrunch' },
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https://www.theverge.com/rss/index.xml', tag: 'Tech', source: 'The Verge' },
  // AI
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https://blog.openai.com/rss/', tag: 'AI', source: 'OpenAI Blog' },
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https://ai.googleblog.com/feeds/posts/default', tag: 'AI', source: 'Google AI Blog' },
  // Startups
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https://a16z.com/feed/', tag: 'Startups', source: 'a16z' },
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https://blog.ycombinator.com/feed/', tag: 'Startups', source: 'Y Combinator' },
  // Career
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https://hbr.org/feed', tag: 'Career Advice', source: 'HBR' },
  // General
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.wired.com/wired/index', tag: 'General', source: 'Wired' },
  // Job Hunt
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https://hbr.org/feed', tag: 'Job Hunt', source: 'HBR Careers' },
  // Placements
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https://hbr.org/feed', tag: 'Placements', source: 'HBR' },
  // Memes
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https://feeds.wired.com/wired/index', tag: 'Memes', source: 'Wired' },
];

// Fetch blogs from RSS via rss2json proxy
async function fetchRSSBlogs(feedUrl: string, tag: PostTag, source: string, limit = 5): Promise<WallPost[]> {
  try {
    const res = await fetch(feedUrl);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== 'ok' || !data.items) return [];

    return data.items.slice(0, limit).map((item: any) => {
      const title = stripHtml(item.title || '');
      const description = stripHtml(item.description || item.content || '');
      const summary = description.slice(0, 200) + (description.length > 200 ? '...' : '');
      const fullContent = stripHtml(item.content || item.description || '');
      const image = item.thumbnail || item.enclosure?.link || '';

      return {
        id: `blog_rss_${tag}_${item.guid || item.link || Math.random()}`,
        userId: 'system_blog',
        userName: item.author || source,
        userAvatar: getAvatar(item.author || source),
        userFlair: source,
        content: `${title}\n\n${summary}`,
        images: image ? [image] : [],
        tag,
        reactions: { ...EMPTY_REACTIONS },
        myReaction: null,
        comments: [],
        quotedPost: null,
        createdAt: item.pubDate || new Date().toISOString(),
        isBlog: true,
        blogTitle: title,
        blogSummary: summary,
        blogFullContent: fullContent || description,
        blogUrl: item.link || '',
        blogSource: source,
      } as WallPost;
    });
  } catch (e) {
    console.log(`RSS fetch error (${source}):`, e);
    return [];
  }
}

// Fetch Dev.to articles as blogs (full body available)
async function fetchDevToBlogs(tag: string, postTag: PostTag, limit = 5): Promise<WallPost[]> {
  try {
    const res = await fetch(`https://dev.to/api/articles?tag=${tag}&per_page=${limit}&top=7`);
    if (!res.ok) return [];
    const articles: any[] = await res.json();
    if (!Array.isArray(articles)) return [];

    // Fetch full article body for each
    const blogs: WallPost[] = [];
    for (const a of articles.slice(0, limit)) {
      let fullContent = a.description || '';
      try {
        const fullRes = await fetch(`https://dev.to/api/articles/${a.id}`);
        if (fullRes.ok) {
          const full = await fullRes.json();
          fullContent = full.body_markdown || full.body_html ? stripHtml(full.body_html || '') : fullContent;
        }
      } catch {}

      blogs.push({
        id: `blog_devto_${a.id}`,
        userId: 'system_blog',
        userName: a.user?.name || 'Dev.to',
        userAvatar: a.user?.profile_image || getAvatar(a.user?.name || 'devto'),
        userFlair: 'Dev.to',
        content: `${a.title}\n\n${(a.description || '').slice(0, 200)}`,
        images: a.cover_image ? [a.cover_image] : [],
        tag: postTag,
        reactions: { ...EMPTY_REACTIONS, '❤️': a.public_reactions_count || 0 },
        myReaction: null,
        comments: [],
        quotedPost: null,
        createdAt: a.published_at || new Date().toISOString(),
        isBlog: true,
        blogTitle: a.title,
        blogSummary: (a.description || '').slice(0, 200),
        blogFullContent: fullContent,
        blogUrl: a.url || '',
        blogSource: 'Dev.to',
      } as WallPost);
    }
    return blogs;
  } catch (e) {
    console.log('Dev.to blogs fetch error:', e);
    return [];
  }
}

// Fetch Hacker News top stories as blogs (for those with URLs)
async function fetchHNBlogs(limit = 5): Promise<WallPost[]> {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/beststories.json');
    const ids: number[] = await res.json();
    const slice = ids.slice(0, limit * 2); // fetch more to filter

    const items = await Promise.all(
      slice.map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json()))
    );

    const blogs: WallPost[] = [];
    for (const item of items) {
      if (!item || !item.title || !item.url) continue;
      if (blogs.length >= limit) break;

      const text = item.text ? stripHtml(item.text) : '';
      blogs.push({
        id: `blog_hn_${item.id}`,
        userId: 'system_blog',
        userName: item.by || 'Hacker News',
        userAvatar: getAvatar(item.by || 'hn'),
        userFlair: 'Hacker News',
        content: `${item.title}\n\n${text.slice(0, 200)}`,
        images: [],
        tag: 'Tech' as PostTag,
        reactions: { ...EMPTY_REACTIONS, '🔥': item.score || 0 },
        myReaction: null,
        comments: [],
        quotedPost: null,
        createdAt: new Date((item.time || 0) * 1000).toISOString(),
        isBlog: true,
        blogTitle: item.title,
        blogSummary: text.slice(0, 200) || `${item.score} points on Hacker News`,
        blogFullContent: text || item.title,
        blogUrl: item.url,
        blogSource: 'Hacker News',
      } as WallPost);
    }
    return blogs;
  } catch (e) {
    console.log('HN blogs fetch error:', e);
    return [];
  }
}

// Tag to Dev.to tag mapping
const TAG_TO_DEVTO: Partial<Record<PostTag, string>> = {
  'AI': 'ai',
  'Tech': 'programming',
  'Startups': 'startup',
  'Career Advice': 'career',
  'General': 'beginners',
  'DSA/CP': 'algorithms',
  'IIT BHU': 'programming',
  'Placements': 'career',
  'Job Hunt': 'career',
  'Memes': 'humor',
};

// Main export: fetch blogs for a category
export async function fetchBlogsForCategory(category: PostTag, limit = 4): Promise<WallPost[]> {
  const blogs: WallPost[] = [];

  // RSS feeds for this category
  const feeds = RSS_FEEDS.filter(f => f.tag === category);
  if (feeds.length > 0) {
    const feed = feeds[Math.floor(Math.random() * feeds.length)];
    const rssBlogs = await fetchRSSBlogs(feed.url, category, feed.source, Math.ceil(limit / 2));
    blogs.push(...rssBlogs);
  }

  // Dev.to for matching categories
  const devtoTag = TAG_TO_DEVTO[category];
  if (devtoTag) {
    const devtoBlogs = await fetchDevToBlogs(devtoTag, category, Math.ceil(limit / 2));
    blogs.push(...devtoBlogs);
  }

  // HN for Tech/AI/Startups/DSA/General
  if (['Tech', 'AI', 'Startups', 'DSA/CP', 'General', 'IIT BHU'].includes(category)) {
    const hnBlogs = await fetchHNBlogs(2);
    blogs.push(...hnBlogs.map(b => ({ ...b, tag: category })));
  }

  return blogs.slice(0, limit);
}

// Fetch blogs across all categories
export async function fetchAllBlogs(limit = 6): Promise<WallPost[]> {
  const categories: PostTag[] = ['Tech', 'AI', 'Startups', 'Career Advice', 'General'];
  const picked = categories.sort(() => Math.random() - 0.5).slice(0, 2);

  const all: WallPost[] = [];
  for (const cat of picked) {
    const blogs = await fetchBlogsForCategory(cat, 3);
    all.push(...blogs);
  }

  all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return all.slice(0, limit);
}
