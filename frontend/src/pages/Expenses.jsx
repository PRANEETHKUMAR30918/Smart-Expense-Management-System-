import React, { useEffect, useState, useCallback } from 'react'
import { expenseService } from '../services/expenseService'
import { categoryService } from '../services/categoryService'
import toast from 'react-hot-toast'

const DEFAULT_CATEGORIES = ['Food','Transport','Shopping','Entertainment','Health','Education','Bills','Other']
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Other']

const categoryColors = {
  'Food': '#10b981','Transport': '#3b82f6','Shopping': '#ec4899',
  'Entertainment': '#8b5cf6','Health': '#ef4444','Education': '#f59e0b',
  'Bills': '#06b6d4','Other': '#64748b'
}

const categoryEmojis = {
  'Food': '🍔','Transport': '🚗','Shopping': '🛍️','Entertainment': '🎬',
  'Health': '💊','Education': '📚','Bills': '📄','Other': '📦'
}

export default function Expenses() {
  const [data, setData] = useState({ content: [], totalPages: 0, number: 0 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [form, setForm] = useState({
    title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0],
    description: '', paymentMethod: 'UPI'
  })

  const loadExpenses = useCallback(async (page = 0, cat = filterCat, query = search) => {
    setLoading(true)
    try {
      const res = await expenseService.getAll(page, 10, cat, query)
      setData(res)
    } catch { toast.error('Failed to load expenses') }
    finally { setLoading(false) }
  }, [filterCat, search])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadExpenses(0, filterCat, search)
    }, 250)
    return () => clearTimeout(timer)
  }, [filterCat, search, loadExpenses])

  useEffect(() => {
    categoryService.getAll().then(cats => {
      if (cats.length > 0) setCategories(cats.map(c => c.name))
    }).catch(() => {})
  }, [])

  const openCreate = () => {
    setEditItem(null)
    setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0], description: '', paymentMethod: 'UPI' })
    setShowModal(true)
  }

  const openEdit = (item) => {
    setEditItem(item)
    setForm({ title: item.title, amount: item.amount, category: item.category, date: item.date, description: item.description || '', paymentMethod: item.paymentMethod || 'UPI' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form, amount: parseFloat(form.amount) }
      if (editItem) {
        await expenseService.update(editItem.id, payload)
        toast.success('Expense updated!')
      } else {
        await expenseService.create(payload)
        toast.success('Expense added!')
      }
      setShowModal(false)
      loadExpenses(data.number)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return
    try {
      await expenseService.delete(id)
      toast.success('Expense deleted')
      loadExpenses(data.number)
    } catch { toast.error('Delete failed') }
  }

  const items = data.content || []

  const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">{(data.totalElements !== undefined ? data.totalElements : items.length)} transactions tracked</p>
        </div>
        <button id="add-expense-btn" className="btn btn-primary" onClick={openCreate}>+ Add Expense</button>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input className="form-input" placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" style={{ width: 'auto', minWidth: 140 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="glass-card table-container">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }} /></div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <h3>No expenses found</h3>
            <p>Add your first expense to get started</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(exp => (
                <tr key={exp.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{exp.title}</div>
                    {exp.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{exp.description}</div>}
                  </td>
                  <td>
                    <span className="badge" style={{ background: `${categoryColors[exp.category] || '#6366f1'}20`, color: categoryColors[exp.category] || '#6366f1' }}>
                      {categoryEmojis[exp.category] || '📦'} {exp.category}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: 'var(--accent-red)' }}>{fmt(exp.amount)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{exp.date}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{exp.paymentMethod}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(exp)}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exp.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data.totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => loadExpenses(data.number - 1)} disabled={data.number === 0}>‹</button>
          {[...Array(data.totalPages)].map((_, i) => (
            <button key={i} className={`page-btn ${data.number === i ? 'active' : ''}`} onClick={() => loadExpenses(i)}>{i + 1}</button>
          ))}
          <button className="page-btn" onClick={() => loadExpenses(data.number + 1)} disabled={data.number === data.totalPages - 1}>›</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="glass-card modal-container">
            <div className="modal-header">
              <span className="modal-title">{editItem ? 'Edit Expense' : 'Add Expense'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" placeholder="e.g. Lunch at restaurant" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Amount (₹) *</label>
                    <input type="number" step="0.01" className="form-input" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required min="0.01" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="form-input" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                      {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" placeholder="Optional note" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? '💾 Update' : '➕ Add Expense'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
