import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  LogOut, Calendar, Clock, CheckCircle2, Edit3,
  Loader2, AlertCircle, Trophy, ChevronDown,
  Lock, Swords, User
} from 'lucide-react'

/* ─── IST helpers ─────────────────────────────────────────── */
function nowIST() {
  // returns current time as Date (UTC internally)
  return new Date()
}

function isMatchOpen(match) {
  if (!match.match_date) return false
  const matchDt = new Date(match.match_date)
  return matchDt > nowIST()
}

function formatMatchDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
  })
}

function formatMatchTime(dateStr, matchTime) {
  if (matchTime) return `${matchTime} IST`
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
  }) + ' IST'
}

function timeUntil(dateStr) {
  const diff = new Date(dateStr) - nowIST()
  if (diff <= 0) return null
  const hrs = Math.floor(diff / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  if (hrs >= 24) return `${Math.floor(hrs / 24)}d ${hrs % 24}h`
  if (hrs > 0) return `${hrs}h ${mins}m`
  return `${mins}m`
}

/* ─── UserPage ──────────────────────────────────────────── */
export default function UserPage({ user, onLogout }) {
  const [matches, setMatches] = useState([])
  const [entries, setEntries] = useState({}) // matchId -> entry
  const [loading, setLoading] = useState(true)
  const [editingMatchId, setEditingMatchId] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [matchRes, entryRes] = await Promise.all([
      supabase
        .from('matches')
        .select(`
          id, match_name, match_date, match_time, created_at,
          team1:teams!matches_team1_id_fkey(id, team_name),
          team2:teams!matches_team2_id_fkey(id, team_name)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('match_entries')
        .select('id, match_id, selected_team_id, logged_time, selected_team:teams(id, team_name)')
        .eq('user_id', user.id),
    ])

    if (matchRes.data) setMatches(matchRes.data)
    if (entryRes.data) {
      const map = {}
      entryRes.data.forEach(e => { map[e.match_id] = e })
      setEntries(map)
    }
    setLoading(false)
  }, [user.id])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleEntrySuccess = (matchId, entry) => {
    setEntries(prev => ({ ...prev, [matchId]: entry }))
    setEditingMatchId(null)
  }

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
          </div>
          <div style={styles.navRight}>
            <div style={styles.userChip}>
              <User size={13} />
              <span>{user.name}</span>
            </div>
            <button style={styles.logoutBtn} onClick={onLogout}>
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main style={styles.main} className="animate-in">
        {/* Hero greeting */}
        <div style={styles.heroRow}>
          <div>
            <h1 style={styles.heroTitle}>Hey, {user.name.split(' ')[0]} 👋</h1>
            <p style={styles.heroSub}>Pick your winners before the match begins.</p>
          </div>
          <div style={styles.heroStats}>
            <div style={styles.miniStat}>
              <span style={styles.miniStatVal}>{Object.keys(entries).length}</span>
              <span style={styles.miniStatLabel}>Picks Made</span>
            </div>
            <div style={styles.miniStatDiv} />
            <div style={styles.miniStat}>
              <span style={styles.miniStatVal}>
                {matches.filter(m => isMatchOpen(m) && !entries[m.id]).length}
              </span>
              <span style={styles.miniStatLabel}>Pending</span>
            </div>
          </div>
        </div>

        {/* Match List */}
        <div style={styles.sectionHeader}>
          <Swords size={18} color="var(--gold)" />
          <h2 style={styles.sectionTitle}>Matches</h2>
        </div>

        {loading ? (
          <div style={styles.loadingBox}>
            <Loader2 size={28} color="var(--gold)" style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Loading matches...</span>
          </div>
        ) : matches.length === 0 ? (
          <div style={styles.empty}>
            <span style={{ fontSize: 48, marginBottom: 12 }}>🏟️</span>
            <p style={{ color: 'var(--text-secondary)' }}>No matches scheduled yet.</p>
          </div>
        ) : (
          <div style={styles.matchList}>
            {matches.map((m, i) => {
              const open = isMatchOpen(m)
              const entry = entries[m.id] || null
              const isEditing = editingMatchId === m.id

              return (
                <UserMatchCard
                  key={m.id}
                  match={m}
                  open={open}
                  entry={entry}
                  isEditing={isEditing}
                  index={i}
                  userId={user.id}
                  onEdit={() => setEditingMatchId(m.id)}
                  onCancelEdit={() => setEditingMatchId(null)}
                  onSuccess={(entry) => handleEntrySuccess(m.id, entry)}
                />
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

/* ─── UserMatchCard ──────────────────────────────────────── */
function UserMatchCard({ match, open, entry, isEditing, index, userId, onEdit, onCancelEdit, onSuccess }) {
  const until = open ? timeUntil(match.match_date) : null


  return (
    <div
      style={{
        ...styles.card,
        animationDelay: `${index * 70}ms`,
        borderLeft: `3px solid ${open ? 'var(--gold)' : 'var(--border)'}`,
      }}
      className="animate-in"
    >
      {/* Card Top */}
      <div style={styles.cardTop}>
        <div style={styles.cardLeft}>
          <div style={styles.matchName}>{match.match_name}</div>
          <div style={styles.teamRow}>
            <TeamPill
              name={match.team1?.team_name}
              selected={entry?.selected_team_id === match.team1?.id}
            />
            <span style={styles.vsText}>VS</span>
            <TeamPill
              name={match.team2?.team_name}
              selected={entry?.selected_team_id === match.team2?.id}
            />
          </div>
        </div>
        <div style={styles.cardMeta}>
          <div style={styles.metaRow}>
            <Calendar size={13} color="var(--text-muted)" />
            <span>{formatMatchDate(match.match_date)}</span>
          </div>
          <div style={styles.metaRow}>
            <Clock size={13} color="var(--text-muted)" />
            <span>{formatMatchTime(match.match_date, match.match_time)}</span>
          </div>
          {open && until && (
            <div style={styles.timerBadge}>
              <Clock size={11} />
              <span>Closes in {until}</span>
            </div>
          )}
          {!open && (
            <div style={styles.closedBadge}>
              <Lock size={11} />
              <span>Closed</span>
            </div>
          )}
        </div>
      </div>

      {/* Entry Section */}
      <div style={styles.entrySection}>
        {isEditing ? (
          <EntryForm
            match={match}
            existingEntry={entry}
            userId={userId}
            onSuccess={onSuccess}
            onCancel={onCancelEdit}
          />
        ) : entry ? (
          <div style={styles.entryDisplay}>
            <div style={styles.entryPick}>
              <CheckCircle2 size={16} color="var(--green)" />
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Your pick:</span>
              <span style={styles.pickedTeam}>{entry.selected_team?.team_name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                · {new Date(entry.logged_time).toLocaleString('en-IN', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  timeZone: 'Asia/Kolkata',
                })}
              </span>
            </div>
            {open && (
              <button style={styles.editBtn} onClick={onEdit}>
                <Edit3 size={13} />
                Change pick
              </button>
            )}
          </div>
        ) : open ? (
          <button style={styles.pickBtn} onClick={onEdit}>
            <Trophy size={14} />
            Make your pick
          </button>
        ) : (
          <div style={styles.noEntryBox}>
            <Lock size={13} color="var(--text-muted)" />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No pick submitted — match is closed.</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── TeamPill ───────────────────────────────────────────── */
function TeamPill({ name, selected }) {
  return (
    <span style={{
      ...styles.teamPill,
      ...(selected ? styles.teamPillSelected : {}),
    }}>
      {selected && '✓ '}
      {name ?? '—'}
    </span>
  )
}

/* ─── Entry Form (Add / Edit) ─────────────────────────────── */
function EntryForm({ match, existingEntry, userId, onSuccess, onCancel }) {
  const [selectedTeamId, setSelectedTeamId] = useState(existingEntry?.selected_team_id ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!existingEntry

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTeamId) { setError('Please select a team.'); return }
    setError('')
    setSaving(true)

    let data, err

    if (isEdit) {
      // UPDATE
      const res = await supabase
        .from('match_entries')
        .update({ selected_team_id: selectedTeamId, logged_time: new Date().toISOString() })
        .eq('id', existingEntry.id)
        .select('id, match_id, selected_team_id, logged_time, selected_team:teams(id, team_name)')
        .single()
      data = res.data
      err = res.error
    } else {
      // INSERT
      const res = await supabase
        .from('match_entries')
        .insert({ match_id: match.id, user_id: userId, selected_team_id: selectedTeamId })
        .select('id, match_id, selected_team_id, logged_time, selected_team:teams(id, team_name)')
        .single()
      data = res.data
      err = res.error
    }

    setSaving(false)
    if (err) { setError(err.message); return }
    onSuccess(data)
  }

  const teams = [match.team1, match.team2].filter(Boolean)

  return (
    <form onSubmit={handleSubmit} style={styles.entryForm}>
      <div style={styles.teamChoices}>
        {teams.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setSelectedTeamId(t.id); setError('') }}
            style={{
              ...styles.teamChoice,
              ...(selectedTeamId === t.id ? styles.teamChoiceSelected : {}),
            }}
          >
            <div style={styles.teamChoiceName}>{t.team_name}</div>
            {selectedTeamId === t.id && <CheckCircle2 size={14} color="var(--green)" />}
          </button>
        ))}
      </div>
      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={13} />
          <span>{error}</span>
        </div>
      )}
      <div style={styles.formBtns}>
        <button type="button" style={styles.cancelBtn} onClick={onCancel}>Cancel</button>
        <button type="submit" style={styles.submitBtn} disabled={saving || !selectedTeamId}>
          {saving
            ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
            : isEdit
            ? <><Edit3 size={13} /> Update Pick</>
            : <><Trophy size={13} /> Confirm Pick</>
          }
        </button>
      </div>
    </form>
  )
}

/* ─── Styles ─────────────────────────────────────────────── */
const styles = {
  root: { minHeight: '100vh', position: 'relative', overflow: 'hidden' },
  orb1: {
    position: 'fixed', top: '-10%', right: '-5%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,165,0,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'fixed', bottom: '-10%', left: '-5%',
    width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  nav: {
    background: 'rgba(17,21,32,0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  navInner: {
    maxWidth: 900, margin: '0 auto', padding: '0 24px',
    height: 62, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  navBrand: { display: 'flex', alignItems: 'center', gap: 10 },
  navTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 20, letterSpacing: 3, color: 'var(--text-primary)',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: 10 },
  userChip: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 20, padding: '6px 12px',
    fontSize: 13, fontWeight: 500, color: 'var(--text-primary)',
  },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', background: 'transparent',
    border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  main: { maxWidth: 900, margin: '0 auto', padding: '32px 24px' },
  heroRow: {
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    marginBottom: 36, gap: 16,
  },
  heroTitle: {
    fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 2,
    color: 'var(--text-primary)', lineHeight: 1, marginBottom: 8,
  },
  heroSub: { color: 'var(--text-secondary)', fontSize: 15 },
  heroStats: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: '16px 24px',
    display: 'flex', alignItems: 'center', gap: 20,
    boxShadow: 'var(--shadow-card)',
  },
  miniStat: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  miniStatVal: {
    fontFamily: 'var(--font-display)', fontSize: 28,
    color: 'var(--gold)', lineHeight: 1,
  },
  miniStatLabel: { fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: 0.5 },
  miniStatDiv: { width: 1, height: 36, background: 'var(--border)' },
  sectionHeader: {
    display: 'flex', alignItems: 'center', gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 2, color: 'var(--text-primary)',
  },
  matchList: { display: 'flex', flexDirection: 'column', gap: 16 },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    boxShadow: 'var(--shadow-card)',
  },
  cardTop: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '20px 24px', gap: 16,
  },
  cardLeft: { flex: 1 },
  cardMeta: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  matchName: {
    fontWeight: 700, fontSize: 16, color: 'var(--text-primary)',
    marginBottom: 10,
  },
  teamRow: { display: 'flex', alignItems: 'center', gap: 10 },
  vsText: {
    color: 'var(--text-muted)', fontSize: 10, fontWeight: 800, letterSpacing: 1,
  },
  teamPill: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 20, padding: '5px 14px',
    fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)',
    transition: 'all 0.2s',
  },
  teamPillSelected: {
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.4)',
    color: 'var(--green)',
  },
  metaRow: { display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 13 },
  timerBadge: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(240,165,0,0.1)', border: '1px solid rgba(240,165,0,0.25)',
    borderRadius: 20, padding: '3px 10px',
    color: 'var(--gold)', fontSize: 11, fontWeight: 600,
  },
  closedBadge: {
    display: 'flex', alignItems: 'center', gap: 5,
    background: 'rgba(100,116,139,0.1)', border: '1px solid var(--border)',
    borderRadius: 20, padding: '3px 10px',
    color: 'var(--text-muted)', fontSize: 11, fontWeight: 600,
  },
  entrySection: {
    borderTop: '1px solid var(--border)',
    padding: '16px 24px',
    background: 'rgba(255,255,255,0.01)',
  },
  entryDisplay: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  entryPick: { display: 'flex', alignItems: 'center', gap: 8 },
  pickedTeam: {
    fontWeight: 700, fontSize: 14, color: 'var(--green)',
    background: 'var(--green-dim)', border: '1px solid rgba(34,197,94,0.3)',
    borderRadius: 20, padding: '2px 10px',
  },
  editBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 14px', background: 'transparent',
    border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  pickBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 20px',
    background: 'linear-gradient(135deg, var(--gold), #e09400)',
    border: 'none', borderRadius: 'var(--radius-md)',
    color: '#0a0d14', fontFamily: 'var(--font-display)',
    fontSize: 14, letterSpacing: 1, cursor: 'pointer', fontWeight: 700,
  },
  noEntryBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    color: 'var(--text-muted)', fontSize: 13,
  },
  // Entry form
  entryForm: { display: 'flex', flexDirection: 'column', gap: 14 },
  teamChoices: { display: 'flex', gap: 12 },
  teamChoice: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px', background: 'var(--bg-elevated)',
    border: '2px solid var(--border)', borderRadius: 'var(--radius-md)',
    cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: 'var(--font-body)',
  },
  teamChoiceSelected: {
    borderColor: 'var(--green)',
    background: 'rgba(34,197,94,0.08)',
  },
  teamChoiceName: {
    fontWeight: 700, fontSize: 15, color: 'var(--text-primary)',
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 7,
    background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 'var(--radius-md)', padding: '8px 12px',
    color: 'var(--red)', fontSize: 12, fontWeight: 500,
  },
  formBtns: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '9px 16px', background: 'transparent',
    border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 20px',
    background: 'linear-gradient(135deg, var(--gold), #e09400)',
    border: 'none', borderRadius: 'var(--radius-md)',
    color: '#0a0d14', fontFamily: 'var(--font-display)',
    fontSize: 14, letterSpacing: 1, cursor: 'pointer', fontWeight: 700,
  },
  loadingBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 14, padding: '60px 0',
  },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0',
  },
}
