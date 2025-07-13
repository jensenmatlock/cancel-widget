import { supabase } from './supabaseClient';

export const loadConfig = async (accountId) => {
  try {
    const { data, error } = await supabase
      .from('configs')
      .select('config_json')
      .eq('account_id', accountId)
      .single();

    if (error || !data?.config_json) {
      throw new Error(`Config not found for account: ${accountId}`);
    }

    return data.config_json;

  } catch (err) {
    console.error("❌ Widget config load error:", err);

    // Simple end-user message
    showFailMessage();

    return null;
  }
};

function showFailMessage() {
  const failContainer = document.createElement("div");
  failContainer.style.cssText = `
    padding: 1.5em;
    background: #ffe5e5;
    color: #900;
    font-family: sans-serif;
    border: 1px solid #f99;
    border-radius: 5px;
    max-width: 480px;
    margin: 2em auto;
    text-align: center;
  `;
  failContainer.innerHTML = `
    <strong>We're sorry!</strong><br>
    We couldn't load your cancellation flow right now.<br>
    Please refresh or try again later.
  `;

  document.body.innerHTML = "";
  document.body.appendChild(failContainer);
}
