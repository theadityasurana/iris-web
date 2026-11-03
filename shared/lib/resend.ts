import { isNetworkError } from '@/lib/offline';
import { supabase, SUPABASE_FUNCTIONS_URL } from './supabase';
import { createClient } from '@supabase/supabase-js';

const PROXY_DOMAIN = 'nextquark.in';
const SUPABASE_URL = 'https://widujxpahzlpegzjjpqp.supabase.co';
const SERVICE_ROLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '';

const adminSupabase = SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  : supabase;

export interface InboundEmail {
  id: string;
  user_id: string;
  from_email: string;
  from_name: string | null;
  to_email: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  message_id?: string | null;
  thread_id?: string | null;
  is_starred?: boolean;
  is_archived?: boolean;
  is_read?: boolean;
  received_at: string;
}

export interface SentEmail {
  id: string;
  user_id: string;
  from_email: string;
  to_email: string;
  subject: string | null;
  body_text: string | null;
  thread_id?: string | null;
  in_reply_to?: string | null;
  is_starred?: boolean;
  is_archived?: boolean;
  sent_at: string;
}

export function computeThreadId(subject: string | null): string {
  return (subject || '(no subject)').replace(/^(Re:|Fwd:|Fw:)\s*/gi, '').trim().toLowerCase();
}

const featureCache = {
  table: new Map<string, boolean>(),
  column: new Map<string, boolean>(),
};

function normalizeMaybeBool(v: any): boolean {
  return v === true;
}

async function tableExists(table: string): Promise<boolean> {
  if (featureCache.table.has(table)) return featureCache.table.get(table)!;
  const client = table === 'sent_emails' ? adminSupabase : supabase;
  const { error } = await client.from(table).select('*').limit(1);
  const ok = !error;
  featureCache.table.set(table, ok);
  if (!ok && __DEV__) console.log(`tableExists(${table}): false  -`, error?.message);
  return ok;
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const key = `${table}.${column}`;
  if (featureCache.column.has(key)) return featureCache.column.get(key)!;
  const client = table === 'sent_emails' ? adminSupabase : supabase;
  const { error } = await client.from(table).select(column).limit(1);
  const ok = !error;
  featureCache.column.set(key, ok);
  return ok;
}


