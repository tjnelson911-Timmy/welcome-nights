import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Presentation, Settings, FileText } from 'lucide-react'

function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            Welcome<span>Nights</span>
          </div>
          <div className="sidebar-tagline">Culture Night Builder</div>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <ul className="sidebar-nav">
            <li>
              <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
                <Settings size={20} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
                <Presentation size={20} />
                <span>Presentations</span>
              </NavLink>
            </li>
          </ul>
          <div style={{ flex: 1 }} />
          <ul className="sidebar-nav" style={{ marginBottom: 16, paddingBottom: 16 }}>
            <li>
              <NavLink to="/admin/content" className={({ isActive }) => isActive ? 'active' : ''}>
                <FileText size={20} />
                <span>Content</span>
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
