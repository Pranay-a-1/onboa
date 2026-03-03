import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import StatsCards from './components/StatsCards'
import './index.css'
import {
  createDashboardApi,
  DASHBOARD_QUERY_KEY_STATS,
} from './services/api'

function DashboardAppContent() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0()
  // Build the authenticated API client only after Auth0 session is ready.
  const api = useMemo(() => {
    if (!isAuthenticated) {
      return null
    }
    return createDashboardApi(getAccessTokenSilently)
  }, [getAccessTokenSilently, isAuthenticated])

  const {
    data: stats,
    isLoading: isStatsLoading,
    error: statsError,
  } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY_STATS,
    enabled: isAuthenticated && Boolean(api),
    retry: 1,
    queryFn: async () => {
      if (!api) {
        throw new Error('Cannot fetch dashboard stats before authentication.')
      }
      return api.getStats()
    },
  })

  return (
    <main className="dashboard-shell">
      <StatsCards
        stats={stats}
        isLoading={isStatsLoading}
        error={statsError}
      />
      <section className="dashboard-card">
        <h1>Admin Dashboard</h1>
        <p>Quick stats are powered by the admin stats API.</p>
      </section>
    </main>
  )
}

function DashboardApp() {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
    [],
  )

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardAppContent />
    </QueryClientProvider>
  )
}

export default DashboardApp
