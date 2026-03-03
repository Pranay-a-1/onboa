import ClientPortal from './components/ClientPortal'
import OnboardingStepper from './components/OnboardingStepper'
import { useApplication } from './hooks/useApplication'

const STEPPER_STATUSES = new Set(['DRAFT', 'REJECTED'])
const PORTAL_STATUSES = new Set(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'])

function OnboardingApp() {
  const { applicationStatus, isBootstrapping, bootstrapError, retryBootstrap } =
    useApplication()

  if (isBootstrapping) {
    return (
      <main className="app-shell">
        <section className="card">
          <h1>Merchant Onboarding</h1>
          <p>Loading your application...</p>
        </section>
      </main>
    )
  }

  if (bootstrapError) {
    return (
      <main className="app-shell">
        <section className="card">
          <h1>Merchant Onboarding</h1>
          <p className="error-text">
            Could not initialize onboarding: {bootstrapError}
          </p>
          <button type="button" onClick={retryBootstrap}>
            Retry
          </button>
        </section>
      </main>
    )
  }

  const shouldShowStepper =
    applicationStatus == null || STEPPER_STATUSES.has(applicationStatus)
  const shouldShowPortal = PORTAL_STATUSES.has(applicationStatus)

  return (
    <main className="app-shell">
      {shouldShowStepper ? <OnboardingStepper /> : null}
      {shouldShowPortal ? <ClientPortal /> : null}
      {!shouldShowStepper && !shouldShowPortal ? (
        <section className="card">
          <h1>Merchant Onboarding</h1>
          <p className="error-text">
            Unknown application status: {applicationStatus}
          </p>
        </section>
      ) : null}
    </main>
  )
}

export default OnboardingApp
