import { GoogleAuth } from "google-auth-library";

const auth = new GoogleAuth({
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const { tokens, name, isAsleep } = req.body;
  if (!tokens || tokens.length === 0) {
    return res.status(400).json({ error: "No tokens provided" });
  }

  try {
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    console.log("Access token prefix:", accessToken.token?.substring(0, 20));
console.log("Client email used:", process.env.FIREBASE_CLIENT_EMAIL);

    const results = await Promise.all(tokens.map(token =>
      fetch(`https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: {
              title: isAsleep ? "🌙 Goodnight!" : "👋 Good morning!",
              body: isAsleep ? `${name} went to sleep` : `${name} woke up`,
            },
          },
        }),
      }).then(r => r.json())
    ));

    console.log("FCM results:", JSON.stringify(results));
    res.status(200).json({ success: true, results });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
}