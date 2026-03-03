export const initialApplicationUiState = {
  activeStep: 0,
  isDraftDirty: false,
  uiError: null,
  bootstrapError: null,
}

export const APPLICATION_ACTIONS = {
  SET_ACTIVE_STEP: 'SET_ACTIVE_STEP',
  MARK_DRAFT_DIRTY: 'MARK_DRAFT_DIRTY',
  CLEAR_DRAFT_DIRTY: 'CLEAR_DRAFT_DIRTY',
  SET_UI_ERROR: 'SET_UI_ERROR',
  CLEAR_UI_ERROR: 'CLEAR_UI_ERROR',
  SET_BOOTSTRAP_ERROR: 'SET_BOOTSTRAP_ERROR',
  CLEAR_BOOTSTRAP_ERROR: 'CLEAR_BOOTSTRAP_ERROR',
  RESET_WORKFLOW: 'RESET_WORKFLOW',
}

export function applicationReducer(state, action) {
  switch (action.type) {
    case APPLICATION_ACTIONS.SET_ACTIVE_STEP:
      return {
        ...state,
        activeStep: Number.isInteger(action.payload) ? Math.max(action.payload, 0) : 0,
      }

    case APPLICATION_ACTIONS.MARK_DRAFT_DIRTY:
      return {
        ...state,
        isDraftDirty: true,
      }

    case APPLICATION_ACTIONS.CLEAR_DRAFT_DIRTY:
      return {
        ...state,
        isDraftDirty: false,
      }

    case APPLICATION_ACTIONS.SET_UI_ERROR:
      return {
        ...state,
        uiError: action.payload ?? 'Something went wrong.',
      }

    case APPLICATION_ACTIONS.CLEAR_UI_ERROR:
      return {
        ...state,
        uiError: null,
      }

    case APPLICATION_ACTIONS.SET_BOOTSTRAP_ERROR:
      return {
        ...state,
        bootstrapError: action.payload ?? 'Failed to initialize onboarding.',
      }

    case APPLICATION_ACTIONS.CLEAR_BOOTSTRAP_ERROR:
      return {
        ...state,
        bootstrapError: null,
      }

    case APPLICATION_ACTIONS.RESET_WORKFLOW:
      return {
        ...state,
        activeStep: 0,
        isDraftDirty: false,
        uiError: null,
      }

    default:
      return state
  }
}
