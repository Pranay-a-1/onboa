import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ApplicationList from './components/ApplicationList'
import ApplicationDetail from './components/ApplicationDetail'
import StatsCards from './components/StatsCards'
import './index.css'
import {
  createDashboardApi,
  DASHBOARD_QUERY_KEY_STATS,
  DASHBOARD_QUERY_ROOT,
  dashboardDetailQueryKey,
  dashboardListQueryKey,
} from './services/api'

function resolveTargetStatus(currentStatus, actionType) {
  // Backend transition rules: SUBMITTED -> UNDER_REVIEW -> APPROVED, with REJECTED from review states.
  if (actionType === 'REJECT') {
    return 'REJECTED'
  }

  if (actionType === 'APPROVE' && currentStatus === 'SUBMITTED') {
    return 'UNDER_REVIEW'
  }

  if (actionType === 'APPROVE' && currentStatus === 'UNDER_REVIEW') {
    return 'APPROVED'
  }

  return null
}

function DashboardAppContent() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0()
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedApplicationId, setSelectedApplicationId] = useState(null)
  const [uiMode, setUiMode] = useState('list')
  const [pendingAction, setPendingAction] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const queryClient = useQueryClient()

  const api = useMemo(() => {
    if (!isAuthenticated) {
      return null
    }
    return createDashboardApi(getAccessTokenSilently)
  }, [getAccessTokenSilently, isAuthenticated])

  const isApplicationsRoute = location.pathname.includes('/dashboard/applications')
  const selectedStatusParam = selectedStatus === 'ALL' ? null : selectedStatus
  const applicationsStatusParam = isApplicationsRoute ? selectedStatusParam : null

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

  const {
    data: applications,
    isLoading: isApplicationsLoading,
    error: applicationsError,
  } = useQuery({
    queryKey: dashboardListQueryKey(applicationsStatusParam),
    enabled: isAuthenticated && Boolean(api),
    retry: 1,
    queryFn: async () => {
      if (!api) {
        throw new Error('Cannot fetch dashboard applications before authentication.')
      }
      return api.getApplications(applicationsStatusParam ?? undefined)
    },
  })

  const safeApplications = Array.isArray(applications) ? applications : []
  const selectedStatusApplication = safeApplications.find(
    (application) => application.id === selectedApplicationId,
  )

  const handleViewDetail = (appId) => {
    if (!appId) {
      return
    }
    if (!isApplicationsRoute) {
      navigate('/dashboard/applications')
    }
    setSelectedApplicationId(appId)
    setUiMode('detail')
  }

  const {
    data: selectedApplication,
    isLoading: isDetailLoading,
    error: detailError,
  } = useQuery({
    queryKey: dashboardDetailQueryKey(selectedApplicationId),
    enabled: isAuthenticated && Boolean(api) && uiMode === 'detail' && Boolean(selectedApplicationId),
    retry: 1,
    queryFn: async () => {
      if (!api || !selectedApplicationId) {
        throw new Error('Cannot fetch application detail before selecting an item.')
      }

      return api.getApplication(selectedApplicationId)
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }) => {
      if (!api) {
        throw new Error('Cannot update application status before authentication.')
      }
      return api.updateStatus(id, status, notes)
    },
    onSuccess: async (updatedApplication, variables) => {
      // PRD DASH-07: simulate notification side-effect in browser console.
      console.log(
        `[Simulated Email] Application ${variables.id} status changed to ${variables.status}. Admin notes: ${
          variables.notes || 'None'
        }`,
      )

      // Keep server-state in sync across cards, list, and currently opened detail item.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY_STATS }),
        queryClient.invalidateQueries({
          queryKey: [...DASHBOARD_QUERY_ROOT, 'applications'],
        }),
        queryClient.invalidateQueries({
          queryKey: dashboardDetailQueryKey(updatedApplication?.id ?? selectedApplicationId),
        }),
      ])
    },
  })

  const closeDialog = () => {
    setIsDialogOpen(false)
    setPendingAction(null)
    setAdminNotes('')
  }

  const openActionDialog = (actionType) => {
    setPendingAction(actionType)
    setIsDialogOpen(true)
  }

  const handleConfirmAction = async () => {
    const application = selectedApplication ?? selectedStatusApplication
    const applicationId = application?.id
    const nextStatus = resolveTargetStatus(application?.status, pendingAction)

    if (!applicationId || !nextStatus) {
      return
    }

    await updateStatusMutation.mutateAsync({
      id: applicationId,
      status: nextStatus,
      notes: adminNotes.trim(),
    })
    closeDialog()
  }

  const actionPreviewStatus = resolveTargetStatus(
    (selectedApplication ?? selectedStatusApplication)?.status,
    pendingAction,
  )

  const openOverview = () => {
    setUiMode('list')
    navigate('/dashboard')
  }

  const openApplications = () => {
    setUiMode('list')
    navigate('/dashboard/applications')
  }

  if (uiMode === 'detail') {
    return (
      <main className="dashboard-shell">
        {isDetailLoading ? (
          <section className="application-list">
            <div className="application-list__loading" aria-live="polite">
              Loading application detail...
            </div>
          </section>
        ) : null}

        {detailError ? (
          <section className="application-list">
            <p className="application-list__error" role="alert">
              Could not load this application. Please go back and try again.
            </p>
            <button
              type="button"
              className="application-back-btn"
              onClick={() => setUiMode('list')}
            >
              Back to List
            </button>
          </section>
        ) : null}

        {!isDetailLoading && !detailError ? (
          <ApplicationDetail
            application={selectedApplication ?? selectedStatusApplication}
            isMutating={updateStatusMutation.isPending}
            onBack={() => setUiMode('list')}
            onApprove={() => openActionDialog('APPROVE')}
            onReject={() => openActionDialog('REJECT')}
          />
        ) : null}

        {isDialogOpen ? (
          <div className="dashboard-dialog-backdrop" role="presentation">
            <section
              className="dashboard-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="dashboard-action-dialog-title"
            >
              <h3 id="dashboard-action-dialog-title">
                Confirm {pendingAction === 'REJECT' ? 'Rejection' : 'Approval'}
              </h3>
              <p>
                {pendingAction === 'APPROVE'
                  ? `This will move the application to ${actionPreviewStatus ?? 'the next status'}.`
                  : 'This will reject the application.'}
              </p>
              <label className="dashboard-dialog__field" htmlFor="admin-notes">
                Admin Notes (Optional)
                <textarea
                  id="admin-notes"
                  rows={4}
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  placeholder="Add context for this decision"
                />
              </label>

              {updateStatusMutation.isError ? (
                <p className="application-list__error" role="alert">
                  Could not update status. Please try again.
                </p>
              ) : null}

              <div className="dashboard-dialog__actions">
                <button
                  type="button"
                  className="application-back-btn"
                  onClick={closeDialog}
                  disabled={updateStatusMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={
                    pendingAction === 'REJECT'
                      ? 'application-reject-btn'
                      : 'application-approve-btn'
                  }
                  onClick={handleConfirmAction}
                  disabled={updateStatusMutation.isPending || !actionPreviewStatus}
                >
                  {updateStatusMutation.isPending ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    )
  }

  return (
    <main className="dashboard-shell">
      <section className="dashboard-subnav" aria-label="Dashboard sections">
        <button
          type="button"
          className={`dashboard-subnav__btn ${!isApplicationsRoute ? 'is-active' : ''}`}
          onClick={openOverview}
        >
          Overview
        </button>
        <button
          type="button"
          className={`dashboard-subnav__btn ${isApplicationsRoute ? 'is-active' : ''}`}
          onClick={openApplications}
        >
          Applications
        </button>
      </section>

      {!isApplicationsRoute ? (
        <>
          <StatsCards
            stats={stats}
            isLoading={isStatsLoading}
            error={statsError}
          />
          <section className="dashboard-overview-card">
            <div>
              <h2>Applications Workspace</h2>
              <p>
                Use the applications section to filter by status and take approve/reject actions.
              </p>
            </div>
            <button
              type="button"
              className="application-view-btn"
              onClick={openApplications}
            >
              Open Applications
            </button>
          </section>
          <ApplicationList
            applications={safeApplications.slice(0, 5)}
            selectedStatus="ALL"
            onStatusChange={() => {}}
            onViewDetail={handleViewDetail}
            isLoading={isApplicationsLoading}
            error={applicationsError}
            title="Recent Applications"
            showFilter={false}
          />
        </>
      ) : (
        <ApplicationList
          applications={safeApplications}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onViewDetail={handleViewDetail}
          isLoading={isApplicationsLoading}
          error={applicationsError}
          title="Applications"
          showFilter
        />
      )}
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
