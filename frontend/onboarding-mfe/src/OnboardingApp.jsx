import { useMemo } from 'react'

/**
 * OnboardingApp (TASK-11 scaffold)
 *
 * This is the remote entry component exposed through module federation as:
 *   onboarding/OnboardingApp
 *
 * Task-11 goal is a stable remote scaffold + API layer.
 * Routing/state orchestration is intentionally deferred to TASK-12.
 */
function OnboardingApp() {
  // Keep the API base visible in dev to simplify environment troubleshooting.
  const apiBaseUrl = useMemo(
    () => import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
    [],
  )

  return (
    <main
      style={{
        minHeight: '100%',
        padding: '24px',
        color: '#e5e7eb',
        background:
          'radial-gradient(circle at 20% 10%, rgba(59,130,246,0.18), transparent 40%), #0b1220',
        borderRadius: '16px',
        border: '1px solid rgba(148,163,184,0.2)',
      }}
    >
      <h1 style={{ marginTop: 0, marginBottom: '8px' }}>Merchant Onboarding</h1>
      <p style={{ marginTop: 0, opacity: 0.85 }}>
        Remote module is connected. Stepper and portal flows will be added in TASK-12.
      </p>

      <section
        style={{
          marginTop: '20px',
          padding: '12px 14px',
          borderRadius: '10px',
          border: '1px solid rgba(148,163,184,0.3)',
          background: 'rgba(15,23,42,0.55)',
          fontFamily: 'monospace',
          fontSize: '14px',
        }}
      >
        <strong>API Base:</strong> {apiBaseUrl}
      </section>
    </main>
  )
}

export default OnboardingApp
