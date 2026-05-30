import { useState, useEffect } from "react";
import { db } from "./firebase";
import { ref, set, onValue } from "firebase/database";

export default function App() {
  const [name, setName] = useState(localStorage.getItem("nighty_name") || "");
  const [groupCode, setGroupCode] = useState(localStorage.getItem("nighty_group") || "");
  const [setupDone, setSetupDone] = useState(!!(localStorage.getItem("nighty_name") && localStorage.getItem("nighty_group")));
  const [members, setMembers] = useState({});

  useEffect(() => {
    if (!setupDone) return;
    const membersRef = ref(db, `groups/${groupCode}/members`);
    onValue(membersRef, (snapshot) => {
      setMembers(snapshot.val() || {});
    });
  }, [setupDone, groupCode]);

  function handleSetup() {
    if (!name.trim() || !groupCode.trim()) return;
    localStorage.setItem("nighty_name", name.trim());
    localStorage.setItem("nighty_group", groupCode.trim());
    setSetupDone(true);
  }

  function goToSleep() {
    const userId = name.toLowerCase().replace(/\s+/g, "_");
    set(ref(db, `groups/${groupCode}/members/${userId}`), {
      name,
      isAsleep: true,
      lastSleepAt: Date.now(),
    });
  }

  function wakeUp() {
    const userId = name.toLowerCase().replace(/\s+/g, "_");
    set(ref(db, `groups/${groupCode}/members/${userId}`), {
      name,
      isAsleep: false,
      lastSleepAt: Date.now(),
    });
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
      <h1 style={styles.title}>Nighty</h1>

      <button
        style={{ ...styles.sleepButton, opacity: iAmAsleep ? 0.4 : 1 }}
        onClick={iAmAsleep ? wakeUp : goToSleep}
      >
        🌙
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
  hint: { color: "#888", marginTop: 8 },
  memberList: { marginTop: 48, textAlign: "left" },
  memberRow: { display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #eee" },
  groupLabel: { marginTop: 40, color: "#ccc", fontSize: 13 },
};