import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Presentation, Settings } from 'lucide-react'

function Layout() {
  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1>Welcome Nights</h1>
          <p>Culture Night Builder</p>
        </div>
        <ul className="nav-list">
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
              <Presentation size={18} />
              <span>Presentations</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'active' : ''}>
              <Settings size={18} />
              <span>Admin</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
