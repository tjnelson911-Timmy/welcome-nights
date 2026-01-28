import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PresentationsList from './pages/PresentationsList'
import PresentationWizard from './pages/PresentationWizard'
import PresentMode from './pages/PresentMode'
import Admin from './pages/Admin'

function App() {
  return (
    <Routes>
      <Route path="/:id/present" element={<PresentMode />} />
      <Route element={<Layout />}>
        <Route path="/" element={<PresentationsList />} />
        <Route path="/new" element={<PresentationWizard />} />
        <Route path="/:id/edit" element={<PresentationWizard />} />
        <Route path="/admin/*" element={<Admin />} />
      </Route>
    </Routes>
  )
}

export default App
