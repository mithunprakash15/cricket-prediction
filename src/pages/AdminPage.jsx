import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  Plus, LogOut, Shield, Calendar, Clock, Users,
  Loader2, X, CheckCircle2, AlertCircle, Trophy,
  ChevronDown, Swords
} from 'lucide-react'

const MATCH_TIMES = ['15:30', '19:30']

export default function AdminPage({ onLogout }) {
  const [matches, setMatches] = useState([])
  const [teams, setTeams] = useState([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const fetchData = useCallback(async () => {
    setLoadingMatches(true)
    const [matchRes, teamRes] = await Promise.all([
      supabase
        .from('matches')
        .select(`
          id, match_name, match_date, match_time, created_at,
          team1:teams!matches_team1_id_fkey(id, team_name),
          team2:teams!matches_team2_id_fkey(id, team_name)
        `)
        .order('created_at', { ascending: false }),
      supabase.from('teams').select('id, team_name').order('team_name'),
    ])
    if (matchRes.data) setMatches(matchRes.data)
    if (teamRes.data) setTeams(teamRes.data)
    setLoadingMatches(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div style={styles.root}>
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.navBrand}>
            <span style={{ fontSize: 22 }}>🏏</span>
            <span style={styles.navTitle}>MATCH PREDICTOR</span>
            <span style={styles.adminBadge}>
              <Shield size={11} />
              ADMIN
            </span>
          </div>
          <div style={styles.navRight}>
            <button style={styles.addBtn} onClick={() => setShowModal(true)}>
              <Plus size={16} />
              New Match
            </button>
            <button style={styles.logoutBtn} onClick={onLogout}>
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main style={styles.main} className="animate-in">
        {/* Stats Row */}
        <div style={styles.statsRow}>
          <StatCard icon={<Trophy size={18} color="var(--gold)" />} label="Total Matches" value={matches.length} />
          <StatCard icon={<Users size={18} color="#60a5fa" />} label="Teams" value={teams.length} />
          <StatCard
            icon={<Calendar size={18} color="#22c55e" />}
            label="Upcoming"
            value={matches.filter(m => !isMatchPast(m)).length}
          />
        </div>

        {/* Matches Table */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <Swords size={18} color="var(--gold)" />
            <h2 style={styles.sectionTitle}>All Matches</h2>
          </div>

          {loadingMatches ? (
            <div style={styles.loadingBox}>
              <Loader2 size={28} color="var(--gold)" style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Loading matches...</span>
            </div>
          ) : matches.length === 0 ? (
            <EmptyState onAdd={() => setShowModal(true)} />
          ) : (
            <div style={styles.matchList}>
              {matches.map((m, i) => (
                <AdminMatchCard key={m.id} match={m} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <CreateMatchModal
          teams={teams}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchData() }}
        />
      )}
    </div>
  )
}

/* ─── Create Match Modal ──────────────────────────────────── */
function CreateMatchModal({ teams, onClose, onCreated }) {
  const [form, setForm] = useState({
    match_name: '',
    match_date: '',
    match_time: '19:30',
    team1_id: '',
    team2_id: '',
  })
  console.log("form", form)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.match_name.trim()) return setError('Match name is required.')
    if (!form.match_date) return setError('Match date is required.')
    if (!form.team1_id || !form.team2_id) return setError('Both teams are required.')
    if (form.team1_id === form.team2_id) return setError('Team 1 and Team 2 must be different.')

    // Build match datetime in IST (stored as UTC in Supabase)
    // match_time stored as text (HH:MM), match_date as date
    const [hh, mm] = form.match_time.split(':')
    const istDateStr = `${form.match_date}T${hh}:${mm}:00+05:30`
    const matchDatetime = new Date(istDateStr).toISOString()
    const matchDatetimeDetail = new Date(
  `${form.match_date}T${form.match_time}:00`
).toISOString();


    setSaving(true)
    

    const payload = {
      match_name: form.match_name.trim(),
      match_date: matchDatetime,
      match_time: matchDatetimeDetail,
      team1_id: form.team1_id,
      team2_id: form.team2_id,
    }

    console.log("payload", payload)

    const { error: err } = await supabase.from('matches').insert(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
    setTimeout(onCreated, 900)
  }

  return (
    <div style={styles.backdrop} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal} className="slide-in">
        {/* Header */}
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Plus size={20} color="var(--gold)" />
            <span style={styles.modalTitle}>Create Match</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {success ? (
          <div style={styles.successBox}>
            <CheckCircle2 size={40} color="var(--green)" />
            <p style={{ color: 'var(--green)', fontWeight: 600, fontSize: 16 }}>Match created!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={styles.modalForm}>
            <Field label="Match Name">
              <input
                style={styles.input}
                value={form.match_name}
                onChange={e => set('match_name', e.target.value)}
                placeholder="e.g. CSK vs MI — Match 12"
              />
            </Field>

            <div style={styles.row2}>
              <Field label="Match Date">
                <input
                  type="date"
                  style={styles.input}
                  value={form.match_date}
                  onChange={e => set('match_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </Field>
              <Field label="Match Time (IST)">
                <div style={styles.selectWrap}>
                  <select
                    style={styles.select}
                    value={form.match_time}
                    onChange={e => set('match_time', e.target.value)}
                  >
                    {MATCH_TIMES.map(t => (
                      <option key={t} value={t}>{t} IST</option>
                    ))}
                  </select>
                  <ChevronDown size={14} color="var(--text-secondary)" style={styles.selectArrow} />
                </div>
              </Field>
            </div>

            <div style={styles.row2}>
              <Field label="Team 1">
                <div style={styles.selectWrap}>
                  <select
                    style={styles.select}
                    value={form.team1_id}
                    onChange={e => set('team1_id', e.target.value)}
                  >
                    <option value="">Select team</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.team_name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} color="var(--text-secondary)" style={styles.selectArrow} />
                </div>
              </Field>
              <Field label="Team 2">
                <div style={styles.selectWrap}>
                  <select
                    style={styles.select}
                    value={form.team2_id}
                    onChange={e => set('team2_id', e.target.value)}
                  >
                    <option value="">Select team</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.team_name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} color="var(--text-secondary)" style={styles.selectArrow} />
                </div>
              </Field>
            </div>

            {error && (
              <div style={styles.errorBox}>
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <div style={styles.modalFooter}>
              <button type="button" style={styles.btnSecondary} onClick={onClose}>Cancel</button>
              <button type="submit" style={styles.btnPrimary} disabled={saving}>
                {saving
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                  : <><Plus size={14} /> Create Match</>
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

/* ─── Sub-components ─────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 0 }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statIcon}>{icon}</div>
      <div>
        <p style={styles.statValue}>{value}</p>
        <p style={styles.statLabel}>{label}</p>
      </div>
    </div>
  )
}

function AdminMatchCard({ match, index }) {
  const past = isMatchPast(match)
  const dateStr = formatMatchDate(match.match_date)

  return (
    <div
      style={{
        ...styles.matchCard,
        animationDelay: `${index * 60}ms`,
        borderLeft: `3px solid ${past ? 'var(--border)' : 'var(--gold)'}`,
      }}
      className="animate-in"
    >
      <div style={styles.matchCardLeft}>
        <div style={styles.matchName}>{match.match_name}</div>
        <div style={styles.matchTeams}>
          <span style={styles.teamChip}>{match.team1?.team_name ?? '—'}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>VS</span>
          <span style={styles.teamChip}>{match.team2?.team_name ?? '—'}</span>
        </div>
      </div>
      <div style={styles.matchCardRight}>
        <div style={styles.matchMeta}>
          <Calendar size={13} color="var(--text-muted)" />
          <span>{dateStr}</span>
        </div>
        <div style={styles.matchMeta}>
          <Clock size={13} color="var(--text-muted)" />
          <span>{match.match_time ?? '—'} IST</span>
        </div>
        <span style={{ ...styles.statusBadge, ...(past ? styles.statusPast : styles.statusLive) }}>
          {past ? 'Closed' : 'Open'}
        </span>
      </div>
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div style={styles.empty}>
      <span style={{ fontSize: 48, marginBottom: 12 }}>🏟️</span>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>No matches yet. Create the first one!</p>
      <button style={styles.btnPrimary} onClick={onAdd}>
        <Plus size={15} /> Create Match
      </button>
    </div>
  )
}

/* ─── Helpers ───────────────────────────────────────────── */
function isMatchPast(match) {
  if (!match.match_date) return false
  return new Date(match.match_date) < new Date()
}

function formatMatchDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
  })
}

/* ─── Styles ─────────────────────────────────────────────── */
const styles = {
  root: {
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
  },
  orb1: {
    position: 'fixed', top: '-15%', right: '-10%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,165,0,0.07) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'fixed', bottom: '-15%', left: '-10%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  nav: {
    background: 'rgba(17,21,32,0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  navInner: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '0 24px',
    height: 62,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  navTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 20,
    letterSpacing: 3,
    color: 'var(--text-primary)',
  },
  adminBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'var(--gold-dim)',
    border: '1px solid rgba(240,165,0,0.3)',
    color: 'var(--gold)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
    padding: '3px 8px',
    borderRadius: 20,
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 18px',
    background: 'linear-gradient(135deg, var(--gold), #e09400)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: '#0a0d14',
    fontFamily: 'var(--font-display)',
    fontSize: 14,
    letterSpacing: 1,
    fontWeight: 700,
    cursor: 'pointer',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    background: 'transparent',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  main: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '32px 24px',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    boxShadow: 'var(--shadow-card)',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-elevated)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'var(--font-display)',
    fontSize: 32,
    color: 'var(--text-primary)',
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontWeight: 500,
    letterSpacing: 0.5,
  },
  section: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '24px',
    boxShadow: 'var(--shadow-card)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px solid var(--border)',
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    letterSpacing: 2,
    color: 'var(--text-primary)',
  },
  matchList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  matchCard: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    transition: 'border-color 0.2s',
  },
  matchCardLeft: { flex: 1 },
  matchCardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexShrink: 0,
  },
  matchName: {
    fontWeight: 600,
    fontSize: 15,
    color: 'var(--text-primary)',
    marginBottom: 8,
  },
  matchTeams: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  teamChip: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 20,
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  matchMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    color: 'var(--text-secondary)',
    fontSize: 13,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.8,
    padding: '4px 10px',
    borderRadius: 20,
    textTransform: 'uppercase',
  },
  statusLive: {
    background: 'var(--green-dim)',
    color: 'var(--green)',
    border: '1px solid rgba(34,197,94,0.3)',
  },
  statusPast: {
    background: 'rgba(100,116,139,0.1)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    padding: '60px 0',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '60px 0',
  },
  // Modal
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modal: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-xl)',
    width: '100%',
    maxWidth: 560,
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    borderBottom: '1px solid var(--border)',
  },
  modalTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    letterSpacing: 2,
    color: 'var(--gold)',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 6,
    borderRadius: 6,
    display: 'flex',
  },
  modalForm: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 8,
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
  },
  label: {
    display: 'block',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    colorScheme: 'dark',
  },
  selectWrap: {
    position: 'relative',
  },
  select: {
    width: '100%',
    padding: '11px 36px 11px 14px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
    colorScheme: 'dark',
  },
  selectArrow: {
    position: 'absolute',
    right: 11,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'var(--red-dim)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    color: 'var(--red)',
    fontSize: 13,
    fontWeight: 500,
  },
  successBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    padding: '48px 24px',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 22px',
    background: 'linear-gradient(135deg, var(--gold), #e09400)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: '#0a0d14',
    fontFamily: 'var(--font-display)',
    fontSize: 15,
    letterSpacing: 1,
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnSecondary: {
    padding: '10px 18px',
    background: 'transparent',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
}