export async function getOrCreateProxyEmail(userId: string, userName?: string): Promise<string | null> {
  try {
    const { data: existing } = await supabase
      .from('proxy_emails')
      .select('proxy_address')
      .eq('user_id', userId)
      .single();

    if (existing?.proxy_address) return existing.proxy_address;

    // Try edge function, fall back to creating directly
    try {
      const { data, error } = await supabase.functions.invoke('resend-inbound', {
        body: { action: 'create-proxy', user_id: userId, user_name: userName },
      });
      if (!error && data?.proxy_address) return data.proxy_address;
    } catch {}

    // Fallback: create proxy email directly
    const sanitized = (userName || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    const parts = sanitized.split(/\s+/);
    const baseName = parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : (parts[0] || `u-${userId.slice(0, 8)}`);

    // Try clean email first
    let proxyAddr = `${baseName}@${PROXY_DOMAIN}`;
    let { error: insertErr } = await supabase.from('proxy_emails').insert({ user_id: userId, proxy_address: proxyAddr });

    if (insertErr) {
      // Conflict  - add suffix
      proxyAddr = `${baseName}.${userId.slice(0, 6)}@${PROXY_DOMAIN}`;
      ({ error: insertErr } = await supabase.from('proxy_emails').insert({ user_id: userId, proxy_address: proxyAddr }));
    }

    if (insertErr) {
      if (__DEV__) console.log('proxy insert error:', insertErr.message);
      return null;
    }
    return proxyAddr;
  } catch (e) {
    if (__DEV__) console.log('getOrCreateProxyEmail error:', e);
    return null;
  }
}

export async function fetchInboundEmails(userId: string): Promise<InboundEmail[]> {
  try {
    const { data, error } = await supabase
      .from('inbound_emails')
      .select('*')
      .eq('user_id', userId)
      .order('received_at', { ascending: false })
      .limit(50);

    if (error) {
      if (__DEV__) console.log('Error fetching inbound emails:', error.message);
      if (isNetworkError(error)) throw error;
      return [];
    }
    return (data || []).map((row: any) => ({
      ...row,
      is_starred: normalizeMaybeBool(row.is_starred),
      is_archived: normalizeMaybeBool(row.is_archived),
      is_read: normalizeMaybeBool(row.is_read),
    })) as InboundEmail[];
  } catch (e) {
    if (__DEV__) console.log('fetchInboundEmails error:', e);
    // Offline: let React Query keep the cached mail instead of showing none.
    if (isNetworkError(e)) throw e;
    return [];
  }
}

export async function fetchStarredEmails(userId: string): Promise<{ inbound: InboundEmail[]; sent: SentEmail[] }> {
  try {
    const hasInboundStar = await columnExists('inbound_emails', 'is_starred');
    const hasSentTable = await tableExists('sent_emails');
    const hasSentStar = hasSentTable ? await columnExists('sent_emails', 'is_starred') : false;

    const [inboundRes, sentRes] = await Promise.all([
      hasInboundStar
        ? supabase.from('inbound_emails').select('*').eq('user_id', userId).eq('is_starred', true).order('received_at', { ascending: false })
        : supabase.from('inbound_emails').select('*').eq('user_id', userId).order('received_at', { ascending: false }),
      hasSentTable
        ? hasSentStar
          ? adminSupabase.from('sent_emails').select('*').eq('user_id', userId).eq('is_starred', true).order('sent_at', { ascending: false })
          : adminSupabase.from('sent_emails').select('*').eq('user_id', userId).order('sent_at', { ascending: false })
        : ({ data: [], error: null } as any),
    ]);

    if (inboundRes.error) console.log('Error fetching starred inbound emails:', inboundRes.error.message);
    if (sentRes?.error) console.log('Error fetching starred sent emails:', sentRes.error.message);

    const inbound = (inboundRes.data || []).map((row: any) => ({
      ...row,
      is_starred: normalizeMaybeBool(row.is_starred),
      is_archived: normalizeMaybeBool(row.is_archived),
      is_read: normalizeMaybeBool(row.is_read),
    })) as InboundEmail[];
    const sent = ((sentRes?.data as any[]) || []).map((row: any) => ({
      ...row,
      is_starred: normalizeMaybeBool(row.is_starred),
      is_archived: normalizeMaybeBool(row.is_archived),
    })) as SentEmail[];

    return {
      inbound: hasInboundStar ? inbound.filter((x) => x.is_starred) : inbound,
      sent: hasSentStar ? sent.filter((x) => x.is_starred) : sent,
    };
  } catch (e) {
    if (__DEV__) console.log('fetchStarredEmails error:', e);
    // Offline: let React Query keep the cached mail instead of showing none.
    if (isNetworkError(e)) throw e;
    return { inbound: [], sent: [] };
  }
}

export async function fetchSentEmails(userId: string): Promise<SentEmail[]> {
  try {
    const hasSentTable = await tableExists('sent_emails');
    if (!hasSentTable) {
      if (__DEV__) console.log('fetchSentEmails: sent_emails table not found');
      return [];
    }

    const { data, error } = await adminSupabase
      .from('sent_emails')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(50);

    if (error) {
      if (__DEV__) console.log('Error fetching sent emails:', error.message);
      if (isNetworkError(error)) throw error;
      return [];
    }
    if (__DEV__) console.log('fetchSentEmails: got', (data || []).length, 'rows');
    return ((data || []) as any[]).map((row: any) => ({
      ...row,
      is_starred: normalizeMaybeBool(row.is_starred),
      is_archived: normalizeMaybeBool(row.is_archived),
    })) as SentEmail[];
  } catch (e) {
    if (__DEV__) console.log('fetchSentEmails error:', e);
    // Offline: let React Query keep the cached mail instead of showing none.
    if (isNetworkError(e)) throw e;
    return [];
  }
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64
}

async function sendEmailDirectFetch(payload: Record<string, any>): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.log('send-email direct fetch error:', res.status, await res.text());
      return false;
    }
    const data = await res.json();
    return data?.success || false;
  } catch (e) {
    console.log('sendEmailDirectFetch error:', e);
    return false;
  }
}

