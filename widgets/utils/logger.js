import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Persistent session ID for this flow instance
const sessionId = uuidv4();

/**
 * Log a cancellation event to Supabase.
 * Skips logging if in preview mode.
 */
export async function logEvent({
  accountId,
  step,
  reasonKey,
  write_in = null,
  config,
}) {
  if (config?.preview) {
    console.log('🧪 [Preview Mode] Skipping event log:', {
      step,
      reasonKey,
      write_in,
    });
    return;
  }

  try {
    const { data, error } = await supabase.from('event_logs').insert([
      {
        account_id: accountId,
        session_id: sessionId,
        step,
        reason_key: reasonKey,
        write_in: write_in || null,
      },
    ]);

    if (error) {
      throw error;
    }

    console.log('✅ Logged event:', step, data);
  } catch (err) {
    console.error('❌ Supabase logging error:', err);
  }
}
