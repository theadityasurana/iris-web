import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, PhoneOff, Loader } from 'lucide-react';
import { useAuth } from '@web/auth/AuthProvider';
import { getLiveKitToken, saveInterviewTranscript, type TranscriptEntry } from '@/lib/livekit';
import type { UserProfile } from '@/types';

// Lazy-load livekit-client to avoid SSR issues
let Room: any = null;
let RoomEvent: any = null;
let Track: any = null;

async function loadLiveKit() {
  if (Room) return;
  const lk = await import('livekit-client');
  Room = lk.Room;
  RoomEvent = lk.RoomEvent;
  Track = lk.Track;
}

type Phase = 'connecting' | 'active' | 'ended' | 'error';

export default function InterviewRoom() {
  const { userId, profile } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const role = params.get('role') ?? 'Software Engineer';
  const company = params.get('company') ?? '';
  const voice = params.get('voice') ?? 'iris-professional';

  const [phase, setPhase] = useState<Phase>('connecting');
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState('');
  const [agentText, setAgentText] = useState('');
  const roomRef = useRef<any>(null);
  const startedAt = useRef(new Date().toISOString());
  const roomName = useRef(`interview-${userId}-${Date.now()}`);
  const audioRef = useRef<HTMLAudioElement>(null);

  const end = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    setPhase('ended');
    if (userId && transcript.length > 0) {
      await saveInterviewTranscript({
        userId: userId!,
        jobId: '',
        jobTitle: role,
        companyName: company,
        roomName: roomName.current,
        startedAt: startedAt.current,
        endedAt: new Date().toISOString(),
        transcript,
        voiceId: voice,
      });
    }
    navigate('/app/interviews');
  }, [userId, transcript, role, company, voice, navigate]);

  useEffect(() => {
    if (!userId || !profile) return;
    let cancelled = false;

    (async () => {
      try {
        await loadLiveKit();
        const tokenData = await getLiveKitToken(
          userId,
          profile.name || 'Candidate',
          '',
          role,
          company,
          '',
          profile as UserProfile,
          voice,
          'normal',
          'en',
        );

        if (cancelled) return;

        const room = new Room();
        roomRef.current = room;

        room.on(RoomEvent.DataReceived, (data: Uint8Array) => {
          try {
            const msg = JSON.parse(new TextDecoder().decode(data));
            if (msg.type === 'transcript' && msg.speaker && msg.text) {
              setTranscript(prev => [...prev, { speaker: msg.speaker, text: msg.text, timestamp: new Date().toISOString() }]);
              if (msg.speaker === 'ai') setAgentText(msg.text);
            }
          } catch {}
        });

        room.on(RoomEvent.TrackSubscribed, (track: any) => {
          if (track.kind === Track.Kind.Audio && audioRef.current) {
            track.attach(audioRef.current);
          }
        });

        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled) setPhase('ended');
        });

        await room.connect(tokenData.url, tokenData.token);
        await room.localParticipant.setMicrophoneEnabled(true);
        if (!cancelled) setPhase('active');
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to connect');
          setPhase('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      roomRef.current?.disconnect();
    };
  }, [userId, profile, role, company, voice]);

  const toggleMic = async () => {
    if (!roomRef.current) return;
    const next = !muted;
    await roomRef.current.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#0d0d0c', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <audio ref={audioRef} autoPlay />

      {phase === 'connecting' && (
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 600 }}>Connecting to interviewer…</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>{role}{company ? ` at ${company}` : ''}</div>
        </div>
      )}

      {phase === 'error' && (
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Connection failed</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>{error}</div>
          <button className="btn" onClick={() => navigate('/app/interviews')}>Back to interviews</button>
        </div>
      )}

      {phase === 'active' && (
        <div style={{ width: '100%', maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Live interview</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{role}</div>
            {company && <div style={{ color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{company}</div>}
          </div>

          {/* Agent speech bubble */}
          {agentText && (
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '16px 20px', color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 1.6 }}>
              {agentText}
            </div>
          )}

          {/* Transcript */}
          <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {transcript.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.speaker === 'ai' ? 'var(--brand)' : 'rgba(255,255,255,0.4)', width: 60, flexShrink: 0, paddingTop: 2 }}>
                  {t.speaker === 'ai' ? 'Iris' : 'You'}
                </span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{t.text}</span>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
            <button
              onClick={toggleMic}
              style={{ width: 60, height: 60, borderRadius: '50%', background: muted ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
            >
              {muted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <button
              onClick={end}
              style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--danger)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
            >
              <PhoneOff size={22} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
