import { supabase } from './supabase';
import { UserProfile } from '@/types';

export interface LiveKitTokenResponse {
  token: string;
  url: string;
  roomName: string;
}

export interface InterviewSession {
  id?: string;
  userId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  roomName: string;
  startedAt: string;
  endedAt?: string;
  transcript: TranscriptEntry[];
  report?: any;
  voiceId?: string;
  speed?: string;
  language?: string;
}

export interface TranscriptEntry {
  speaker: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export async function getLiveKitToken(
  userId: string,
  userName: string,
  jobId: string,
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  userProfile: UserProfile,
  voiceId?: string,
  speed?: string,
  language?: string,
): Promise<LiveKitTokenResponse> {
  const { data, error } = await supabase.functions.invoke('livekit-token', {
    body: {
      userId,
      userName,
      jobId,
      jobTitle,
      companyName,
      jobDescription,
      voiceId: voiceId || 'iris-professional',
      speed: speed || 'normal',
      language: language || 'en',
      userProfile: {
        skills: userProfile.skills,
        experience: userProfile.experience,
        education: userProfile.education,
        headline: userProfile.headline,
      },
    },
  });

  if (error) throw new Error(error.message || 'Failed to get LiveKit token');
  if (!data?.token) throw new Error('No token returned');
  return data as LiveKitTokenResponse;
}

export async function saveInterviewTranscript(session: InterviewSession): Promise<boolean> {
  try {
    const { error } = await supabase.from('interview_sessions').insert({
      user_id: session.userId,
      job_id: session.jobId,
      job_title: session.jobTitle,
      company_name: session.companyName,
      room_name: session.roomName,
      started_at: session.startedAt,
      ended_at: session.endedAt || new Date().toISOString(),
      transcript: session.transcript,
      voice_id: session.voiceId || null,
      speed: session.speed || null,
      language: session.language || null,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function getInterviewSessions(userId: string): Promise<InterviewSession[]> {
  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      jobId: row.job_id,
      jobTitle: row.job_title,
      companyName: row.company_name,
      roomName: row.room_name,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      transcript: row.transcript || [],
      report: row.report || null,
    }));
  } catch {
    return [];
  }
}

export interface InterviewReport {
  overallScore: number; // 0-100
  summary: string;
  strengths: string[];
  improvements: string[];
  communicationScore: number; // 0-100
  technicalScore: number; // 0-100
  confidenceScore: number; // 0-100
  questionResponses: {
    question: string;
    answerQuality: 'excellent' | 'good' | 'needs_improvement';
    feedback: string;
  }[];
  tips: string[];
}

export async function generateInterviewReport(
  userId: string,
  session: InterviewSession
): Promise<InterviewReport | null> {
  try {
    const transcriptText = session.transcript
      .map(t => `${t.speaker === 'ai' ? 'Interviewer' : 'Candidate'}: ${t.text}`)
      .join('\n');

    const { data, error } = await supabase.functions.invoke('ai-assist', {
      body: {
        action: 'interview-report',
        jobTitle: session.jobTitle,
        companyName: session.companyName,
        transcript: transcriptText,
      },
    });

    if (error || !data?.success) return null;

    const report = data.report as InterviewReport;

    // Save report to the session row
    await supabase
      .from('interview_sessions')
      .update({ report })
      .eq('user_id', userId)
      .eq('room_name', session.roomName);

    return report;
  } catch {
    return null;
  }
}

export async function getInterviewReport(sessionId: string): Promise<InterviewReport | null> {
  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('report')
      .eq('id', sessionId)
      .single();

    if (error || !data?.report) return null;
    return data.report as InterviewReport;
  } catch {
    return null;
  }
}
