import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  const { tokens, name, isAsleep } = req.body;

  if (!tokens || tokens.length === 0) {
    return res.status(400).json({ error: "No tokens provided" });
  }

  const message = {
    notification: {
      title: isAsleep ? "🌙 Goodnight!" : "👋 Good morning!",
      body: isAsleep ? `${name} went to sleep` : `${name} woke up`,
    },
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    res.status(200).json({ success: true, response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}