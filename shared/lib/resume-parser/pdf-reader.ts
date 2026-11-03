import { supabase } from '@/lib/supabase';

export interface PdfParseResult {
  /** Raw text extracted from PDF (always available) */
  rawText: string;
  /** Structured data from AI models (null if both failed  - regex fallback needed) */
  geminiData: Record<string, any> | null;
  /** Which method succeeded */
  method: string;
  /** Human-readable reason when the server could not read the file (e.g. legacy .doc). */
  errorMessage?: string;
}

/**
 * Parse a resume (PDF or .docx) via the parse-resume edge function, which
 * extracts text and hyperlinks, runs Gemini (reading the PDF itself) and GPT
 * in parallel, and normalises the result. If the models fail, the raw text is
 * returned for the on-device parser. Works on iOS, Android and web.
 */
export async function extractAndParsePdf(fileUri: string): Promise<PdfParseResult> {
  try {
    console.log('[RESUME-PARSER] 📖 Reading PDF from URI:', fileUri);
    const response = await fetch(fileUri);
    const blob = await response.blob();
    console.log('[RESUME-PARSER] 📖 Blob size:', blob.size, 'type:', blob.type);

    // Convert blob to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const b64 = reader.result.split(',')[1];
          resolve(b64 || '');
        } else {
          resolve('');
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

    if (!base64) {
      console.log('[RESUME-PARSER] ⚠️ Could not convert PDF to base64');
      return { rawText: '', geminiData: null, method: 'regex-fallback' };
    }
    console.log('[RESUME-PARSER] 📖 Base64 length:', base64.length);

    // Send to Supabase Edge Function
    console.log('[RESUME-PARSER] 📡 Sending to edge function (pdf-parse + Gemini)...');
    const { data, error } = await supabase.functions.invoke('parse-resume', {
      body: { base64 },
    });

    if (error) {
      console.log('[RESUME-PARSER] ❌ Edge function error:', error.message);
      // 415 / 422 carry a message meant for the user (e.g. "upload a PDF or .docx").
      const body = await (error as any).context?.json?.().catch(() => null);
      return { rawText: '', geminiData: null, method: 'regex-fallback', errorMessage: body?.message };
    }

    const rawText = data?.text || '';
    const geminiData = data?.parsed || null;
    const method = data?.method || 'text-only';

    console.log('[RESUME-PARSER] 📖 Extracted text length:', rawText.length);
    console.log('[RESUME-PARSER] 🤖 Parse method:', method);

    if (geminiData) {
      console.log('[RESUME-PARSER] ✅ AI structured data received (method:', method, ')');
      return { rawText, geminiData, method };
    }

    console.log('[RESUME-PARSER] ⚠️ AI parsing failed, falling back to regex parser');
    return { rawText, geminiData: null, method: 'regex-fallback' };
  } catch (error) {
    console.log('[RESUME-PARSER] ❌ PDF extraction error:', error);
    return { rawText: '', geminiData: null, method: 'regex-fallback' };
  }
}
