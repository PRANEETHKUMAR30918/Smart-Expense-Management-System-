import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/expenses': 'Expenses',
  '/budgets': 'Budgets',
  '/categories': 'Categories',
  '/profile': 'Profile',
}

export default function Layout() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'ExpenseIQ'

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} />
        <div className="page-container">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
