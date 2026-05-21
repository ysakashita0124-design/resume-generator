import { useState } from "react";

const API = "http://localhost:8000";

const initialData = {
  name: "",
  title: "",
  email: "",
  github: "",
  summary: "",
  skills: "",
  experiences: [{ company: "", role: "", period: "", bullets: "" }],
  projects: [{ name: "", url: "", desc: "" }],
};

const TABS = ["基本情報", "スキル", "経歴", "プロジェクト"];

export default function App() {
  const [data, setData] = useState(initialData);
  const [tab, setTab] = useState(0);
  const [preview, setPreview] = useState(false);
  const [mdText, setMdText] = useState("");
  const [loading, setLoading] = useState({ md: false, pdf: false });
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const set = (field, val) => setData((d) => ({ ...d, [field]: val }));
  const setExp = (i, field, val) =>
    setData((d) => {
      const exps = [...d.experiences];
      exps[i] = { ...exps[i], [field]: val };
      return { ...d, experiences: exps };
    });
  const setProj = (i, field, val) =>
    setData((d) => {
      const projs = [...d.projects];
      projs[i] = { ...projs[i], [field]: val };
      return { ...d, projects: projs };
    });

  const fetchMarkdown = async () => {
    setLoading((l) => ({ ...l, md: true }));
    setError("");
    try {
      const res = await fetch(`${API}/api/markdown`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      setMdText(json.markdown);
      setPreview(true);
    } catch {
      setError("バックエンドに接続できません。サーバーが起動しているか確認してね。");
    } finally {
      setLoading((l) => ({ ...l, md: false }));
    }
  };

  const downloadPDF = async () => {
    setLoading((l) => ({ ...l, pdf: true }));
    setError("");
    try {
      const res = await fetch(`${API}/api/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("PDF生成失敗");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.name || "resume"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("PDF生成に失敗しました。");
    } finally {
      setLoading((l) => ({ ...l, pdf: false }));
    }
  };

  const copyMd = () => {
    navigator.clipboard.writeText(mdText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d0d",
      color: "#e8e4dc",
      fontFamily: "'Georgia', serif",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid #2a2a2a",
        padding: "20px 24px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#666", textTransform: "uppercase", marginBottom: 4 }}>
            Resume
          </div>
          <div style={{ fontSize: 22, fontWeight: "bold", color: "#f0ece4" }}>
            MD Generator
          </div>
        </div>
        <button
          onClick={preview ? () => setPreview(false) : fetchMarkdown}
          disabled={loading.md}
          style={{
            background: preview ? "#e8e4dc" : "transparent",
            color: preview ? "#0d0d0d" : "#e8e4dc",
            border: "1px solid #3a3a3a",
            borderRadius: 6,
            padding: "8px 16px",
            fontSize: 13,
            cursor: "pointer",
            fontFamily: "monospace",
            opacity: loading.md ? 0.5 : 1,
          }}
        >
          {loading.md ? "生成中..." : preview ? "← Edit" : "Preview →"}
        </button>
      </div>

      {error && (
        <div style={{
          background: "#2a1010",
          borderBottom: "1px solid #5a2020",
          padding: "12px 24px",
          fontSize: 13,
          color: "#f87171",
        }}>
          ⚠ {error}
        </div>
      )}

      {preview ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <pre style={{
            flex: 1,
            margin: 0,
            padding: "24px",
            background: "#111",
            color: "#c8f7c5",
            fontFamily: "'Courier New', monospace",
            fontSize: 13,
            lineHeight: 1.7,
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {mdText}
          </pre>
          <div style={{
            display: "flex",
            gap: 12,
            padding: "16px 24px",
            borderTop: "1px solid #2a2a2a",
          }}>
            <button onClick={copyMd} style={btnStyle("#1a3a2a", "#4ade80")}>
              {copied ? "✓ Copied!" : "Copy MD"}
            </button>
            <button
              onClick={downloadPDF}
              disabled={loading.pdf}
              style={{ ...btnStyle("#1a2a3a", "#60a5fa"), opacity: loading.pdf ? 0.5 : 1 }}
            >
              {loading.pdf ? "生成中..." : "Download PDF"}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #2a2a2a", overflowX: "auto" }}>
            {TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                style={{
                  padding: "12px 20px",
                  background: "none",
                  border: "none",
                  borderBottom: tab === i ? "2px solid #e8e4dc" : "2px solid transparent",
                  color: tab === i ? "#e8e4dc" : "#555",
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
            {tab === 0 && (
              <Section title="基本情報">
                <Field label="名前" value={data.name} onChange={(v) => set("name", v)} placeholder="山田 太郎" />
                <Field label="肩書き" value={data.title} onChange={(v) => set("title", v)} placeholder="Full Stack Engineer" />
                <Field label="メール" value={data.email} onChange={(v) => set("email", v)} placeholder="taro@example.com" />
                <Field label="GitHub" value={data.github} onChange={(v) => set("github", v)} placeholder="taro-yamada" />
                <Field label="サマリー" value={data.summary} onChange={(v) => set("summary", v)} placeholder="自己紹介を書いてね..." multiline />
              </Section>
            )}

            {tab === 1 && (
              <Section title="スキル">
                <Field
                  label="スキル（カンマ区切り）"
                  value={data.skills}
                  onChange={(v) => set("skills", v)}
                  placeholder="React, Python, FastAPI, PostgreSQL, Docker"
                  multiline
                />
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {data.skills.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                    <span key={s} style={{
                      background: "#1a1a1a",
                      border: "1px solid #333",
                      borderRadius: 4,
                      padding: "4px 10px",
                      fontSize: 12,
                      fontFamily: "monospace",
                      color: "#a8d8a8",
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {tab === 2 && (
              <Section title="経歴">
                {data.experiences.map((exp, i) => (
                  <div key={i} style={{ border: "1px solid #2a2a2a", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 12, letterSpacing: 2 }}>EXPERIENCE {i + 1}</div>
                    <Field label="会社名" value={exp.company} onChange={(v) => setExp(i, "company", v)} placeholder="株式会社〇〇" />
                    <Field label="役職" value={exp.role} onChange={(v) => setExp(i, "role", v)} placeholder="Backend Engineer" />
                    <Field label="期間" value={exp.period} onChange={(v) => setExp(i, "period", v)} placeholder="2022.04 — 現在" />
                    <Field label="業務内容（1行1項目）" value={exp.bullets} onChange={(v) => setExp(i, "bullets", v)} placeholder={"ReactでSPA開発\nREST API設計・実装"} multiline />
                  </div>
                ))}
                <button
                  onClick={() => setData((d) => ({ ...d, experiences: [...d.experiences, { company: "", role: "", period: "", bullets: "" }] }))}
                  style={addBtnStyle}
                >
                  + 経歴を追加
                </button>
              </Section>
            )}

            {tab === 3 && (
              <Section title="プロジェクト">
                {data.projects.map((proj, i) => (
                  <div key={i} style={{ border: "1px solid #2a2a2a", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 12, letterSpacing: 2 }}>PROJECT {i + 1}</div>
                    <Field label="プロジェクト名" value={proj.name} onChange={(v) => setProj(i, "name", v)} placeholder="resume-generator" />
                    <Field label="GitHub URL" value={proj.url} onChange={(v) => setProj(i, "url", v)} placeholder="https://github.com/you/project" />
                    <Field label="説明" value={proj.desc} onChange={(v) => setProj(i, "desc", v)} placeholder="React + FastAPIで作ったMarkdown履歴書ジェネレーター" multiline />
                  </div>
                ))}
                <button
                  onClick={() => setData((d) => ({ ...d, projects: [...d.projects, { name: "", url: "", desc: "" }] }))}
                  style={addBtnStyle}
                >
                  + プロジェクトを追加
                </button>
              </Section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", textTransform: "uppercase", marginBottom: 20 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline }) {
  const base = {
    width: "100%",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: 6,
    padding: "10px 12px",
    color: "#e8e4dc",
    fontSize: 14,
    fontFamily: "'Georgia', serif",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 14,
  };
  return (
    <div>
      <div style={{ fontSize: 11, color: "#666", marginBottom: 6, letterSpacing: 1 }}>{label}</div>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          style={{ ...base, resize: "vertical", lineHeight: 1.6 }} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={base} />
      )}
    </div>
  );
}

const addBtnStyle = {
  width: "100%",
  background: "transparent",
  border: "1px dashed #333",
  borderRadius: 6,
  padding: "12px",
  color: "#555",
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "'Georgia', serif",
};

function btnStyle(bg, color) {
  return {
    flex: 1,
    background: bg,
    border: `1px solid ${color}33`,
    borderRadius: 6,
    padding: "12px",
    color,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "monospace",
  };
}
