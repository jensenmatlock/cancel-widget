import { supabase } from './supabaseClient';

export const loadConfig = async (token) => {
  try {
    const { data, error } = await supabase
      .from('configs')
      .select('config_json')
      .eq('account_id', token)
      .single()
	  .throwOnError();

    if (error || !data) {
      throw new Error(`Config not found for token: ${token}`);
    }

    return data.config_json;

  } catch (err) {
    console.error("❌ Widget config load error:", err);

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

    return null;
  }
};
