export async function validateCustomer(accountId) {
  const domain = window.location.hostname;

  try {
    const res = await fetch(
      `${import.meta.env.VITE_EDGE_BASE_URL}/validate-customer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: accountId,
          domain,
        }),
      }
    );

    if (!res.ok) {
      console.warn('⚠️ validate-customer call failed');
      return { valid: false, tier: null, credentials: {} };
    }

    const { valid, tier, credentials } = await res.json();
    return { valid, tier, credentials };
  } catch (err) {
    console.error('❌ validateCustomer failed:', err);
    return { valid: false, tier: null, credentials: {} };
  }
}
