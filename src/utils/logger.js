import { supabase } from "../supabaseClient";
import { v4 as uuidv4 } from "uuid";

// Generate a session ID for this cancel flow instance
const sessionId = uuidv4();

export async function logEvent({ accountId, step, reasonKey, write_in = null }) {
  const { data, error } = await supabase
    .from('cancel_logs')
    .insert([
      {
        account_id: accountId,
        session_id: sessionId,
        step,
        reason_key: reasonKey,
        write_in: write_in || null
      }
    ]);

  if (error) {
    console.error('❌ Supabase logging error:', error);
  } else {
    console.log('✅ Logged event:', step, data);
  }
}
