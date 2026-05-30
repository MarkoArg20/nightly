import { useState, useEffect } from "react";
import { db, messaging } from "./firebase";
import { ref, set, onValue } from "firebase/database";
import { getToken, onMessage } from "firebase/messaging";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export default function App() {
  const [name, setName] = useState(localStorage.getItem("nighty_name") || "");
  const [groupCode, setGroupCode] = useState(localStorage.getItem("nighty_group") || "");
  const [setupDone, setSetupDone] = useState(!!(localStorage.getItem("nighty_name") && localStorage.getItem("nighty_group")));
  const [members, setMembers] = useState({});
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!setupDone) return;
    const membersRef = ref(db, `groups/${groupCode}/members`);
    onValue(membersRef, (snapshot) => {
      setMembers(snapshot.val() || {});
    });
  }, [setupDone, groupCode]);

  useEffect(() => {
    if (!setupDone) return;
    onMessage(messaging, (payload) => {
      setNotification(payload.notification);
      setTimeout(() => setNotification(null), 4000);
    });
  }, [setupDone]);

  async function requestNotificationPermission() {
    try {
      console.log("1. requesting permission...");
      const permission = await Notification.requestPermission();
      console.log("2. permission result:", permission);
      if (permission !== "granted") return;

      console.log("3. registering service worker...");
      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      await navigator.serviceWorker.ready;
      console.log("4. service worker ready!");

      registration.active.postMessage({
        type: "FIREBASE_CONFIG",
        config: {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
          databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
        },
      });

      console.log("5. getting FCM token...");
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      console.log("6. token:", token);

      if (token) {
        const userId = name.toLowerCase().replace(/\s+/g, "_");
        set(ref(db, `groups/${groupCode}/members/${userId}/fcmToken`), token);
      }
    } catch (err) {
      console.error("Error:", err);
    }
  }

  async function updateSleepStatus(isAsleep) {
    const userId = name.toLowerCase().replace(/\s+/g, "_");
    await set(ref(db, `groups/${groupCode}/members/${userId}`), {
      name,
      isAsleep,
      lastSleepAt: Date.now(),
      fcmToken: members[userId]?.fcmToken || null,
    });

    const otherTokens = Object.values(members)
      .filter((m) => m.name !== name && m.fcmToken)
      .map((m) => m.fcmToken);


console.log("other tokens:", otherTokens);
console.log("all members:", members);

    if (otherTokens.length === 0) return;

const response = await fetch("/api/notify.cjs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokens: otherTokens, name, isAsleep }),
    });
    const data = await response.json();
    console.log("notify response:", data);
  }

  function handleSetup() {
    if (!name.trim() || !groupCode.trim()) return;
    localStorage.setItem("nighty_name", name.trim());
    localStorage.setItem("nighty_group", groupCode.trim());
    setSetupDone(true);
  }

  const myUserId = name.toLowerCase().replace(/\s+/g, "_");
  const iAmAsleep = members[myUserId]?.isAsleep;

  if (!setupDone) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Nighty</h1>
        <p style={styles.subtitle}>Sleep together, apart.</p>
        <div style={styles.form}>
          <input
            style={styles.input}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            style={styles.input}
            placeholder="Group code (e.g. family123)"
            value={groupCode}
            onChange={(e) => setGroupCode(e.target.value)}
          />
          <button style={styles.joinButton} onClick={handleSetup}>
            Join group
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {notification && (
        <div style={styles.toast}>
          <strong>{notification.title}</strong>
          <p style={{ margin: 0 }}>{notification.body}</p>
        </div>
      )}

      <h1 style={styles.title}>Nighty</h1>

      <button
        style={{ ...styles.sleepButton, opacity: iAmAsleep ? 0.4 : 1 }}
        onClick={() => updateSleepStatus(!iAmAsleep)}
      >
        🌙
      </button>

      <button onClick={requestNotificationPermission} style={styles.notifButton}>
        enable notifications
      </button>

      <p style={styles.hint}>
        {iAmAsleep ? "you're asleep · tap to wake up" : "tap to say goodnight"}
      </p>

      <div style={styles.memberList}>
        {Object.values(members).map((member) => (
          <div key={member.name} style={styles.memberRow}>
            <span>{member.name}</span>
            <span>{member.isAsleep ? "🌙 sleeping" : "👋 awake"}</span>
          </div>
        ))}
      </div>

      <p style={styles.groupLabel}>group: {groupCode}</p>
    </div>
  );
}

const styles = {
  container: { maxWidth: 400, margin: "0 auto", padding: 40, fontFamily: "sans-serif", textAlign: "center" },
  title: { fontSize: 36, marginBottom: 4 },
  subtitle: { color: "#888", marginBottom: 40 },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  input: { padding: "12px 16px", fontSize: 16, borderRadius: 10, border: "1px solid #ddd", outline: "none" },
  joinButton: { padding: "14px", fontSize: 16, borderRadius: 10, background: "#1a1a2e", color: "white", border: "none", cursor: "pointer" },
  sleepButton: { fontSize: 80, background: "none", border: "none", cursor: "pointer" },
  notifButton: { fontSize: 12, color: "#888", background: "none", border: "1px solid #ddd", borderRadius: 8, padding: "6px 12px", cursor: "pointer", margin: "8px auto", display: "block" },
  hint: { color: "#888", marginTop: 8 },
  memberList: { marginTop: 48, textAlign: "left" },
  memberRow: { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #eee" },
  groupLabel: { marginTop: 40, color: "#ccc", fontSize: 13 },
  toast: { position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "#1a1a2e", color: "white", padding: "12px 20px", borderRadius: 12, zIndex: 999, minWidth: 260 },
};