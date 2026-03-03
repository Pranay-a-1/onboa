import { useMemo, useReducer } from 'react'
import { useApplicationController } from '../hooks/useApplication'
import { ApplicationContext } from './ApplicationContext'
import {
  applicationReducer,
  initialApplicationUiState,
} from './applicationReducer'

function ApplicationProvider({ children }) {
  const [uiState, dispatch] = useReducer(
    applicationReducer,
    initialApplicationUiState,
  )

  const appState = useApplicationController({ uiState, dispatch })
  const value = useMemo(() => appState, [appState])

  return (
    <ApplicationContext.Provider value={value}>
      {children}
    </ApplicationContext.Provider>
  )
}

export default ApplicationProvider
