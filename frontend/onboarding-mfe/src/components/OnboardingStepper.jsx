import { useApplication } from '../hooks/useApplication'

function OnboardingStepper() {
  const {
    application,
    activeStep,
    createApplication,
    isCreating,
    isSaving,
    isSubmitting,
    uiError,
  } = useApplication()

  return (
    <section className="card">
      <h2>Onboarding Stepper</h2>
      <p>This placeholder will be replaced with the full stepper UI in TASK-15.</p>
      <p>
        <strong>Status:</strong> {application?.status ?? 'NEW'}
      </p>
      <p>
        <strong>Active step:</strong> {activeStep + 1}
      </p>
      {uiError ? <p className="error-text">{uiError}</p> : null}
      {!application?.id ? (
        <button
          type="button"
          onClick={() => {
            createApplication().catch(() => {})
          }}
          disabled={isCreating}
        >
          {isCreating ? 'Creating application...' : 'Create application'}
        </button>
      ) : (
        <div className="muted-text">
          Save/submit handlers are available in context for step components.
          {isSaving || isSubmitting ? ' A mutation is currently running.' : ''}
        </div>
      )}
    </section>
  )
}

export default OnboardingStepper
