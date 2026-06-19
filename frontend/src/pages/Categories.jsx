import React, { useEffect, useState } from 'react'
import { categoryService } from '../services/categoryService'
import toast from 'react-hot-toast'

const PRESET_COLORS = ['#10b981','#3b82f6','#ec4899','#8b5cf6','#ef4444','#f59e0b','#06b6d4','#6366f1','#64748b','#f97316']
const PRESET_ICONS = ['🍔','🚗','🛍️','🎬','💊','📚','📄','📦','✈️','🏠','💡','🎮','👔','💆','🐾']

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ name: '', icon: '📦', color: '#6366f1' })

  const load = async () => {
    setLoading(true)
    try { setCategories(await categoryService.getAll()) }
    catch { toast.error('Failed to load categories') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditItem(null)
    setForm({ name: '', icon: '📦', color: '#6366f1' })
    setShowModal(true)
  }

  const openEdit = (c) => {
    setEditItem(c)
    setForm({ name: c.name, icon: c.icon || '📦', color: c.color || '#6366f1' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editItem) {
        await categoryService.update(editItem.id, form)
        toast.success('Category updated!')
      } else {
        await categoryService.create(form)
        toast.success('Category created!')
      }
      setShowModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return
    try {
      await categoryService.delete(id)
      toast.success('Category deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Manage your expense categories</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Category</button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12, flex: '1 1 150px' }} />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">🏷️</div>
            <h3>No categories yet</h3>
            <p>Create custom categories for your expenses</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {categories.map(cat => (
            <div key={cat.id} className="glass-card" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, background: `${cat.color || '#6366f1'}20`, fontSize: '1.5rem', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cat.icon || '📦'}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat.name}</div>
              <div style={{ width: 24, height: 4, borderRadius: 2, background: cat.color || '#6366f1' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(cat)}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cat.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="glass-card modal-container">
            <div className="modal-header">
              <span className="modal-title">{editItem ? 'Edit Category' : 'New Category'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Category Name</label>
                  <input className="form-input" placeholder="e.g. Groceries" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Icon</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0' }}>
                    {PRESET_ICONS.map(icon => (
                      <button key={icon} type="button" onClick={() => setForm({...form, icon})}
                        style={{ width: 40, height: 40, borderRadius: 8, background: form.icon === icon ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', border: form.icon === icon ? '2px solid #6366f1' : '1px solid rgba(99,102,241,0.15)', fontSize: '1.2rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 0', alignItems: 'center' }}>
                    {PRESET_COLORS.map(color => (
                      <button key={color} type="button" onClick={() => setForm({...form, color})}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: color, border: form.color === color ? '3px solid white' : '2px solid transparent', cursor: 'pointer', boxShadow: form.color === color ? `0 0 8px ${color}80` : 'none', transition: 'all 0.2s' }} />
                    ))}
                    <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})}
                      style={{ width: 28, height: 28, padding: 0, border: 'none', background: 'none', cursor: 'pointer', borderRadius: '50%' }} title="Custom color" />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${form.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{form.icon}</div>
                  <div style={{ fontWeight: 600, color: form.color }}>{form.name || 'Preview'}</div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? '💾 Update' : '✨ Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
