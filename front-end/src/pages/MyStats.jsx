import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from "recharts";
import Menubar from "@/components/Menubar/Menubar";
import Navbar from "@/components/Navbar/Navbar";
import { WORKLOG_ENDPOINTS, AUTH_ENDPOINTS } from "@/config/api";
import { Loading } from "@/components/ui/loading";
import { ChevronLeft, BarChart2, Flame, FileText, Hash } from "lucide-react";

// ── Color palette (harmonious purple tones) ──────────────────────────────────
const PALETTE = [
  "hsl(250,60%,55%)",
  "hsl(270,55%,60%)",
  "hsl(230,60%,60%)",
  "hsl(290,50%,58%)",
  "hsl(210,60%,58%)",
];

// ── Custom tooltip for BarChart ───────────────────────────────────────────────
const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "0.5rem",
      padding: "0.5rem 0.75rem",
      fontSize: "0.8rem",
      color: "hsl(var(--foreground))",
      boxShadow: "0 4px 12px hsl(0,0%,0%,0.1)"
    }}>
      <p style={{ fontWeight: 600, marginBottom: "0.2rem" }}>{label}</p>
      <p>{payload[0].value} worklog{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div style={{
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "1rem",
    padding: "1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    flex: "1",
    minWidth: "160px",
  }}>
    <div style={{
      width: "2.75rem", height: "2.75rem",
      borderRadius: "0.75rem",
      background: `${color}22`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))", marginBottom: "0.2rem" }}>{label}</p>
      <p style={{ fontSize: "1.6rem", fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))", marginTop: "0.15rem" }}>{sub}</p>}
    </div>
  </div>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const MyStats = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("Your");

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    // Fetch user name for heading
    fetch(AUTH_ENDPOINTS.PROFILE, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setUserName((d.user || d)?.name?.split(" ")[0] || "Your"))
      .catch(() => {});

    // Fetch stats
    fetch(WORKLOG_ENDPOINTS.MY_STATS, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then(r => {
        if (!r.ok) throw new Error("Failed to load stats");
        return r.json();
      })
      .then(data => { setStats(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return <Loading fullScreen message="Loading your stats..." />;

  return (
    <div className="flex h-screen bg-background">
      <Menubar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <div className="flex-1 overflow-y-auto p-8" style={{ background: "hsl(var(--background))" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "hsl(var(--muted-foreground))", display: "flex", alignItems: "center"
              }}
            >
              <ChevronLeft size={22} />
            </button>
            <div>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "hsl(var(--foreground))", lineHeight: 1 }}>
                {userName}'s Activity Stats
              </h1>
              <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))", marginTop: "0.25rem" }}>
                Your personal worklog overview
              </p>
            </div>
          </div>

          {error && (
            <div style={{
              background: "hsl(0,60%,97%)", border: "1px solid hsl(0,60%,85%)",
              borderRadius: "0.75rem", padding: "1rem 1.25rem",
              color: "hsl(0,60%,45%)", marginBottom: "1.5rem", fontSize: "0.875rem"
            }}>
              ⚠️ {error}
            </div>
          )}

          {stats && (
            <>
              {/* ── Stat Cards ── */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
                <StatCard
                  icon={FileText}
                  label="Total Worklogs"
                  value={stats.total}
                  sub="all time"
                  color="hsl(250,60%,55%)"
                />
                <StatCard
                  icon={Hash}
                  label="Total Words Written"
                  value={stats.totalWords?.toLocaleString()}
                  sub="across all worklogs"
                  color="hsl(270,55%,60%)"
                />
                <StatCard
                  icon={Flame}
                  label="Current Streak"
                  value={`${stats.streak}d`}
                  sub={stats.streak === 0 ? "start writing today!" : "consecutive days 🔥"}
                  color="hsl(25,90%,55%)"
                />
                <StatCard
                  icon={BarChart2}
                  label="This Week"
                  value={stats.dailyCounts?.reduce((s, d) => s + d.count, 0) ?? 0}
                  sub="worklogs (last 7 days)"
                  color="hsl(210,60%,58%)"
                />
              </div>

              {/* ── Charts Row ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>

                {/* Bar Chart — daily activity */}
                <div style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "hsl(var(--foreground))" }}>
                    📅 Activity — Last 7 Days
                  </h2>
                  {stats.dailyCounts?.every(d => d.count === 0) ? (
                    <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.875rem", textAlign: "center", padding: "2rem 0" }}>
                      No worklogs in the past 7 days.<br />Start writing to see your activity!
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stats.dailyCounts} barSize={28}>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={v => v.split(",")[0]} // show only weekday
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                          axisLine={false}
                          tickLine={false}
                          width={20}
                        />
                        <Tooltip content={<CustomBarTooltip />} cursor={{ fill: "hsl(250,60%,97%)" }} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {stats.dailyCounts.map((_, i) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Pie Chart — top tags */}
                <div style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", color: "hsl(var(--foreground))" }}>
                    🏷️ Top Tags
                  </h2>
                  {!stats.topTags?.length ? (
                    <p style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.875rem", textAlign: "center", padding: "2rem 0" }}>
                      No tags yet. Add tags to your worklogs to see them here.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={stats.topTags}
                          dataKey="count"
                          nameKey="tag"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={40}
                          paddingAngle={3}
                          label={({ tag, percent }) => `${tag} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {stats.topTags.map((_, i) => (
                            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [`${value} uses`, name]}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem",
                            fontSize: "0.8rem"
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* ── Top Tags List ── */}
              {stats.topTags?.length > 0 && (
                <div style={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "1rem",
                  padding: "1.5rem",
                }}>
                  <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "hsl(var(--foreground))" }}>
                    🏷️ Tag Breakdown
                  </h2>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                    {stats.topTags.map((t, i) => {
                      const pct = Math.round((t.count / (stats.topTags[0]?.count || 1)) * 100);
                      return (
                        <div key={t.tag} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span style={{
                            fontSize: "0.8rem", fontWeight: 600,
                            color: PALETTE[i % PALETTE.length],
                            minWidth: "120px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>#{t.tag}</span>
                          <div style={{
                            flex: 1, height: "8px", borderRadius: "8px",
                            background: "hsl(var(--muted))",
                            overflow: "hidden"
                          }}>
                            <div style={{
                              width: `${pct}%`, height: "100%",
                              background: PALETTE[i % PALETTE.length],
                              borderRadius: "8px",
                              transition: "width 0.6s ease"
                            }} />
                          </div>
                          <span style={{
                            fontSize: "0.75rem",
                            color: "hsl(var(--muted-foreground))",
                            minWidth: "48px",
                            textAlign: "right"
                          }}>{t.count}x</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyStats;
