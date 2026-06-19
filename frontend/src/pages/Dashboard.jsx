import React, { useEffect, useState, useRef } from 'react'
import { dashboardService } from '../services/dashboardService'
import { Chart, registerables } from 'chart.js'
import toast from 'react-hot-toast'

Chart.register(...registerables)

const CATEGORY_COLORS = {
  'Food': '#10b981',
  'Transport': '#3b82f6',
  'Shopping': '#ec4899',
  'Entertainment': '#8b5cf6',
  'Health': '#ef4444',
  'Education': '#f59e0b',
  'Bills': '#06b6d4',
  'Other': '#64748b',
}

function fmt(n) {
  if (!n && n !== 0) return '₹0'
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const donutRef = useRef(null)
  const lineRef = useRef(null)
  const donutChartRef = useRef(null)
  const lineChartRef = useRef(null)

  useEffect(() => {
    dashboardService.getStats()
      .then(setStats)
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!stats) return

    // Destroy existing charts before re-creating
    if (donutChartRef.current) {
      donutChartRef.current.destroy()
      donutChartRef.current = null
    }
    if (lineChartRef.current) {
      lineChartRef.current.destroy()
      lineChartRef.current = null
    }

    const catData = stats.categoryWiseExpenses || {}
    const catLabels = Object.keys(catData)
    const catValues = Object.values(catData)
    const catColors = catLabels.map(l => CATEGORY_COLORS[l] || '#6366f1')

    if (donutRef.current && catLabels.length > 0) {
      donutChartRef.current = new Chart(donutRef.current, {
        type: 'doughnut',
        data: {
          labels: catLabels,
          datasets: [{
            data: catValues,
            backgroundColor: catColors,
            borderWidth: 0,
            hoverOffset: 8,
          }],
        },
        options: {
          responsive: true,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#94a3b8', font: { size: 12 }, padding: 16 },
            },
            tooltip: {
              callbacks: {
                label: ctx => ` ₹${Number(ctx.parsed).toLocaleString('en-IN')}`,
              },
            },
          },
        },
      })
    }

    const trend = stats.monthlyTrend || []
    if (lineRef.current && trend.length > 0) {
      lineChartRef.current = new Chart(lineRef.current, {
        type: 'bar',
        data: {
          labels: trend.map(t => t.month),
          datasets: [{
            label: 'Monthly Expenses',
            data: trend.map(t => t.amount),
            backgroundColor: 'rgba(99, 102, 241, 0.3)',
            borderColor: '#6366f1',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => ` ₹${Number(ctx.parsed.y).toLocaleString('en-IN')}`,
              },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#94a3b8' },
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: {
                color: '#94a3b8',
                callback: v => '₹' + Number(v).toLocaleString('en-IN'),
              },
            },
          },
        },
      })
    }

    return () => {
      donutChartRef.current?.destroy()
      lineChartRef.current?.destroy()
    }
  }, [stats])

  const thisMonth = stats?.totalExpensesThisMonth || 0
  const lastMonth = stats?.totalExpensesLastMonth || 0
  const changePercent = lastMonth > 0
    ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1)
    : thisMonth > 0 ? 100 : 0
  const isIncrease = Number(changePercent) >= 0

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="skeleton" style={{ width: 220, height: 32, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 160, height: 16 }} />
          </div>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: 130, borderRadius: 16 }} />
          ))}
        </div>
        <div className="charts-grid">
          <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Overview</h1>
          <p className="page-subtitle">Track your spending and budget performance</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="glass-card stat-card purple">
          <div className="stat-icon purple">💸</div>
          <div className="stat-value">{fmt(thisMonth)}</div>
          <div className="stat-label">This Month</div>
          <div className={`stat-change ${isIncrease ? 'negative' : 'positive'}`}>
            {isIncrease ? '↑' : '↓'} {Math.abs(changePercent)}% vs last month
          </div>
        </div>

        <div className="glass-card stat-card blue">
          <div className="stat-icon blue">📅</div>
          <div className="stat-value">{fmt(lastMonth)}</div>
          <div className="stat-label">Last Month</div>
        </div>

        <div className="glass-card stat-card emerald">
          <div className="stat-icon emerald">🎯</div>
          <div className="stat-value">{fmt(stats?.totalBudget)}</div>
          <div className="stat-label">Total Budget</div>
        </div>

        <div className="glass-card stat-card orange">
          <div className="stat-icon orange">📝</div>
          <div className="stat-value">{stats?.totalTransactions || 0}</div>
          <div className="stat-label">Transactions</div>
        </div>
      </div>

      {/* Budget Alerts */}
      {stats?.budgetAlerts?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
            ⚠️ Budget Alerts
          </h2>
          {stats.budgetAlerts.map((alert, idx) => (
            <div key={alert.id || idx} className={`alert ${alert.percentage >= 100 ? 'danger' : 'warning'}`}>
              <span>{alert.percentage >= 100 ? '🚨' : '⚠️'}</span>
              <div>
                <strong>{alert.category}</strong>: Spent{' '}
                ₹{Number(alert.spentAmount).toLocaleString('en-IN')} of{' '}
                ₹{Number(alert.limitAmount).toLocaleString('en-IN')}{' '}
                ({Number(alert.percentage).toFixed(1)}%)
                {alert.percentage >= 100 && <span style={{ marginLeft: 4 }}>— Budget exceeded!</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="charts-grid">
        <div className="glass-card chart-card">
          <div className="chart-title">📊 Category Breakdown</div>
          {Object.keys(stats?.categoryWiseExpenses || {}).length > 0 ? (
            <canvas ref={donutRef} />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">🍩</div>
              <h3>No data yet</h3>
              <p>Add expenses to see category breakdown</p>
            </div>
          )}
        </div>

        <div className="glass-card chart-card">
          <div className="chart-title">📈 Monthly Trend</div>
          {stats?.monthlyTrend?.length > 0 ? (
            <canvas ref={lineRef} />
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📈</div>
              <h3>No trend data</h3>
              <p>Data will appear as you add expenses over time</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Categories summary */}
      {Object.keys(stats?.categoryWiseExpenses || {}).length > 0 && (
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="chart-title">🏆 Top Spending Categories</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(stats.categoryWiseExpenses)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([cat, amount]) => {
                const total = Object.values(stats.categoryWiseExpenses).reduce((a, b) => a + b, 0)
                const pct = total > 0 ? (amount / total * 100).toFixed(1) : 0
                const color = CATEGORY_COLORS[cat] || '#6366f1'
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: color + '22',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{cat}</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {fmt(amount)} ({pct}%)
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill safe"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
