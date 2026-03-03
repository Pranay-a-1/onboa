import axios from 'axios'

export const DASHBOARD_QUERY_ROOT = ['dashboard']
export const DASHBOARD_QUERY_KEY_STATS = [...DASHBOARD_QUERY_ROOT, 'stats']
export const dashboardListQueryKey = (status = null) => [
  ...DASHBOARD_QUERY_ROOT,
  'applications',
  status ?? 'ALL',
]
export const dashboardDetailQueryKey = (id) => [
  ...DASHBOARD_QUERY_ROOT,
  'application',
  id,
]

export function createDashboardApi(getAccessTokenSilently) {
  if (typeof getAccessTokenSilently !== 'function') {
    throw new Error(
      'createDashboardApi requires a getAccessTokenSilently function from Auth0.',
    )
  }

  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
  const client = axios.create({
    baseURL: `${apiBaseUrl}/api/v1/admin/applications`,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  client.interceptors.request.use(async (config) => {
    const token = await getAccessTokenSilently()
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    }
  })

  return {
    async getApplications(status) {
      const response = await client.get('', {
        params: status ? { status } : undefined,
      })
      return response.data
    },

    async getApplication(id) {
      if (!id) {
        throw new Error('getApplication requires a valid application id.')
      }
      const response = await client.get(`/${id}`)
      return response.data
    },

    async updateStatus(id, status, notes) {
      if (!id) {
        throw new Error('updateStatus requires a valid application id.')
      }
      if (!status) {
        throw new Error('updateStatus requires a target status.')
      }

      const response = await client.put(`/${id}/status`, {
        status,
        adminNotes: notes ?? '',
      })
      return response.data
    },

    async getStats() {
      const response = await client.get('/stats')
      return response.data
    },
  }
}
