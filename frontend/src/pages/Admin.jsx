import React, { useState, useEffect, useRef } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { FileText, Gamepad2, Building2, Image, Plus, Edit2, Trash2, Save, X, Upload, Download, FileBox, MapPin, RefreshCw } from 'lucide-react'
import Map, { Marker, Popup as MapPopup, NavigationControl } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = 'pk.eyJ1IjoidGpuZWxzb245MTEiLCJhIjoiY21rZ2hvd2h6MDc1bDNkb256c2ZpZzJ5ZSJ9.GjbF9IEBFXgJl-unUW4hoQ'
import {
  getBrands,
  getContent,
  updateContent,
  getGames,
  createGame,
  updateGame,
  deleteGame,
  getFacilities,
  createFacility,
  updateFacility,
  deleteFacility,
  importFacilities,
  uploadFacilityLogo,
  deleteFacilityLogo,
  assignLogoToFacility,
  updateFacilityCoordinates,
  getAssets,
  uploadAsset,
  deleteAsset,
  getTemplates,
  uploadTemplate,
  deleteTemplate
} from '../services/api'

function Admin() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome Nights Admin</h1>
          <p className="page-subtitle">Manage content, games, facilities, and assets</p>
        </div>
      </div>

      <div className="tabs mb-4">
        <NavLink to="/admin/facilities" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <Building2 size={16} style={{ marginRight: 6 }} />
          Facilities
        </NavLink>
        <NavLink to="/admin/assets" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <Image size={16} style={{ marginRight: 6 }} />
          Logos
        </NavLink>
        <NavLink to="/admin/map" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <MapPin size={16} style={{ marginRight: 6 }} />
          Map
        </NavLink>
        <NavLink to="/admin/games" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <Gamepad2 size={16} style={{ marginRight: 6 }} />
          Games
        </NavLink>
        <NavLink to="/admin/templates" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <FileBox size={16} style={{ marginRight: 6 }} />
          Templates
        </NavLink>
      </div>

      <Routes>
        <Route path="/" element={<FacilitiesAdmin />} />
        <Route path="/facilities" element={<FacilitiesAdmin />} />
        <Route path="/assets" element={<AssetsAdmin />} />
        <Route path="/map" element={<MapAdmin />} />
        <Route path="/games" element={<GamesAdmin />} />
        <Route path="/templates" element={<TemplatesAdmin />} />
        <Route path="/content" element={<ContentAdmin />} />
      </Routes>
    </div>
  )
}

