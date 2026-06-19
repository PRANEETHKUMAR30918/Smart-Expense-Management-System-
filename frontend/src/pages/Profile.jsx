import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, login, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (!profileForm.name.trim()) { toast.error('Name is required'); return }
    setProfileLoading(true)
    try {
      const res = await api.put('/api/users/profile', {
        name: profileForm.name,
        email: profileForm.email,
      })
      const updated = res.data
      // Update stored user data
      const currentToken = localStorage.getItem('token')
      login({
        token: currentToken,
        name: updated.name || profileForm.name,
        email: updated.email || profileForm.email,
        role: user?.role,
        userId: user?.userId,
      })
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setPasswordLoading(true)
    try {
      await api.put('/api/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  const tabStyle = (tab) => ({
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    border: 'none',
    background: activeTab === tab ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
    color: activeTab === tab ? 'var(--accent-purple)' : 'var(--text-secondary)',
    fontWeight: 500,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderBottom: activeTab === tab ? '2px solid var(--accent-purple)' : '2px solid transparent',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="glass-card" style={{ padding: 32, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--gradient-main)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', fontWeight: 700, color: 'white',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              {user?.name}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 8 }}>
              {user?.email}
            </p>
            <span className="badge" style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-purple)',
              textTransform: 'capitalize',
            }}>
              🛡️ {user?.role || 'User'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 24,
        borderBottom: '1px solid var(--border)',
        paddingBottom: 0,
      }}>
        <button style={tabStyle('profile')} onClick={() => setActiveTab('profile')}>
          👤 Profile Info
        </button>
        <button style={tabStyle('password')} onClick={() => setActiveTab('password')}>
          🔒 Change Password
        </button>
        <button style={tabStyle('danger')} onClick={() => setActiveTab('danger')}>
          ⚠️ Account
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="glass-card" style={{ padding: 32, maxWidth: 560 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 24, color: 'var(--text-secondary)' }}>
            Personal Information
          </h3>
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="your@email.com"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={profileLoading}>
                {profileLoading ? <span className="spinner" /> : '💾'}
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setProfileForm({ name: user?.name || '', email: user?.email || '' })}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="glass-card" style={{ padding: 32, maxWidth: 560 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 24, color: 'var(--text-secondary)' }}>
            Change Password
          </h3>
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                className="form-input"
                type="password"
                value={passwordForm.currentPassword}
                onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type="password"
                value={passwordForm.newPassword}
                onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                className="form-input"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Re-enter new password"
                required
              />
            </div>

            {passwordForm.newPassword && passwordForm.confirmPassword && (
              <div className={`alert ${passwordForm.newPassword === passwordForm.confirmPassword ? 'success' : 'danger'}`}>
                {passwordForm.newPassword === passwordForm.confirmPassword
                  ? '✅ Passwords match'
                  : '❌ Passwords do not match'}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }} disabled={passwordLoading}>
              {passwordLoading ? <span className="spinner" /> : '🔒'}
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Danger Tab */}
      {activeTab === 'danger' && (
        <div className="glass-card" style={{ padding: 32, maxWidth: 560 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
            Account Actions
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 24 }}>
            Manage your account session and data
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Account info */}
            <div style={{
              padding: 16, borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>Account Details</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)' }}>Role</span>
                <span style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>{user?.role || 'User'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>User ID</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {user?.userId || '—'}
                </span>
              </div>
            </div>

            {/* Sign out */}
            <div style={{
              padding: 20, borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Sign Out</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Sign out of your ExpenseIQ account on this device
              </div>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm('Are you sure you want to sign out?')) {
                    logout()
                    window.location.href = '/login'
                  }
                }}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
