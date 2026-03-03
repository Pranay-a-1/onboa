function formatSubmittedDate(value) {
  if (!value) {
    return '—'
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return '—'
  }

  return parsedDate.toLocaleDateString()
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'SUBMITTED':
      return 'application-status application-status--submitted'
    case 'UNDER_REVIEW':
      return 'application-status application-status--under-review'
    case 'APPROVED':
      return 'application-status application-status--approved'
    case 'REJECTED':
      return 'application-status application-status--rejected'
    default:
      return 'application-status application-status--default'
  }
}

function formatStatusLabel(status) {
  if (!status) {
    return 'Unknown'
  }
  return status.replaceAll('_', ' ')
}

function ApplicationList({
  applications,
  selectedStatus,
  onStatusChange,
  onViewDetail,
  isLoading,
  error,
  title = 'Applications',
  showFilter = true,
}) {
  return (
    <section className="application-list" aria-label="Application list">
      <div className="application-list__header">
        <h2>{title}</h2>
        {showFilter ? (
          <label className="application-list__filter" htmlFor="application-status-filter">
            <span>Status</span>
            <select
              id="application-status-filter"
              value={selectedStatus}
              onChange={(event) => onStatusChange(event.target.value)}
            >
              <option value="ALL">All</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>
        ) : null}
      </div>

      {error ? (
        <p className="application-list__error" role="alert">
          Could not load applications. Please refresh and try again.
        </p>
      ) : null}

      {isLoading ? (
        <div className="application-list__loading" aria-live="polite">
          Loading applications...
        </div>
      ) : null}

      {!isLoading && applications.length === 0 ? (
        <div className="application-list__empty" role="status">
          No applications match this filter.
        </div>
      ) : null}

      {!isLoading && applications.length > 0 ? (
        <div className="application-table-wrap">
          <table className="application-table">
            <thead>
              <tr>
                <th>Business Name</th>
                <th>EIN</th>
                <th>Status</th>
                <th>Submitted Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>{application?.businessInfo?.legalName ?? 'Not provided'}</td>
                  <td>{application?.businessInfo?.ein ?? '—'}</td>
                  <td>
                    <span className={getStatusBadgeClass(application.status)}>
                      {formatStatusLabel(application.status)}
                    </span>
                  </td>
                  <td>{formatSubmittedDate(application.submittedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="application-view-btn"
                      onClick={() => onViewDetail(application.id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

export default ApplicationList
