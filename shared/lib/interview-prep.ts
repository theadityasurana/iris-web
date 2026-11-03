import { supabase } from './supabase';
import type { UserProfile } from '@/types';

export interface STARAnswer {
  question: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface InterviewPrepResult {
  answers: STARAnswer[];
  generatedAt: string;
}

/**
 * Load cached interview prep from Supabase for a specific application.
 * Returns null if not found.
 */
export async function getCachedInterviewPrep(userId: string, applicationId: string): Promise<InterviewPrepResult | null> {
  try {
    const { data } = await supabase
      .from('iris_report_data')
      .select('interview_prep, prep_generated_at')
      .eq('user_id', userId)
      .eq('application_id', applicationId)
      .single();

    if (data?.interview_prep && Array.isArray(data.interview_prep) && data.interview_prep.length > 0) {
      return { answers: data.interview_prep as STARAnswer[], generatedAt: data.prep_generated_at || '' };
    }
  } catch {}
  return null;
}

/**
 * Save interview prep to Supabase for a specific application.
 */
export async function saveInterviewPrep(userId: string, applicationId: string, answers: STARAnswer[]): Promise<void> {
  try {
    await supabase
      .from('iris_report_data')
      .update({ interview_prep: answers, prep_generated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('application_id', applicationId);
  } catch (e) {
    console.log('[INTERVIEW-PREP] Failed to save:', e);
  }
}

/**
 * Generate STAR-format behavioral interview answers using GPT/Gemini via ai-assist.
 * Checks cache first, generates and saves if not cached.
 */
export async function generateInterviewPrep(
  userId: string,
  profile: UserProfile,
  jobTitle: string,
  companyName: string,
  description: string,
  applicationId: string
): Promise<InterviewPrepResult> {
  // Check cache first
  const cached = await getCachedInterviewPrep(userId, applicationId);
  if (cached) return cached;

  // Generate via AI
  try {
    const { data, error } = await supabase.functions.invoke('ai-assist', {
      body: {
        action: 'interview-prep',
        profile: {
          skills: (profile.skills || []).slice(0, 12).join(', '),
          desiredRoles: (profile.desiredRoles || []).join(', '),
          experienceLevel: profile.experienceLevel || '',
          headline: profile.headline || '',
          experience: (profile.experience || []).slice(0, 3).map(e => ({
            title: e.title,
            company: e.company,
            description: (e.description || '').slice(0, 200),
          })),
        },
        job: { jobTitle, companyName, description: description.slice(0, 800) },
      },
    });

    if (!error && data?.success && Array.isArray(data.answers) && data.answers.length > 0) {
      const result: InterviewPrepResult = { answers: data.answers, generatedAt: new Date().toISOString() };
      // Save to Supabase
      await saveInterviewPrep(userId, applicationId, data.answers);
      return result;
    }
  } catch (e) {
    console.log('[INTERVIEW-PREP] AI generation error:', e);
  }

  // Fallback: generate locally and save
  const fallback = generateFallbackAnswers(profile, jobTitle, companyName);
  await saveInterviewPrep(userId, applicationId, fallback);
  return { answers: fallback, generatedAt: new Date().toISOString() };
}

function generateFallbackAnswers(profile: UserProfile, jobTitle: string, companyName: string): STARAnswer[] {
  const topSkill = (profile.skills || [])[0] || 'my core skill';
  const topExp = (profile.experience || [])[0];
  const company = topExp?.company || 'my previous company';
  const title = topExp?.title || 'my previous role';

  return [
    {
      question: 'Tell me about a time you solved a complex technical problem.',
      situation: `At ${company}, while working as ${title}, we encountered a critical performance bottleneck affecting user experience.`,
      task: 'I was responsible for identifying the root cause and implementing a fix within a tight deadline.',
      action: `I used ${topSkill} to profile the system, identified the bottleneck, and refactored the core logic to optimize performance.`,
      result: 'The fix reduced response times by 60% and the solution was adopted as a standard pattern across the team.',
    },
    {
      question: 'Describe a time you worked effectively in a team.',
      situation: `During a major product launch at ${company}, our cross-functional team needed to deliver a feature under aggressive timelines.`,
      task: 'I needed to coordinate with design and backend teams to ensure seamless integration.',
      action: 'I set up daily standups, created shared documentation, and proactively flagged blockers before they became issues.',
      result: 'We delivered on time and the feature became one of the most-used in the product.',
    },
    {
      question: `Why are you interested in ${jobTitle} at ${companyName}?`,
      situation: `I've been following ${companyName}'s work in the industry and their approach aligns with my career goals.`,
      task: `I'm looking for a role where I can apply my ${topSkill} expertise to meaningful problems at scale.`,
      action: `I researched the team's recent projects and identified specific areas where my experience directly applies.`,
      result: `I'm confident my background makes me a strong contributor from day one, and I'm excited about the growth opportunity.`,
    },
    {
      question: 'Tell me about a time you had to learn something quickly.',
      situation: `At ${company}, we adopted a new technology stack mid-project that none of the team had used before.`,
      task: `I needed to become productive in ${topSkill}-adjacent tools within two weeks to meet our sprint deadline.`,
      action: 'I dedicated evenings to documentation and built a prototype, then shared my learnings with the team in a lunch-and-learn session.',
      result: 'The team ramped up 3x faster than expected and we delivered the sprint on schedule.',
    },
  ];
}
