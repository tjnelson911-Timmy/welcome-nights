import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

// Brands
export const getBrands = async () => (await api.get('/brands')).data
export const getBrand = async (id) => (await api.get('/brands/' + id)).data
export const createBrand = async (data) => (await api.post('/brands', data)).data
export const updateBrand = async (id, data) => (await api.put('/brands/' + id, data)).data

// Facilities
export const getFacilities = async (params = {}) => (await api.get('/facilities', { params })).data
export const getFacility = async (id) => (await api.get('/facilities/' + id)).data
export const createFacility = async (data) => (await api.post('/facilities', data)).data
export const updateFacility = async (id, data) => (await api.put('/facilities/' + id, data)).data
export const deleteFacility = async (id) => (await api.delete('/facilities/' + id)).data
export const importFacilities = async (brandId, file) => {
  const fd = new FormData()
  fd.append('brand_id', brandId)
  fd.append('file', file)
  return (await api.post('/facilities/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}
export const uploadFacilityLogo = async (facilityId, file) => {
  const fd = new FormData()
  fd.append('file', file)
  return (await api.post(`/facilities/${facilityId}/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}
export const deleteFacilityLogo = async (facilityId) => (await api.delete(`/facilities/${facilityId}/logo`)).data
export const assignLogoToFacility = async (facilityId, assetId) => (await api.put(`/facilities/${facilityId}/assign-logo/${assetId}`)).data
export const updateFacilityCoordinates = async (facilityId, latitude, longitude) => (await api.put(`/facilities/${facilityId}`, { latitude, longitude })).data

// Templates (PPTX uploads)
export const getTemplates = async () => (await api.get('/templates')).data
export const uploadTemplate = async (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return (await api.post('/templates', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}
export const deleteTemplate = async (filename) => (await api.delete(`/templates/${encodeURIComponent(filename)}`)).data

// Assets
export const getAssets = async (params = {}) => (await api.get('/assets', { params })).data
export const uploadAsset = async (brandId, assetType, file) => {
  const fd = new FormData()
  fd.append('brand_id', brandId)
  fd.append('asset_type', assetType)
  fd.append('file', file)
  return (await api.post('/assets', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data
}
export const deleteAsset = async (id) => (await api.delete('/assets/' + id)).data

// Agenda Templates
export const getAgendaTemplates = async (params = {}) => (await api.get('/agenda-templates', { params })).data

// Content
export const getContent = async (brandId) => (await api.get('/content', { params: { brand_id: brandId } })).data
export const updateContent = async (id, data) => (await api.put('/content/' + id, data)).data

// Games
export const getGames = async (params = {}) => (await api.get('/games', { params })).data
export const createGame = async (data) => (await api.post('/games', data)).data
export const updateGame = async (id, data) => (await api.put('/games/' + id, data)).data
export const deleteGame = async (id) => (await api.delete('/games/' + id)).data

// Presentations
export const getPresentations = async (params = {}) => (await api.get('/presentations', { params })).data
export const getPresentation = async (id) => (await api.get('/presentations/' + id)).data
export const createPresentation = async (data) => (await api.post('/presentations', data)).data
export const updatePresentation = async (id, data) => (await api.put('/presentations/' + id, data)).data
export const deletePresentation = async (id) => (await api.delete('/presentations/' + id)).data

// Build slides
export const buildSlides = async (presentationId, config) => (await api.post(`/presentations/${presentationId}/build-slides`, config)).data

// Present mode
export const getPresentData = async (id) => (await api.get(`/presentations/${id}/present`)).data
export const markPresented = async (id) => (await api.post(`/presentations/${id}/mark-presented`)).data

// Export URLs
export const getExportPptxUrl = (id) => `/api/presentations/${id}/export/pptx`
export const getExportPdfUrl = (id) => `/api/presentations/${id}/export/pdf`

// Utility
export const formatDate = (isoString) => {
  if (!isoString) return '-'
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default api
