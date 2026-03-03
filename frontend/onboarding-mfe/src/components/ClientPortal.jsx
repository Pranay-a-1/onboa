import { useApplication } from '../hooks/useApplication'

function ClientPortal() {
  const { application, refetchApplication } = useApplication()

  return (
    <section className="card">
      <h2>Client Portal</h2>
      <p>This placeholder will be replaced with the full portal UI in TASK-16.</p>
      <p>
        <strong>Status:</strong> {application?.status ?? 'UNKNOWN'}
      </p>
      <p>
        <strong>Application ID:</strong> {application?.id ?? 'N/A'}
      </p>
      <button
        type="button"
        onClick={() => {
          refetchApplication().catch(() => {})
        }}
      >
        Refresh application
      </button>
    </section>
  )
}

export default ClientPortal