// Content Admin
function ContentAdmin() {
  const [brands, setBrands] = useState([])
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingContent, setEditingContent] = useState(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => { loadBrands() }, [])
  useEffect(() => { if (selectedBrand) loadContent() }, [selectedBrand])

  const loadBrands = async () => {
    const data = await getBrands()
    setBrands(data)
    if (data.length > 0) setSelectedBrand(data[0].id)
  }

  const loadContent = async () => {
    setLoading(true)
    const data = await getContent(selectedBrand)
    setContent(data)
    setLoading(false)
  }

  const handleEdit = (item) => {
    setEditingContent(item.id)
    setEditValue(JSON.stringify(item.content, null, 2))
  }

  const handleSave = async (item) => {
    setSaving(true)
    try {
      const parsed = JSON.parse(editValue)
      await updateContent(item.id, { content: parsed, updated_by: 'Admin' })
      setEditingContent(null)
      loadContent()
    } catch (err) {
      alert('Invalid JSON: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const CONTENT_LABELS = {
    history: 'History Timeline',
    footprint: 'Our Footprint',
    regions: 'Regions Map',
    culture: 'Culture Block'
  }

  return (
    <div>
      <div className="wn-filters mb-4">
        <select
          className="form-select"
          value={selectedBrand || ''}
          onChange={(e) => setSelectedBrand(parseInt(e.target.value))}
        >
          {brands.map(brand => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {content.map(item => (
            <div key={item.id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{CONTENT_LABELS[item.content_key] || item.content_key}</h3>
                  <p className="card-subtitle">{item.title || 'No title set'}</p>
                </div>
                {editingContent === item.id ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-primary" onClick={() => handleSave(item)} disabled={saving}>
                      <Save size={14} /> Save
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setEditingContent(null)}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(item)}>
                    <Edit2 size={14} /> Edit
                  </button>
                )}
              </div>
              {editingContent === item.id ? (
                <textarea
                  className="form-textarea"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  style={{ fontFamily: 'monospace', minHeight: 300 }}
                />
              ) : (
                <pre style={{ fontSize: 12, background: '#f9fafb', padding: 12, borderRadius: 6, overflow: 'auto', maxHeight: 200 }}>
                  {JSON.stringify(item.content, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Games Admin
function GamesAdmin() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGame, setEditingGame] = useState(null)
  const [form, setForm] = useState({
    title: '', description: '', rules: '', duration_minutes: '',
    game_type: 'challenge', value_label: ''
  })

  useEffect(() => { loadGames() }, [])

  const loadGames = async () => {
    setLoading(true)
    const data = await getGames()
    setGames(data)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = {
        ...form,
        duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null
      }
      if (editingGame) {
        await updateGame(editingGame, data)
      } else {
        await createGame(data)
      }
      setShowForm(false)
      setEditingGame(null)
      setForm({ title: '', description: '', rules: '', duration_minutes: '', game_type: 'challenge', value_label: '' })
      loadGames()
    } catch (err) {
      alert('Error saving game')
    }
  }

  const handleEdit = (game) => {
    setEditingGame(game.id)
    setForm({
      title: game.title || '',
      description: game.description || '',
      rules: game.rules || '',
      duration_minutes: game.duration_minutes || '',
      game_type: game.game_type || 'challenge',
      value_label: game.value_label || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this game?')) return
    await deleteGame(id)
    loadGames()
  }

  const handleToggleActive = async (game) => {
    await updateGame(game.id, { is_active: !game.is_active })
    loadGames()
  }

  return (
    <div>
      <div className="wn-admin-section-header">
        <h3 className="wn-admin-section-title">Games Library</h3>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setEditingGame(null); setForm({ title: '', description: '', rules: '', duration_minutes: '', game_type: 'challenge', value_label: '' }) }}>
          <Plus size={16} /> Add Game
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.game_type} onChange={(e) => setForm({ ...form, game_type: e.target.value })}>
                  <option value="icebreaker">Ice Breaker</option>
                  <option value="challenge">Challenge (Minute-to-Win-It)</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Rules</label>
              <textarea className="form-textarea" rows={4} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duration (minutes)</label>
                <input type="number" className="form-input" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Value Label (e.g., FAMILY, TEAMWORK)</label>
                <input className="form-input" value={form.value_label} onChange={(e) => setForm({ ...form, value_label: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">{editingGame ? 'Update' : 'Create'} Game</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingGame(null) }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p>Loading...</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Value</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {games.map(game => (
              <tr key={game.id}>
                <td><strong>{game.title}</strong></td>
                <td><span className={`wn-game-type-badge ${game.game_type}`}>{game.game_type}</span></td>
                <td>{game.duration_minutes ? `${game.duration_minutes} min` : '-'}</td>
                <td>{game.value_label || '-'}</td>
                <td>
                  <button className={`btn btn-sm ${game.is_active ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleToggleActive(game)}>
                    {game.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(game)}><Edit2 size={14} /></button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(game.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// Facilities Admin
function FacilitiesAdmin() {
  const [brands, setBrands] = useState([])
  const [facilities, setFacilities] = useState([])
  const [assets, setAssets] = useState({})
  const [allLogos, setAllLogos] = useState([])
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingFacility, setEditingFacility] = useState(null)
  const [form, setForm] = useState({ name: '', city: '', state: '', address: '' })
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(null)
  const [showLogoSelector, setShowLogoSelector] = useState(null) // facility ID for logo selection
  const importFileRef = useRef(null)
  const logoFileRefs = useRef({})

  useEffect(() => { loadBrands() }, [])
  useEffect(() => { if (selectedBrand) loadFacilities() }, [selectedBrand])

  const loadBrands = async () => {
    const data = await getBrands()
    setBrands(data)
    if (data.length > 0) setSelectedBrand(data[0].id)
  }

  const loadFacilities = async () => {
    setLoading(true)
    const data = await getFacilities({ brand_id: selectedBrand })
    data.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    setFacilities(data)
    // Load all assets to get logo URLs
    const assetData = await getAssets({ brand_id: selectedBrand })
    const assetMap = {}
    const logos = []
    assetData.forEach(a => {
      assetMap[a.id] = a
      if (a.asset_type === 'facility_logo' || a.asset_type === 'logo') {
        logos.push(a)
      }
    })
    logos.sort((a, b) => (a.original_filename || '').localeCompare(b.original_filename || ''))
    setAssets(assetMap)
    setAllLogos(logos)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingFacility) {
        await updateFacility(editingFacility, form)
      } else {
        await createFacility({ ...form, brand_id: selectedBrand })
      }
      setShowForm(false)
      setEditingFacility(null)
      setForm({ name: '', city: '', state: '', address: '' })
      loadFacilities()
    } catch (err) {
      alert('Error saving facility')
    }
  }

  const handleEdit = (facility) => {
    setEditingFacility(facility.id)
    setForm({
      name: facility.name,
      city: facility.city || '',
      state: facility.state || '',
      address: facility.address || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this facility?')) return
    await deleteFacility(id)
    loadFacilities()
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const result = await importFacilities(selectedBrand, file)
      setImportResult(result)
      loadFacilities()
    } catch (err) {
      setImportResult({ message: 'Import failed: ' + (err.response?.data?.detail || err.message), errors: [] })
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const handleLogoUpload = async (facilityId, e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingLogo(facilityId)
    try {
      await uploadFacilityLogo(facilityId, file)
      loadFacilities()
    } catch (err) {
      alert('Error uploading logo: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUploadingLogo(null)
      e.target.value = ''
    }
  }

  const handleLogoDelete = async (facilityId) => {
    if (!window.confirm('Remove this logo?')) return
    try {
      await deleteFacilityLogo(facilityId)
      loadFacilities()
    } catch (err) {
      alert('Error removing logo')
    }
  }

  const handleAssignLogo = async (facilityId, assetId) => {
    try {
      await assignLogoToFacility(facilityId, assetId)
      setShowLogoSelector(null)
      loadFacilities()
    } catch (err) {
      alert('Error assigning logo: ' + (err.response?.data?.detail || err.message))
    }
  }

  const openLogoSelector = (facilityId) => {
    setShowLogoSelector(facilityId)
  }

  const downloadTemplate = () => {
    const csv = 'name,city,state,address\nExample Facility,Portland,OR,123 Main St'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'facilities_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="wn-filters mb-4">
        <select className="form-select" value={selectedBrand || ''} onChange={(e) => setSelectedBrand(parseInt(e.target.value))}>
          {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </select>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(true); setEditingFacility(null); setForm({ name: '', city: '', state: '', address: '' }) }}>
          <Plus size={16} /> Add Facility
        </button>
        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
          <Upload size={16} /> {importing ? 'Importing...' : 'Import CSV/Excel'}
          <input
            ref={importFileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleImport}
            style={{ display: 'none' }}
            disabled={importing}
          />
        </label>
        <button className="btn btn-ghost btn-sm" onClick={downloadTemplate} title="Download CSV template">
          <Download size={16} /> Template
        </button>
      </div>

      {importResult && (
        <div className={`alert ${importResult.errors?.length ? 'alert-warning' : 'alert-success'} mb-4`}>
          <strong>{importResult.message}</strong>
          {importResult.errors?.length > 0 && (
            <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: 13 }}>
              {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}
          <button className="btn btn-sm btn-ghost" onClick={() => setImportResult(null)} style={{ marginLeft: 'auto' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {showForm && (
        <div className="card mb-4">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Facility Name</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input className="form-input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary">{editingFacility ? 'Update' : 'Create'} Facility</button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setEditingFacility(null) }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p>Loading...</p> : (
        <table className="data-table">
          <thead>
            <tr><th style={{ width: 80 }}>Logo</th><th>Name</th><th>City</th><th>State</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {facilities.map(f => (
              <tr key={f.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {f.logo_asset_id && assets[f.logo_asset_id] ? (
                      <div
                        style={{ position: 'relative', width: 50, height: 50, cursor: 'pointer' }}
                        onClick={() => openLogoSelector(f.id)}
                        title="Click to change logo"
                      >
                        <img
                          src={`http://localhost:8001${assets[f.logo_asset_id].url}`}
                          alt={f.name}
                          style={{ width: 50, height: 50, objectFit: 'contain', borderRadius: 4, background: '#f3f4f6' }}
                        />
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={(e) => { e.stopPropagation(); handleLogoDelete(f.id) }}
                          style={{ position: 'absolute', top: -8, right: -8, padding: 2, minWidth: 20, height: 20 }}
                          title="Remove logo"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => openLogoSelector(f.id)}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 4,
                          background: '#f3f4f6',
                          border: '2px dashed #d1d5db',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#9ca3af',
                          cursor: 'pointer'
                        }}
                        title="Click to select a logo"
                      >
                        <Image size={20} />
                      </div>
                    )}
                  </div>
                </td>
                <td><strong>{f.name}</strong></td>
                <td>{f.city || '-'}</td>
                <td>{f.state || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => handleEdit(f)}><Edit2 size={14} /></button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(f.id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {facilities.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#6b7280' }}>No facilities yet. Add one or import from CSV/Excel.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Logo Selector Modal */}
      {showLogoSelector && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowLogoSelector(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 24,
              maxWidth: 800,
              maxHeight: '80vh',
              overflow: 'auto',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>
                Select Logo for: {facilities.find(f => f.id === showLogoSelector)?.name}
              </h3>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowLogoSelector(null)}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: '#6b7280', marginBottom: 16 }}>
              Click on a logo to assign it to this facility. Logos are from the Logos tab.
            </p>
            {allLogos.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>
                No logos available. Upload logos in the Logos tab first.
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
                {allLogos.map(logo => (
                  <div
                    key={logo.id}
                    onClick={() => handleAssignLogo(showLogoSelector, logo.id)}
                    style={{
                      padding: 8,
                      borderRadius: 8,
                      border: '2px solid #e5e7eb',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: facilities.find(f => f.id === showLogoSelector)?.logo_asset_id === logo.id ? '#e0f2fe' : 'white'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#0b7280'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  >
                    <div style={{ aspectRatio: '1', background: '#f9fafb', borderRadius: 4, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={`http://localhost:8001${logo.url}`}
                        alt={logo.original_filename}
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      {logo.original_filename}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Assets Admin
function AssetsAdmin() {
  const [brands, setBrands] = useState([])
  const [assets, setAssets] = useState([])
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [assetType, setAssetType] = useState('logo')

  useEffect(() => { loadBrands() }, [])
  useEffect(() => { if (selectedBrand) loadAssets() }, [selectedBrand])

  const loadBrands = async () => {
    const data = await getBrands()
    setBrands(data)
    if (data.length > 0) setSelectedBrand(data[0].id)
  }

  const loadAssets = async () => {
    setLoading(true)
    const data = await getAssets({ brand_id: selectedBrand })
    // Sort alphabetically by original filename
    data.sort((a, b) => (a.original_filename || '').localeCompare(b.original_filename || ''))
    setAssets(data)
    setLoading(false)
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadAsset(selectedBrand, assetType, file)
      loadAssets()
    } catch (err) {
      alert('Error uploading asset')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset?')) return
    await deleteAsset(id)
    loadAssets()
  }

  return (
    <div>
      <div className="wn-filters mb-4">
        <select className="form-select" value={selectedBrand || ''} onChange={(e) => setSelectedBrand(parseInt(e.target.value))}>
          {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </select>
        <select className="form-select" value={assetType} onChange={(e) => setAssetType(e.target.value)}>
          <option value="logo">Logo</option>
          <option value="background">Background</option>
          <option value="icon">Icon</option>
          <option value="image">Image</option>
        </select>
        <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
          <Plus size={16} /> {uploading ? 'Uploading...' : 'Upload Asset'}
          <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
        </label>
      </div>

      {loading ? <p>Loading...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {assets.map(asset => (
            <div key={asset.id} className="card" style={{ padding: 12 }}>
              <div style={{ aspectRatio: '1', background: '#f3f4f6', borderRadius: 8, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={`http://localhost:8001${asset.url}`} alt={asset.original_filename} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {asset.original_filename}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>{asset.asset_type}</div>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(asset.id)} style={{ width: '100%' }}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          ))}
          {assets.length === 0 && <p className="text-muted">No assets uploaded yet</p>}
        </div>
      )}
    </div>
  )
}

// Templates Admin - Upload reference PPTX templates
function TemplatesAdmin() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { loadTemplates() }, [])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const data = await getTemplates()
      setTemplates(data)
    } catch (err) {
      console.error('Error loading templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadTemplate(file)
      loadTemplates()
    } catch (err) {
      alert('Error uploading template: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (filename) => {
    if (!window.confirm('Delete this template?')) return
    try {
      await deleteTemplate(filename)
      loadTemplates()
    } catch (err) {
      alert('Error deleting template')
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString()
  }

  return (
    <div>
      <div className="wn-admin-section-header">
        <div>
          <h3 className="wn-admin-section-title">PowerPoint Templates</h3>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Upload your existing Culture Night PowerPoint templates as reference for improving the generated presentations.
          </p>
        </div>
        <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
          <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Template'}
          <input
            type="file"
            accept=".pptx,.ppt"
            onChange={handleUpload}
            style={{ display: 'none' }}
            disabled={uploading}
          />
        </label>
      </div>

      {loading ? <p>Loading...</p> : (
        <div style={{ marginTop: 24 }}>
          {templates.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <FileBox size={48} style={{ color: '#d1d5db', marginBottom: 16 }} />
              <p style={{ color: '#6b7280', marginBottom: 16 }}>No templates uploaded yet</p>
              <p style={{ color: '#9ca3af', fontSize: 14 }}>
                Upload your current Culture Night PowerPoint template (.pptx) so we can use it as a reference.
              </p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(t => (
                  <tr key={t.filename}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FileBox size={20} style={{ color: '#f97316' }} />
                        <a
                          href={`http://localhost:8001${t.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
                        >
                          {t.filename}
                        </a>
                      </div>
                    </td>
                    <td>{formatFileSize(t.size)}</td>
                    <td>{formatDate(t.uploaded_at)}</td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.filename)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}


// Map Admin - Display facilities on a map
function MapAdmin() {
  const mapRef = useRef(null)
  const [brands, setBrands] = useState([])
  const [facilities, setFacilities] = useState([])
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [loading, setLoading] = useState(true)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodingSingle, setGeocodingSingle] = useState(null) // facility ID being geocoded
  const [markers, setMarkers] = useState([])
  const [geocodeProgress, setGeocodeProgress] = useState({ current: 0, total: 0 })
  const [selectedFacilityId, setSelectedFacilityId] = useState(null)
  const [popupInfo, setPopupInfo] = useState(null)

  useEffect(() => { loadBrands() }, [])
  useEffect(() => { if (selectedBrand) loadFacilities() }, [selectedBrand])

  const loadBrands = async () => {
    const data = await getBrands()
    setBrands(data)
    if (data.length > 0) setSelectedBrand(data[0].id)
  }

  const loadFacilities = async () => {
    setLoading(true)
    const data = await getFacilities({ brand_id: selectedBrand })
    data.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    setFacilities(data)
    setLoading(false)
    // Build markers from facilities that have coordinates in DB
    buildMarkersFromFacilities(data)
  }

  const buildMarkersFromFacilities = (facilitiesList) => {
    const newMarkers = []
    facilitiesList.forEach(f => {
      if (f.latitude && f.longitude) {
        newMarkers.push({
          facility: f,
          lat: f.latitude,
          lng: f.longitude
        })
      }
    })
    setMarkers(newMarkers)
  }

  const geocodeAddress = async (address) => {
    // Use Nominatim (OpenStreetMap) for geocoding
    const encoded = encodeURIComponent(address)
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`, {
      headers: { 'User-Agent': 'WelcomeNights/1.0' }
    })
    const data = await response.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
    return null
  }

  const buildAddressString = (facility) => {
    let addressStr = facility.address || ''
    if (facility.city) addressStr += (addressStr ? ', ' : '') + facility.city
    if (facility.state) addressStr += (addressStr ? ', ' : '') + facility.state
    return addressStr
  }

  const geocodeSingleFacility = async (facility) => {
    const addressStr = buildAddressString(facility)
    if (!addressStr) {
      alert('No address available for this facility')
      return
    }

    setGeocodingSingle(facility.id)
    try {
      const coords = await geocodeAddress(addressStr)
      if (coords) {
        // Save to backend
        await updateFacilityCoordinates(facility.id, coords.lat, coords.lng)
        // Reload facilities to get updated data
        await loadFacilities()
      } else {
        alert('Could not find coordinates for this address')
      }
    } catch (err) {
      console.error('Geocoding error for', facility.name, err)
      alert('Error geocoding: ' + err.message)
    } finally {
      setGeocodingSingle(null)
    }
  }

  const geocodeAllFacilities = async () => {
    setGeocoding(true)
    const facilitiesToGeocode = facilities.filter(f => {
      const hasAddress = f.address || (f.city && f.state)
      const notGeocoded = !f.latitude || !f.longitude
      return hasAddress && notGeocoded
    })

    setGeocodeProgress({ current: 0, total: facilitiesToGeocode.length })

    for (let i = 0; i < facilitiesToGeocode.length; i++) {
      const f = facilitiesToGeocode[i]
      setGeocodeProgress({ current: i + 1, total: facilitiesToGeocode.length })

      const addressStr = buildAddressString(f)
      if (!addressStr) continue

      try {
        const coords = await geocodeAddress(addressStr)
        if (coords) {
          // Save to backend
          await updateFacilityCoordinates(f.id, coords.lat, coords.lng)
        }
        // Rate limit: Nominatim requires max 1 request per second
        await new Promise(resolve => setTimeout(resolve, 1100))
      } catch (err) {
        console.error('Geocoding error for', f.name, err)
      }
    }

    // Reload all facilities to get updated coordinates
    await loadFacilities()
    setGeocoding(false)
  }

  const clearAllCoordinates = async () => {
    if (!window.confirm('Clear coordinates for all facilities? This cannot be undone.')) return

    setGeocoding(true)
    try {
      for (const f of facilities) {
        if (f.latitude || f.longitude) {
          await updateFacilityCoordinates(f.id, null, null)
        }
      }
      await loadFacilities()
    } catch (err) {
      alert('Error clearing coordinates: ' + err.message)
    } finally {
      setGeocoding(false)
    }
  }

  const handleFacilityClick = (facilityId) => {
    const marker = markers.find(m => m.facility.id === facilityId)
    if (marker) {
      setSelectedFacilityId(facilityId)
      setPopupInfo(marker)
      // Fly to location
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [marker.lng, marker.lat],
          zoom: 10,
          duration: 1500
        })
      }
    }
  }

  const facilitiesWithAddress = facilities.filter(f => f.address || (f.city && f.state))
  const facilitiesWithoutAddress = facilities.filter(f => !f.address && !f.city && !f.state)
  const facilitiesNeedGeocoding = facilities.filter(f => {
    const hasAddress = f.address || (f.city && f.state)
    const notGeocoded = !f.latitude || !f.longitude
    return hasAddress && notGeocoded
  })

  return (
    <div>
      <div className="wn-filters mb-4">
        <select className="form-select" value={selectedBrand || ''} onChange={(e) => setSelectedBrand(parseInt(e.target.value))}>
          {brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
        </select>
        <button
          className="btn btn-primary btn-sm"
          onClick={geocodeAllFacilities}
          disabled={geocoding || loading || facilitiesNeedGeocoding.length === 0}
        >
          <MapPin size={16} /> {geocoding ? `Geocoding ${geocodeProgress.current}/${geocodeProgress.total}...` : `Geocode All (${facilitiesNeedGeocoding.length})`}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={clearAllCoordinates}
          disabled={geocoding || markers.length === 0}
        >
          <RefreshCw size={16} /> Clear All Coordinates
        </button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <div style={{ background: '#f0fdf4', padding: '8px 16px', borderRadius: 8, fontSize: 14 }}>
          <strong>{markers.length}</strong> facilities mapped
        </div>
        <div style={{ background: '#fef3c7', padding: '8px 16px', borderRadius: 8, fontSize: 14 }}>
          <strong>{facilitiesNeedGeocoding.length}</strong> need geocoding
        </div>
        {facilitiesWithoutAddress.length > 0 && (
          <div style={{ background: '#fef2f2', padding: '8px 16px', borderRadius: 8, fontSize: 14 }}>
            <strong>{facilitiesWithoutAddress.length}</strong> missing address
          </div>
        )}
      </div>

      {loading ? <p>Loading facilities...</p> : (
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Map */}
          <div style={{ flex: 2, height: 600, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <Map
              ref={mapRef}
              mapboxAccessToken={MAPBOX_TOKEN}
              initialViewState={{
                longitude: -98.5795,
                latitude: 39.8283,
                zoom: 4
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/light-v11"
              onClick={() => setPopupInfo(null)}
            >
              <NavigationControl position="top-right" />
              {markers.map((marker) => (
                <Marker
                  key={marker.facility.id}
                  longitude={marker.lng}
                  latitude={marker.lat}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation()
                    setPopupInfo(marker)
                    setSelectedFacilityId(marker.facility.id)
                  }}
                >
                  <div
                    style={{
                      width: selectedFacilityId === marker.facility.id ? 20 : 14,
                      height: selectedFacilityId === marker.facility.id ? 20 : 14,
                      backgroundColor: selectedFacilityId === marker.facility.id ? '#dc2626' : '#0b7280',
                      borderRadius: '50%',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  />
                </Marker>
              ))}
              {popupInfo && (
                <MapPopup
                  longitude={popupInfo.lng}
                  latitude={popupInfo.lat}
                  anchor="bottom"
                  onClose={() => setPopupInfo(null)}
                  closeOnClick={false}
                >
                  <div style={{ minWidth: 150, padding: 4 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{popupInfo.facility.name}</div>
                    {popupInfo.facility.city && (
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {popupInfo.facility.city}, {popupInfo.facility.state}
                      </div>
                    )}
                    {popupInfo.facility.address && (
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                        {popupInfo.facility.address}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 8 }}>
                      {popupInfo.lat.toFixed(4)}, {popupInfo.lng.toFixed(4)}
                    </div>
                  </div>
                </MapPopup>
              )}
            </Map>
          </div>

          {/* Facility List */}
          <div style={{ flex: 1, maxHeight: 600, overflow: 'auto' }}>
            <h4 style={{ marginBottom: 12 }}>Facilities ({facilities.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {facilities.map(f => {
                const isGeocoded = f.latitude && f.longitude
                const hasAddress = f.address || (f.city && f.state)
                const isGeocodingThis = geocodingSingle === f.id
                return (
                  <div
                    key={f.id}
                    style={{
                      padding: '10px 12px',
                      background: isGeocoded ? '#f0fdf4' : (hasAddress ? '#fef3c7' : '#fef2f2'),
                      borderRadius: 8,
                      fontSize: 13,
                      cursor: isGeocoded ? 'pointer' : 'default',
                      border: selectedFacilityId === f.id ? '2px solid #0b7280' : '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => isGeocoded && handleFacilityClick(f.id)}
                    title={isGeocoded ? 'Click to zoom to this facility on the map' : ''}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{f.name}</div>
                        {f.city && <div style={{ color: '#6b7280' }}>{f.city}, {f.state}</div>}
                        {!hasAddress && <div style={{ color: '#dc2626', fontSize: 11 }}>Missing address</div>}
                        {isGeocoded && (
                          <div style={{ color: '#059669', fontSize: 11 }}>
                            📍 {f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}
                          </div>
                        )}
                      </div>
                      {hasAddress && !isGeocoded && (
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={(e) => { e.stopPropagation(); geocodeSingleFacility(f) }}
                          disabled={isGeocodingThis || geocoding}
                          title="Geocode this facility"
                          style={{ padding: '4px 8px' }}
                        >
                          {isGeocodingThis ? <RefreshCw size={14} className="animate-spin" /> : <MapPin size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 8, fontSize: 13, color: '#6b7280' }}>
        <strong>How to use:</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Click "Geocode All" to convert all addresses to map coordinates (saved to database)</li>
          <li>Click the pin icon next to a facility to geocode just that one</li>
          <li>Click on a mapped facility in the list to zoom to it on the map</li>
          <li>Coordinates are stored in the database and persist across sessions</li>
        </ul>
        <div style={{ marginTop: 8, fontStyle: 'italic' }}>
          Note: Geocoding uses OpenStreetMap's Nominatim service (rate limited to 1 request/second).
        </div>
      </div>
    </div>
  )
}

export default Admin
