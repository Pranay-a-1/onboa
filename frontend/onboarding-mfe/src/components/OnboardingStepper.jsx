import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Snackbar,
  Step,
  StepConnector,
  StepLabel,
  Stepper,
  styled,
} from '@mui/material'
import StorefrontIcon from '@mui/icons-material/Storefront'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import BadgeIcon from '@mui/icons-material/Badge'
import PaymentsIcon from '@mui/icons-material/Payments'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useApplication } from '../hooks/useApplication'
import AuthRepStep from './steps/AuthRepStep'
import BankAccountStep from './steps/BankAccountStep'
import BusinessAddressStep from './steps/BusinessAddressStep'
import BusinessInfoStep from './steps/BusinessInfoStep'
import ProcessingInfoStep from './steps/ProcessingInfoStep'
import ReviewStep from './steps/ReviewStep'

const GlowConnector = styled(StepConnector)(() => ({
  '& .MuiStepConnector-line': {
    borderColor: 'rgba(148, 163, 184, 0.35)',
    borderTopWidth: 2,
    boxShadow: '0 0 0 transparent',
    transition: 'all 0.2s ease',
  },
  '&.Mui-active .MuiStepConnector-line, &.Mui-completed .MuiStepConnector-line': {
    borderColor: 'rgba(56, 189, 248, 0.85)',
    boxShadow: '0 0 14px rgba(56, 189, 248, 0.45)',
  },
}))

function OnboardingStepper() {
  const {
    application,
    activeStep,
    setActiveStep,
    isSaving,
    isSubmitting,
    clearUiError,
  } = useApplication()
  const [navigationMode, setNavigationMode] = useState('strict')
  const [notice, setNotice] = useState(null)
  const stepActionRef = useRef(null)

  const steps = useMemo(
    () => [
      { label: 'Business Info', component: BusinessInfoStep },
      { label: 'Business Address', component: BusinessAddressStep },
      { label: 'Authorized Rep', component: AuthRepStep },
      { label: 'Processing', component: ProcessingInfoStep },
      { label: 'Bank Account', component: BankAccountStep },
      { label: 'Review & Submit', component: ReviewStep },
    ],
    [],
  )

  const stepIcons = useMemo(
    () => ({
      1: StorefrontIcon,
      2: LocationOnIcon,
      3: BadgeIcon,
      4: PaymentsIcon,
      5: AccountBalanceIcon,
      6: FactCheckIcon,
    }),
    [],
  )

  const StepIconRenderer = useCallback(
    ({ active, completed, icon }) => {
      if (completed) {
        return <CheckCircleIcon fontSize="small" color="success" />
      }
      const IconComponent = stepIcons[String(icon)]
      return (
        <span className={active ? 'step-icon-active' : 'step-icon'}>
          {IconComponent ? <IconComponent fontSize="small" /> : icon}
        </span>
      )
    },
    [stepIcons],
  )

  const isFirstStep = activeStep <= 0
  const isReviewStep = activeStep >= steps.length - 1

  const registerStepAction = useCallback((fn) => {
    stepActionRef.current = fn
  }, [])

  const saveCurrentStep = useCallback(
    async ({ mode = navigationMode, autofill = false } = {}) => {
      clearUiError()
      if (!stepActionRef.current) {
        return { ok: true }
      }
      const result = await stepActionRef.current({ mode, autofill })
      return result ?? { ok: false }
    },
    [clearUiError, navigationMode],
  )

  async function handleNext() {
    const result = await saveCurrentStep({ mode: navigationMode })
    if (!result.ok) {
      setNotice({
        severity: 'warning',
        message:
          navigationMode === 'quick'
            ? 'Cannot continue yet. Fill at least the anchor required field for this step.'
            : 'Please fix validation errors before continuing.',
      })
      return
    }

    setActiveStep(activeStep + 1)
    setNotice({ severity: 'success', message: 'Step saved. Continuing...' })
  }

  async function handleBack() {
    if (isFirstStep) {
      return
    }

    const result = await saveCurrentStep({ mode: navigationMode })
    if (!result.ok) {
      setNotice({
        severity: 'warning',
        message: 'Current step could not be saved. Resolve issues before going back.',
      })
      return
    }

    setActiveStep(activeStep - 1)
  }

  async function handleSaveDraft() {
    const result = await saveCurrentStep({ mode: navigationMode })
    if (!result.ok) {
      setNotice({
        severity: 'error',
        message: 'Draft save failed. Please resolve validation errors first.',
      })
      return
    }

    setNotice({ severity: 'success', message: 'Draft saved.' })
  }

  async function handleAutoFillContinue() {
    const result = await saveCurrentStep({ mode: 'strict', autofill: true })
    if (!result.ok) {
      setNotice({
        severity: 'error',
        message: 'Auto-fill save failed for this step.',
      })
      return
    }

    if (!isReviewStep) {
      setActiveStep(activeStep + 1)
    }
    setNotice({
      severity: 'success',
      message: isReviewStep
        ? 'Step saved with demo values.'
        : 'Auto-filled, saved, and continued.',
    })
  }

  const activeStepConfig = steps[activeStep] ?? steps[0]
  const ActiveStepComponent = activeStepConfig.component

  return (
    <section className="stepper-root card">
      <header className="stepper-header">
        <h2>Merchant Onboarding</h2>
        <p className="muted-text">Status: {application?.status ?? 'NEW'}</p>
      </header>

      <Stepper
        activeStep={activeStep}
        alternativeLabel
        connector={<GlowConnector />}
        className="onboarding-stepper"
      >
        {steps.map((step, index) => (
          <Step key={step.label} completed={index < activeStep}>
            <StepLabel StepIconComponent={StepIconRenderer}>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <div className="step-mode-toggle">
        <span>Navigation Mode:</span>
        <button
          type="button"
          className={navigationMode === 'strict' ? 'mode-active' : ''}
          onClick={() => setNavigationMode('strict')}
        >
          Strict
        </button>
        <button
          type="button"
          className={navigationMode === 'quick' ? 'mode-active' : ''}
          onClick={() => setNavigationMode('quick')}
        >
          Quick Continue
        </button>
      </div>

      <div className="stepper-content">
        <ActiveStepComponent
          registerStepAction={registerStepAction}
          onEditStep={(stepIndex) => setActiveStep(stepIndex)}
        />
      </div>

      {!isReviewStep ? (
        <footer className="stepper-actions">
          <button type="button" disabled={isFirstStep || isSaving || isSubmitting} onClick={handleBack}>
            Back
          </button>
          <button type="button" disabled={isSaving || isSubmitting} onClick={handleSaveDraft}>
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button type="button" disabled={isSaving || isSubmitting} onClick={handleAutoFillContinue}>
            Auto-Fill &amp; Continue
          </button>
          <button type="button" disabled={isSaving || isSubmitting} onClick={handleNext}>
            {isSaving ? 'Saving...' : 'Next'}
          </button>
        </footer>
      ) : null}

      <Snackbar
        open={Boolean(notice)}
        autoHideDuration={3000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setNotice(null)} severity={notice?.severity ?? 'info'} variant="filled">
          {notice?.message}
        </Alert>
      </Snackbar>
    </section>
  )
}

export default OnboardingStepper
