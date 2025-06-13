export const postResponse = async (data) => {
  try {
    const res = await fetch("https://api.retainiq.com/response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Response not accepted");

    // [FUTURE]: Trigger webhook to customer system here
    // await sendToWebhook(data); // placeholder

    return true;
  } catch (err) {
    console.error("Error posting cancel data:", err);
    return false;
  }
};
