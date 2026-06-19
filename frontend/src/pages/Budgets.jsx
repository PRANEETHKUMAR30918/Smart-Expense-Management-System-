import React, { useEffect, useState } from 'react'
import { budgetService } from '../services/budgetService'
import toast from 'react-hot-toast'

const CATEGORIES = ['Food','Transport','Shopping','Entertainment','Health','Education','Bills','Other']
const categoryEmojis = {
  'Food': '🍔','Transport': '🚗','Shopping': '🛍️','Entertainment': '🎬',
  'Health': '💊','Education': '📚','Bills': '📄','Other': '📦'
}
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Budgets() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [budgets, setBudgets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ category: 'Food', limitAmount: '', month, year })

  const load = async () => {
    setLoading(true)
    try { setBudgets(await budgetService.getAll(month, year)) }
    catch { toast.error('Failed to load budgets') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [month, year])

  const openCreate = () => {
    setEditItem(null)
    setForm({ category: 'Food', limitAmount: '', month, year })
    setShowModal(true)
  }

  const openEdit = (b) => {
    setEditItem(b)
    setForm({ category: b.category, limitAmount: b.limitAmount, month: b.month, year: b.year })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form, limitAmount: parseFloat(form.limitAmount) }
      if (editItem) {
        await budgetService.update(editItem.id, payload)
        toast.success('Budget updated!')
      } else {
        await budgetService.create(payload)
        toast.success('Budget created!')
      }
      setShowModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget?')) return
    try {
      await budgetService.delete(id)
      toast.success('Budget deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  const getStatus = (pct) => pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'safe'
  const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Budget Manager</h1>
          <p className="page-subtitle">Set and track monthly spending limits</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select className="form-input" style={{ width: 'auto' }} value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select className="form-input" style={{ width: 'auto' }} value={year} onChange={e => setYear(+e.target.value)}>
            {[2023,2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openCreate}>+ Set Budget</button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16, flex: '1 1 300px' }} />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">🎯</div>
            <h3>No budgets set for {MONTHS[month - 1]} {year}</h3>
            <p>Create a budget to track your spending limits</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {budgets.map(b => {
            const pct = Math.min(b.percentage || 0, 100)
            const status = getStatus(b.percentage || 0)
            return (
              <div key={b.id} className="glass-card budget-card">
                <div className="budget-header">
                  <div className="budget-category">
                    <span style={{ fontSize: '1.3rem' }}>{categoryEmojis[b.category] || '📦'}</span>
                    {b.category}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(b)}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>🗑️</button>
                  </div>
                </div>
                <div className="budget-amounts">
                  <span>{fmt(b.spentAmount)}</span> of {fmt(b.limitAmount)}
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${status}`} style={{ width: `${pct}%` }} />
                </div>
                <div className={`budget-percent ${status}`}>
                  {(b.percentage || 0).toFixed(1)}% used
                  {b.percentage >= 100 && ' 🚨 Exceeded!'}
                  {b.percentage >= 80 && b.percentage < 100 && ' ⚠️ Alert!'}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="glass-card modal-container">
            <div className="modal-header">
              <span className="modal-title">{editItem ? 'Edit Budget' : 'Set Budget'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{categoryEmojis[c]} {c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Monthly Limit (₹)</label>
                  <input type="number" step="0.01" className="form-input" placeholder="5000" value={form.limitAmount} onChange={e => setForm({...form, limitAmount: e.target.value})} required min="1" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Month</label>
                    <select className="form-input" value={form.month} onChange={e => setForm({...form, month: +e.target.value})}>
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select className="form-input" value={form.year} onChange={e => setForm({...form, year: +e.target.value})}>
                      {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? '💾 Update' : '🎯 Set Budget'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