export async function sendEmailViaResend(
  from: string,
  to: string,
  subject: string,
  body: string,
  userId: string,
  isHtml: boolean = false,
  inReplyToMessageId?: string,
  senderName?: string,
  emailAttachments?: EmailAttachment[]
): Promise<boolean> {
  const payload = {
    from: from.includes('<') ? from : `${senderName || 'Iris Mail'} <${from}>`,
    to: Array.isArray(to) ? to : [to],
    subject,
    body,
    user_id: userId,
    is_html: isHtml,
    in_reply_to: inReplyToMessageId || null,
    attachments: emailAttachments || null,
  };

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: payload,
    });

    if (error) {
      console.log('send-email edge function error:', error.message);
      return sendEmailDirectFetch(payload);
    }
    return data?.success || false;
  } catch (e) {
    console.log('sendEmailViaResend error:', e);
    return sendEmailDirectFetch(payload);
  }
}

export async function toggleStarInbound(emailId: string, starred: boolean): Promise<boolean> {
  if (!(await columnExists('inbound_emails', 'is_starred'))) return false;
  const { error } = await supabase.from('inbound_emails').update({ is_starred: starred }).eq('id', emailId);
  if (error) console.log('toggleStarInbound error:', error.message);
  return !error;
}

export async function toggleStarSent(emailId: string, starred: boolean): Promise<boolean> {
  if (!(await tableExists('sent_emails'))) return false;
  if (!(await columnExists('sent_emails', 'is_starred'))) return false;
  const { error } = await adminSupabase.from('sent_emails').update({ is_starred: starred }).eq('id', emailId);
  if (error) console.log('toggleStarSent error:', error.message);
  return !error;
}

export async function archiveInbound(emailId: string, archived: boolean): Promise<boolean> {
  if (!(await columnExists('inbound_emails', 'is_archived'))) return false;
  const { error } = await supabase.from('inbound_emails').update({ is_archived: archived }).eq('id', emailId);
  if (error) console.log('archiveInbound error:', error.message);
  return !error;
}

export async function archiveSent(emailId: string, archived: boolean): Promise<boolean> {
  if (!(await tableExists('sent_emails'))) return false;
  if (!(await columnExists('sent_emails', 'is_archived'))) return false;
  const { error } = await adminSupabase.from('sent_emails').update({ is_archived: archived }).eq('id', emailId);
  if (error) console.log('archiveSent error:', error.message);
  return !error;
}

export async function markInboundRead(emailId: string, read: boolean): Promise<boolean> {
  if (!(await columnExists('inbound_emails', 'is_read'))) return false;
  const { error } = await supabase.from('inbound_emails').update({ is_read: read }).eq('id', emailId);
  if (error) console.log('markInboundRead error:', error.message);
  return !error;
}

export async function deleteInboundEmail(emailId: string): Promise<boolean> {
  const { error } = await supabase.from('inbound_emails').delete().eq('id', emailId);
  return !error;
}

export async function deleteSentEmail(emailId: string): Promise<boolean> {
  if (!(await tableExists('sent_emails'))) return false;
  const { error } = await adminSupabase.from('sent_emails').delete().eq('id', emailId);
  return !error;
}

