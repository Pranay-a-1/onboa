import { useAuth0 } from '@auth0/auth0-react'
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createApplicationApi } from '../services/api'
import { ApplicationContext } from '../state/ApplicationContext'
import { APPLICATION_ACTIONS } from '../state/applicationReducer'

export const APPLICATION_QUERY_ROOT = ['onboarding', 'application']
export const APPLICATION_QUERY_KEY_ME = [...APPLICATION_QUERY_ROOT, 'me']

const STEP_INDEX_BY_STATUS = {
  DRAFT: 0,
  SUBMITTED: 5,
  UNDER_REVIEW: 5,
  APPROVED: 5,
  REJECTED: 5,
}

export function useApplicationController({ uiState, dispatch }) {
  const queryClient = useQueryClient()
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0()
  const [syncAttempt, setSyncAttempt] = useState(0)
  const hasStartedSyncRef = useRef(false)

  const api = useMemo(() => {
    if (!isAuthenticated) {
      return null
    }
    return createApplicationApi(getAccessTokenSilently)
  }, [getAccessTokenSilently, isAuthenticated])

  const {
    mutateAsync: syncUserMutateAsync,
    reset: resetSyncUserMutation,
    isSuccess: isSyncUserSuccess,
    isPending: isSyncUserPending,
    error: syncUserError,
  } = useMutation({
    mutationFn: async () => {
      if (!api) {
        throw new Error('Authentication is required before syncing user.')
      }
      return api.syncUser()
    },
  })
  const isUserSynced =
    isSyncUserSuccess ||
    syncUserError?.response?.status === 409

  useEffect(() => {
    if (!isAuthenticated || !api) {
      hasStartedSyncRef.current = false
      return
    }
    if (hasStartedSyncRef.current) {
      return
    }

    let cancelled = false
    hasStartedSyncRef.current = true
    dispatch({ type: APPLICATION_ACTIONS.CLEAR_BOOTSTRAP_ERROR })

    syncUserMutateAsync()
      .then(() => {})
      .catch((error) => {
        if (!cancelled) {
          if (error?.response?.status === 409) {
            // Existing user conflicts are non-fatal for bootstrap.
            dispatch({ type: APPLICATION_ACTIONS.CLEAR_BOOTSTRAP_ERROR })
            return
          }
          dispatch({
            type: APPLICATION_ACTIONS.SET_BOOTSTRAP_ERROR,
            payload: error?.message ?? 'User sync failed.',
          })
          hasStartedSyncRef.current = false
        }
      })

    return () => {
      cancelled = true
      hasStartedSyncRef.current = false
    }
  }, [api, dispatch, isAuthenticated, syncAttempt, syncUserMutateAsync])

  const applicationQuery = useQuery({
    queryKey: APPLICATION_QUERY_KEY_ME,
    enabled: isAuthenticated && Boolean(api) && isUserSynced,
    retry: 1,
    queryFn: async () => {
      if (!api) {
        return null
      }
      try {
        return await api.getMine()
      } catch (error) {
        if (error?.response?.status === 404) {
          return null
        }
        throw error
      }
    },
  })

  useEffect(() => {
    const status = applicationQuery.data?.status
    if (!status) {
      return
    }
    const stepIndex = STEP_INDEX_BY_STATUS[status]
    if (Number.isInteger(stepIndex)) {
      dispatch({
        type: APPLICATION_ACTIONS.SET_ACTIVE_STEP,
        payload: stepIndex,
      })
    }
  }, [applicationQuery.data?.status, dispatch])

  const invalidateApplication = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: APPLICATION_QUERY_ROOT,
    })
  }, [queryClient])

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!api) {
        throw new Error('Unable to create application before authentication.')
      }
      return api.create()
    },
    onSuccess: async () => {
      await invalidateApplication()
    },
  })

  const saveStepMutation = useMutation({
    mutationFn: async ({ appId, stepNumber, data }) => {
      if (!api) {
        throw new Error('Unable to save step before authentication.')
      }
      return api.saveStep(appId, stepNumber, data)
    },
    onSuccess: async () => {
      dispatch({ type: APPLICATION_ACTIONS.CLEAR_DRAFT_DIRTY })
      dispatch({ type: APPLICATION_ACTIONS.CLEAR_UI_ERROR })
      await invalidateApplication()
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (appId) => {
      if (!api) {
        throw new Error('Unable to submit before authentication.')
      }
      return api.submit(appId)
    },
    onSuccess: async () => {
      dispatch({ type: APPLICATION_ACTIONS.CLEAR_UI_ERROR })
      await invalidateApplication()
    },
  })

  const retryBootstrap = useCallback(() => {
    dispatch({ type: APPLICATION_ACTIONS.CLEAR_BOOTSTRAP_ERROR })
    resetSyncUserMutation()
    hasStartedSyncRef.current = false
    setSyncAttempt((current) => current + 1)
  }, [dispatch, resetSyncUserMutation])

  const createApplication = useCallback(async () => {
    const created = await createMutation.mutateAsync()
    await applicationQuery.refetch()
    return created
  }, [applicationQuery, createMutation])

  const saveStep = useCallback(
    async ({ appId, stepNumber, data }) => {
      const resolvedAppId = appId ?? applicationQuery.data?.id
      if (!resolvedAppId) {
        throw new Error('No application id found. Create application first.')
      }
      dispatch({ type: APPLICATION_ACTIONS.MARK_DRAFT_DIRTY })
      const result = await saveStepMutation.mutateAsync({
        appId: resolvedAppId,
        stepNumber,
        data,
      })
      await applicationQuery.refetch()
      return result
    },
    [applicationQuery, dispatch, saveStepMutation],
  )

  const submitApplication = useCallback(
    async (appId) => {
      const resolvedAppId = appId ?? applicationQuery.data?.id
      if (!resolvedAppId) {
        throw new Error('No application id found. Create application first.')
      }
      const result = await submitMutation.mutateAsync(resolvedAppId)
      await applicationQuery.refetch()
      return result
    },
    [applicationQuery, submitMutation],
  )

  const setActiveStep = useCallback(
    (step) => {
      dispatch({ type: APPLICATION_ACTIONS.SET_ACTIVE_STEP, payload: step })
    },
    [dispatch],
  )

  const setUiError = useCallback(
    (message) => {
      dispatch({ type: APPLICATION_ACTIONS.SET_UI_ERROR, payload: message })
    },
    [dispatch],
  )

  const clearUiError = useCallback(() => {
    dispatch({ type: APPLICATION_ACTIONS.CLEAR_UI_ERROR })
  }, [dispatch])

  const application = applicationQuery.data ?? null
  const applicationStatus = application?.status ?? null

  return {
    user,
    application,
    applicationStatus,
    activeStep: uiState.activeStep,
    isDraftDirty: uiState.isDraftDirty,
    uiError: uiState.uiError,
    bootstrapError: uiState.bootstrapError,
    isBootstrapping:
      isAuthenticated &&
      (isSyncUserPending || (!isUserSynced && !uiState.bootstrapError) || applicationQuery.isLoading),
    isApplicationLoading: applicationQuery.isLoading,
    isCreating: createMutation.isPending,
    isSaving: saveStepMutation.isPending,
    isSubmitting: submitMutation.isPending,
    createApplication,
    saveStep,
    submitApplication,
    refetchApplication: applicationQuery.refetch,
    retryBootstrap,
    setActiveStep,
    setUiError,
    clearUiError,
  }
}

export function useApplication() {
  const context = useContext(ApplicationContext)
  if (!context) {
    throw new Error('useApplication must be used within an ApplicationProvider.')
  }
  return context
}
