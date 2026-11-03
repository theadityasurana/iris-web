import AsyncStorage from '@react-native-async-storage/async-storage';

export type PostTag = 'Tech' | 'IIT BHU' | 'DSA/CP' | 'Placements' | 'Job Hunt' | 'Career Advice' | 'Memes' | 'Startups' | 'AI' | 'General';

export const POST_TAGS: { label: PostTag; color: string; bg: string }[] = [
  { label: 'Tech', color: '#1D9BF0', bg: 'rgba(29,155,240,0.1)' },
  { label: 'IIT BHU', color: '#E65100', bg: 'rgba(230,81,0,0.1)' },
  { label: 'DSA/CP', color: '#FF6F00', bg: 'rgba(255,111,0,0.1)' },
  { label: 'Placements', color: '#7B1FA2', bg: 'rgba(123,31,162,0.1)' },
  { label: 'Job Hunt', color: '#00BA7C', bg: 'rgba(0,186,124,0.1)' },
  { label: 'Career Advice', color: '#F97316', bg: 'rgba(249,115,22,0.1)' },
  { label: 'Memes', color: '#A855F7', bg: 'rgba(168,85,247,0.1)' },
  { label: 'Startups', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
  { label: 'AI', color: '#6366F1', bg: 'rgba(99,102,241,0.1)' },
  { label: 'General', color: '#71767B', bg: 'rgba(113,118,123,0.1)' },
];

export type ReactionType = '🔥' | '👏' | '💡' | '🎯' | '❤️';

export interface Reactions {
  '🔥': number;
  '👏': number;
  '💡': number;
  '🎯': number;
  '❤️': number;
}

export interface CrossroadsData {
  optionA: string;
  optionB: string;
  optionAImage?: string | null;
  optionBImage?: string | null;
  votesA: number;
  votesB: number;
  myVote?: 'A' | 'B' | null;
  expiresAt: string; // 48hr from creation
  followUp?: string; // OP's follow-up after choosing
}

export interface LootDropData {
  expiresAt: string;
  durationMinutes: number;
}

export interface WallPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userFlair?: string;
  content: string;
  images: string[];
  videoUrl?: string;
  tag?: PostTag;
  reactions: Reactions;
  myReaction?: ReactionType | null;
  comments: WallComment[];
  quotedPost?: QuotedPost | null;
  createdAt: string;
  // Ghost mode
  isGhost?: boolean;
  ghostId?: string;
  // Crossroads (dilemma) post
  isCrossroads?: boolean;
  crossroads?: CrossroadsData;
  // Loot Drop
  isLootDrop?: boolean;
  lootDrop?: LootDropData;
  // Blog fields
  isBlog?: boolean;
  blogTitle?: string;
  blogSummary?: string;
  blogFullContent?: string;
  blogUrl?: string;
  blogSource?: string;
}

export interface QuotedPost {
  id: string;
  userName: string;
  userAvatar: string;
  content: string;
  tag?: PostTag;
}

export interface WallComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  images?: string[];
  createdAt: string;
}

const STORAGE_KEY = 'wall_posts_v7';

export async function getPosts(): Promise<WallPost[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const posts = JSON.parse(raw);
  // Filter out any legacy fake/preload posts that may have been stored
  return posts.filter((p: WallPost) => !p.id.startsWith('preload_') && p.userId !== 'system');
}

export async function createPost(post: Omit<WallPost, 'id' | 'reactions' | 'myReaction' | 'comments' | 'createdAt'>): Promise<WallPost> {
  const posts = await getPosts();
  const newPost: WallPost = {
    ...post,
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    reactions: { '🔥': 0, '👏': 0, '💡': 0, '🎯': 0, '❤️': 0 },
    myReaction: null,
    comments: [],
    createdAt: new Date().toISOString(),
  };
  posts.unshift(newPost);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  return newPost;
}

export async function toggleReaction(postId: string, reaction: ReactionType): Promise<WallPost[]> {
  const posts = await getPosts();
  const idx = posts.findIndex(p => p.id === postId);
  if (idx === -1) return posts;
  const post = posts[idx];
  if (post.myReaction === reaction) {
    post.reactions[reaction]--;
    post.myReaction = null;
  } else {
    if (post.myReaction) post.reactions[post.myReaction]--;
    post.reactions[reaction]++;
    post.myReaction = reaction;
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  return posts;
}

export async function addComment(postId: string, comment: Omit<WallComment, 'id' | 'createdAt'>): Promise<WallPost[]> {
  const posts = await getPosts();
  const idx = posts.findIndex(p => p.id === postId);
  if (idx === -1) return posts;
  posts[idx].comments.push({
    ...comment,
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  return posts;
}

export async function deletePost(postId: string): Promise<WallPost[]> {
  let posts = await getPosts();
  posts = posts.filter(p => p.id !== postId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  return posts;
}

export async function quotePost(originalPost: WallPost, newPost: Omit<WallPost, 'id' | 'reactions' | 'myReaction' | 'comments' | 'createdAt' | 'quotedPost'>): Promise<WallPost[]> {
  const posts = await getPosts();
  const quoted: WallPost = {
    ...newPost,
    id: Date.now().toString() + Math.random().toString(36).slice(2),
    reactions: { '🔥': 0, '👏': 0, '💡': 0, '🎯': 0, '❤️': 0 },
    myReaction: null,
    comments: [],
    quotedPost: {
      id: originalPost.id,
      userName: originalPost.userName,
      userAvatar: originalPost.userAvatar,
      content: originalPost.content.slice(0, 150),
      tag: originalPost.tag,
    },
    createdAt: new Date().toISOString(),
  };
  posts.unshift(quoted);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  return posts;
}
