import axios from 'axios'

/**
 * createApplicationApi
 *
 * Factory that returns onboarding application API methods bound to an
 * authenticated Axios client. We use a factory instead of a singleton so the
 * caller can pass Auth0's `getAccessTokenSilently` from React context safely.
 *
 * @param {() => Promise<string>} getAccessTokenSilently Auth0 token getter.
 * @returns {{
 *   create: () => Promise<any>,
 *   getMine: () => Promise<any>,
 *   getById: (id: string) => Promise<any>,
 *   saveStep: (id: string, stepNumber: number, data: Record<string, any>) => Promise<any>,
 *   submit: (id: string) => Promise<any>
 * }}
 */
export function createApplicationApi(getAccessTokenSilently) {
  if (typeof getAccessTokenSilently !== 'function') {
    throw new Error(
      'createApplicationApi requires a getAccessTokenSilently function from Auth0.',
    )
  }

  // Base API URL is environment-driven; never hardcode deploy URLs.
  const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

  const client = axios.create({
    baseURL: `${apiBaseUrl}/api/v1`,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Attach Bearer token to every request.
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
    // POST /api/v1/applications
    async create() {
      const response = await client.post('/applications')
      return response.data
    },

    // GET /api/v1/applications/me
    async getMine() {
      const response = await client.get('/applications/me')
      return response.data
    },

    // GET /api/v1/applications/{id}
    async getById(id) {
      if (!id) {
        throw new Error('getById requires a valid application id.')
      }
      const response = await client.get(`/applications/${id}`)
      return response.data
    },

    // PUT /api/v1/applications/{id}/step/{stepNumber}
    async saveStep(id, stepNumber, data) {
      if (!id) {
        throw new Error('saveStep requires a valid application id.')
      }
      if (!Number.isInteger(stepNumber) || stepNumber < 1 || stepNumber > 5) {
        throw new Error('saveStep requires stepNumber in the range 1..5.')
      }
      const response = await client.put(
        `/applications/${id}/step/${stepNumber}`,
        data ?? {},
      )
      return response.data
    },

    // POST /api/v1/applications/{id}/submit
    async submit(id) {
      if (!id) {
        throw new Error('submit requires a valid application id.')
      }
      const response = await client.post(`/applications/${id}/submit`)
      return response.data
    },
  }
}