export async function fetchThreadMessages(userId: string, threadId: string): Promise<Array<(InboundEmail | SentEmail) & { _kind: 'inbound' | 'sent' }>> {
  const messages: Array<(InboundEmail | SentEmail) & { _kind: 'inbound' | 'sent' }> = [];
  try {
    const hasThreadCol = await columnExists('inbound_emails', 'thread_id');
    const hasSentTable = await tableExists('sent_emails');
    const hasSentThread = hasSentTable ? await columnExists('sent_emails', 'thread_id') : false;

    const [inboundRes, sentRes] = await Promise.all([
      hasThreadCol
        ? supabase.from('inbound_emails').select('*').eq('user_id', userId).eq('thread_id', threadId).order('received_at', { ascending: true })
        : supabase.from('inbound_emails').select('*').eq('user_id', userId).order('received_at', { ascending: true }),
      hasSentThread
        ? adminSupabase.from('sent_emails').select('*').eq('user_id', userId).eq('thread_id', threadId).order('sent_at', { ascending: true })
        : hasSentTable
          ? adminSupabase.from('sent_emails').select('*').eq('user_id', userId).order('sent_at', { ascending: true })
          : { data: [], error: null } as any,
    ]);

    for (const row of (inboundRes.data || [])) {
      const normalized = computeThreadId(row.subject);
      if (!hasThreadCol && normalized !== threadId) continue;
      messages.push({ ...row, is_starred: normalizeMaybeBool(row.is_starred), is_archived: normalizeMaybeBool(row.is_archived), is_read: normalizeMaybeBool(row.is_read), _kind: 'inbound' });
    }
    for (const row of (sentRes.data || [])) {
      const normalized = computeThreadId(row.subject);
      if (!hasSentThread && normalized !== threadId) continue;
      messages.push({ ...row, is_starred: normalizeMaybeBool(row.is_starred), is_archived: normalizeMaybeBool(row.is_archived), _kind: 'sent' });
    }

    messages.sort((a, b) => {
      const aDate = '_kind' in a && a._kind === 'inbound' ? (a as InboundEmail).received_at : (a as SentEmail).sent_at;
      const bDate = '_kind' in b && b._kind === 'inbound' ? (b as InboundEmail).received_at : (b as SentEmail).sent_at;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });
  } catch (e) {
    if (__DEV__) console.log('fetchThreadMessages error:', e);
  }
  return messages;
}

export function subscribeToMailChanges(
  userId: string,
  onUpdate: () => void
) {
  const channel = supabase
    .channel('nextquark-mail-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inbound_emails', filter: `user_id=eq.${userId}` },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sent_emails', filter: `user_id=eq.${userId}` },
      () => onUpdate()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function forwardEmail(
  emailId: string,
  userId: string,
  forwardTo: string,
  senderName?: string
): Promise<boolean> {
  const payload = {
    action: 'forward',
    email_id: emailId,
    user_id: userId,
    forward_to: forwardTo,
  };

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: payload,
    });

    if (error) {
      console.log('forward email error:', error.message);
      return sendEmailDirectFetch(payload);
    }
    return data?.success || false;
  } catch (e) {
    console.log('forwardEmail error:', e);
    return sendEmailDirectFetch(payload);
  }
}

export interface InboxSettings {
  forward_to_email: string | null;
  reply_mode: 'in_app' | 'forward_to_email';
}

export async function fetchInboxSettings(userId: string): Promise<InboxSettings> {
  try {
    const { data } = await supabase
      .from('proxy_emails')
      .select('forward_to_email, reply_mode')
      .eq('user_id', userId)
      .single();
    return {
      forward_to_email: data?.forward_to_email || null,
      reply_mode: data?.reply_mode === 'forward_to_email' ? 'forward_to_email' : 'in_app',
    };
  } catch {
    return { forward_to_email: null, reply_mode: 'in_app' };
  }
}

export async function saveInboxSettings(userId: string, settings: Partial<InboxSettings>): Promise<boolean> {
  try {
    const { error } = await adminSupabase
      .from('proxy_emails')
      .update(settings)
      .eq('user_id', userId);
    if (error) {
      if (__DEV__) console.log('saveInboxSettings error:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    if (__DEV__) console.log('saveInboxSettings error:', e);
    return false;
  }
}

export function getAvatarUrl(email: string): string {
  const domain = email.split('@')[1];
  if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
    return `https://logo.clearbit.com/${domain}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=random&color=fff&size=80`;
}
