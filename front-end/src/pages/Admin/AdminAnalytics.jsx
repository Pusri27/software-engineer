import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ADMIN_ENDPOINTS } from '@/config/api';
import { Users, FileText, BarChart2, TrendingUp } from 'lucide-react';

const PALETTE = [
  'hsl(250,60%,55%)', 'hsl(270,55%,60%)', 'hsl(230,60%,60%)',
  'hsl(290,50%,58%)', 'hsl(210,60%,58%)', 'hsl(310,50%,58%)',
];

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div style={{
    background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
    borderRadius: '0.875rem', padding: '1.25rem',
    display: 'flex', alignItems: 'center', gap: '1rem', flex: 1,
  }}>
    <div style={{
      width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem',
      background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <Icon size={18} color={color} />
    </div>
    <div>
      <p style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-foreground))', marginBottom: '0.1rem' }}>{label}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--foreground))', lineHeight: 1 }}>{value}</p>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
      borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.8rem',
    }}>
      <p style={{ fontWeight: 600, marginBottom: '0.15rem' }}>{label}</p>
      <p>{payload[0].value} worklog{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
};

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    fetch(ADMIN_ENDPOINTS.ANALYTICS, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(d => { setData(d); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
      Loading analytics...
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', color: 'hsl(0,60%,50%)' }}>⚠️ {error}</div>
  );

  const { totalStats, worklogsPerDivision, topContributors, dailyActivity } = data;

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Summary Cards */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon={Users} label="Total Members" value={totalStats.totalUsers} color="hsl(250,60%,55%)" />
        <StatCard icon={FileText} label="Total Worklogs" value={totalStats.totalWorklogs} color="hsl(270,55%,60%)" />
        <StatCard icon={BarChart2} label="Divisions" value={totalStats.totalDivisions} color="hsl(210,60%,58%)" />
        <StatCard icon={TrendingUp} label="Avg per Member" value={totalStats.avgPerUser} color="hsl(25,90%,55%)" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Worklogs per Division */}
        <div style={{
          background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
          borderRadius: '0.875rem', padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'hsl(var(--foreground))' }}>
            📊 Worklogs per Division
          </h3>
          {worklogsPerDivision.length === 0 ? (
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={worklogsPerDivision} barSize={28}>
                <XAxis
                  dataKey="division"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v.length > 10 ? v.substring(0, 10) + '…' : v}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(250,60%,97%)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {worklogsPerDivision.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily Activity */}
        <div style={{
          background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
          borderRadius: '0.875rem', padding: '1.5rem'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'hsl(var(--foreground))' }}>
            📅 Team Activity — Last 7 Days
          </h3>
          {dailyActivity.every(d => d.count === 0) ? (
            <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>No activity this week</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyActivity} barSize={28}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v.split(',')[0]} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(250,60%,97%)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {dailyActivity.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Contributors Table */}
      <div style={{
        background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))',
        borderRadius: '0.875rem', padding: '1.5rem'
      }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', color: 'hsl(var(--foreground))' }}>
          🏆 Top Contributors (Last 30 Days)
        </h3>
        {topContributors.length === 0 ? (
          <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>No activity in past 30 days</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {topContributors.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <span style={{
                  width: '1.5rem', height: '1.5rem', borderRadius: '50%',
                  background: PALETTE[i % PALETTE.length],
                  color: 'white', fontSize: '0.7rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>{i + 1}</span>
                {c.photo ? (
                  <img src={c.photo} alt={c.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'hsl(250,60%,88%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 700, color: 'hsl(250,60%,35%)', flexShrink: 0 }}>
                    {(c.name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>{c.name || 'Unknown'}</p>
                  <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', margin: 0 }}>{c.division}</p>
                </div>
                <span style={{
                  fontWeight: 700, fontSize: '0.875rem',
                  color: PALETTE[i % PALETTE.length]
                }}>{c.count} <span style={{ fontWeight: 400, fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>worklogs</span></span>
                <div style={{ width: '80px', height: '6px', borderRadius: '6px', background: 'hsl(var(--muted))', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.round((c.count / topContributors[0].count) * 100)}%`,
                    height: '100%', background: PALETTE[i % PALETTE.length], borderRadius: '6px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
