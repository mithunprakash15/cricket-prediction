import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Shield, Users, Eye, EyeOff, ChevronDown, Loader2 } from 'lucide-react'

const ADMIN_PASSWORD = 'password123'

export default function LoginPage({ onAdminLogin, onUserLogin }) {
  const [mode, setMode] = useState(null) // null | 'admin' | 'user'
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [passError, setPassError] = useState('')
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userError, setUserError] = useState('')

  const handleAdminClick = () => {
    setMode('admin')
    setPassError('')
    setPassword('')
  }

  const handleUserClick = async () => {
    setMode('user')
    setLoadingUsers(true)
    setUserError('')
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email')
      .order('name')
    setLoadingUsers(false)
    if (error) { setUserError('Failed to load users.'); return }
    setUsers(data || [])
  }

  const handleAdminSubmit = (e) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      onAdminLogin()
    } else {
      setPassError('Incorrect password. Try again.')
      setPassword('')
    }
  }

  const handleUserSubmit = (e) => {
    e.preventDefault()
    const user = users.find(u => u.id === selectedUserId)
    if (user) onUserLogin(user)
    else setUserError('Please select a user.')
  }

  const handleBack = () => {
    setMode(null)
    setPassword('')
    setPassError('')
    setSelectedUserId('')
    setUserError('')
  }

  return (
    <div style={styles.root}>
      {/* Background orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />

      <div style={styles.container} className="animate-in">
        {/* Logo / Header */}
        <div style={styles.header}>
          <div style={styles.logoMark}>🏏</div>
          <h1 style={styles.title}>MATCH PREDICTOR</h1>
          <p style={styles.subtitle}>Who's winning tonight? Make your call.</p>
        </div>

        {/* Mode: Choose */}
        {!mode && (
          <div style={styles.choiceGrid} className="animate-in">
            <button style={styles.roleCard} onClick={handleAdminClick}>
              <span style={styles.roleIcon}><Shield size={28} color="var(--gold)" /></span>
              <span style={styles.roleLabel}>Admin</span>
              <span style={styles.roleDesc}>Manage matches & teams</span>
            </button>
            <button style={{ ...styles.roleCard, ...styles.roleCardAlt }} onClick={handleUserClick}>
              <span style={styles.roleIcon}><Users size={28} color="#60a5fa" /></span>
              <span style={styles.roleLabel}>Player</span>
              <span style={styles.roleDesc}>Pick your winner</span>
            </button>
          </div>
        )}

        {/* Mode: Admin Password */}
        {mode === 'admin' && (
          <form style={styles.form} onSubmit={handleAdminSubmit} className="animate-in">
            <div style={styles.formHeader}>
              <Shield size={20} color="var(--gold)" />
              <span style={styles.formTitle}>Admin Access</span>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrap}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPassError('') }}
                  placeholder="Enter admin password"
                  autoFocus
                  style={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={styles.eyeBtn}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passError && <p style={styles.errorMsg}>{passError}</p>}
            </div>
            <div style={styles.btnRow}>
              <button type="button" style={styles.btnSecondary} onClick={handleBack}>Back</button>
              <button type="submit" style={styles.btnPrimary}>Enter</button>
            </div>
          </form>
        )}

        {/* Mode: User Select */}
        {mode === 'user' && (
          <form style={styles.form} onSubmit={handleUserSubmit} className="animate-in">
            <div style={styles.formHeader}>
              <Users size={20} color="#60a5fa" />
              <span style={{ ...styles.formTitle, color: '#60a5fa' }}>Select Your Profile</span>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Who are you?</label>
              {loadingUsers ? (
                <div style={styles.loadingRow}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} color="var(--gold)" />
                  <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading players...</span>
                </div>
              ) : (
                <div style={styles.selectWrap}>
                  <select
                    value={selectedUserId}
                    onChange={e => { setSelectedUserId(e.target.value); setUserError('') }}
                    style={styles.select}
                  >
                    <option value="">— Choose your name —</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}{u.email ? ` (${u.email})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} color="var(--text-secondary)" style={styles.selectArrow} />
                </div>
              )}
              {userError && <p style={styles.errorMsg}>{userError}</p>}
            </div>
            <div style={styles.btnRow}>
              <button type="button" style={styles.btnSecondary} onClick={handleBack}>Back</button>
              <button
                type="submit"
                style={{ ...styles.btnPrimary, background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                disabled={!selectedUserId}
              >
                Continue
              </button>
            </div>
          </form>
        )}

        <p style={styles.footer}>Match Predictor &copy; {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}

const styles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '24px',
    overflow: 'hidden',
  },
  orb1: {
    position: 'fixed',
    top: '-10%',
    left: '-5%',
    width: 500,
    height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(240,165,0,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  orb2: {
    position: 'fixed',
    bottom: '-10%',
    right: '-5%',
    width: 600,
    height: 600,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  container: {
    width: '100%',
    maxWidth: 440,
    position: 'relative',
    zIndex: 1,
  },
  header: {
    textAlign: 'center',
    marginBottom: 40,
  },
  logoMark: {
    fontSize: 56,
    lineHeight: 1,
    marginBottom: 16,
    display: 'block',
    filter: 'drop-shadow(0 0 20px rgba(240,165,0,0.4))',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 42,
    letterSpacing: 4,
    color: 'var(--text-primary)',
    lineHeight: 1,
    marginBottom: 10,
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: 15,
    fontWeight: 400,
    letterSpacing: 0.3,
  },
  choiceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: 32,
  },
  roleCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '28px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    outline: 'none',
    ':hover': { borderColor: 'var(--gold)' },
  },
  roleCardAlt: {
    // Blue variant handled inline
  },
  roleIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'var(--bg-elevated)',
    marginBottom: 4,
  },
  roleLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: 22,
    letterSpacing: 2,
    color: 'var(--text-primary)',
  },
  roleDesc: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    fontWeight: 400,
  },
  form: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-xl)',
    padding: '32px 28px',
    marginBottom: 24,
    boxShadow: 'var(--shadow-card)',
  },
  formHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: '1px solid var(--border)',
  },
  formTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: 20,
    letterSpacing: 2,
    color: 'var(--gold)',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrap: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '12px 44px 12px 14px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 15,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  },
  selectWrap: {
    position: 'relative',
  },
  select: {
    width: '100%',
    padding: '12px 40px 12px 14px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 15,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
  },
  selectArrow: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  },
  errorMsg: {
    color: 'var(--red)',
    fontSize: 13,
    marginTop: 8,
    fontWeight: 500,
  },
  loadingRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 0',
  },
  btnRow: {
    display: 'flex',
    gap: 12,
    justifyContent: 'flex-end',
  },
  btnPrimary: {
    padding: '11px 28px',
    background: 'linear-gradient(135deg, var(--gold), #e09400)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    color: '#0a0d14',
    fontFamily: 'var(--font-display)',
    fontSize: 16,
    letterSpacing: 1.5,
    cursor: 'pointer',
    fontWeight: 700,
    transition: 'opacity 0.2s',
  },
  btnSecondary: {
    padding: '11px 20px',
    background: 'transparent',
    border: '1px solid var(--border-light)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'border-color 0.2s',
  },
  footer: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: 12,
  },
}
