function formatDateTime(value) {
  if (!value) {
    return '—'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '—'
  }

  return parsed.toLocaleString()
}

function formatStatusLabel(status) {
  if (!status) {
    return 'Unknown'
  }

  return status.replaceAll('_', ' ')
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

function fieldRows(fields) {
  // Render rows consistently across all 5 step sections.
  return fields.map(({ label, value }) => (
    <div key={label} className="detail-field">
      <dt>{label}</dt>
      <dd>{value || value === 0 ? String(value) : '—'}</dd>
    </div>
  ))
}

function isActionableStatus(status) {
  return status === 'SUBMITTED' || status === 'UNDER_REVIEW'
}

function ApplicationDetail({
  application,
  onBack,
  onApprove,
  onReject,
  isMutating,
}) {
  if (!application) {
    return null
  }

  const businessInfo = application.businessInfo ?? {}
  const businessAddress = application.businessAddress ?? {}
  const authorizedRep = application.authorizedRep ?? {}
  const processingInfo = application.processingInfo ?? {}
  const bankAccount = application.bankAccount ?? {}
  const showActions = isActionableStatus(application.status)

  return (
    <section className="application-detail" aria-label="Application detail">
      <header className="application-detail__header">
        <button type="button" className="application-back-btn" onClick={onBack}>
          Back to List
        </button>
        <span className={getStatusBadgeClass(application.status)}>
          {formatStatusLabel(application.status)}
        </span>
      </header>

      <div className="application-detail__meta">
        <h2>{businessInfo.legalName ?? 'Business application'}</h2>
        <p>Application ID: {application.id}</p>
        <p>Submitted: {formatDateTime(application.submittedAt)}</p>
        <p>Last Updated: {formatDateTime(application.updatedAt)}</p>
        {application.merchantId ? (
          <p className="application-detail__merchant-id">
            Merchant ID: {application.merchantId}
          </p>
        ) : null}
        {application.adminNotes ? (
          <p className="application-detail__notes">
            Admin Notes: {application.adminNotes}
          </p>
        ) : null}
      </div>

      <div className="application-detail__sections">
        <details open className="detail-accordion">
          <summary>Step 1: Business Information</summary>
          <dl className="detail-grid">
            {fieldRows([
              { label: 'Legal Name', value: businessInfo.legalName },
              { label: 'DBA Name', value: businessInfo.dbaName },
              { label: 'EIN', value: businessInfo.ein },
              { label: 'Business Type', value: businessInfo.businessType },
              {
                label: 'State of Incorporation',
                value: businessInfo.stateOfIncorporation,
              },
              { label: 'Date of Formation', value: businessInfo.dateOfFormation },
            ])}
          </dl>
        </details>

        <details className="detail-accordion">
          <summary>Step 2: Business Address & Contact</summary>
          <dl className="detail-grid">
            {fieldRows([
              { label: 'Street Address', value: businessAddress.streetAddress },
              { label: 'Suite/Unit', value: businessAddress.suiteUnit },
              { label: 'City', value: businessAddress.city },
              { label: 'State', value: businessAddress.state },
              { label: 'ZIP', value: businessAddress.zipCode },
              { label: 'Phone', value: businessAddress.phone },
              { label: 'Email', value: businessAddress.email },
              { label: 'Website', value: businessAddress.websiteUrl },
            ])}
          </dl>
        </details>

        <details className="detail-accordion">
          <summary>Step 3: Authorized Representative</summary>
          <dl className="detail-grid">
            {fieldRows([
              { label: 'Full Name', value: authorizedRep.fullName },
              { label: 'Title', value: authorizedRep.title },
              { label: 'SSN Last 4', value: authorizedRep.ssnLast4 },
              { label: 'Date of Birth', value: authorizedRep.dateOfBirth },
              { label: 'Address', value: authorizedRep.address },
              { label: 'Phone', value: authorizedRep.phone },
              { label: 'Email', value: authorizedRep.email },
            ])}
          </dl>
        </details>

        <details className="detail-accordion">
          <summary>Step 4: Processing Information</summary>
          <dl className="detail-grid">
            {fieldRows([
              { label: 'Monthly Volume', value: processingInfo.monthlyVolume },
              { label: 'Average Transaction', value: processingInfo.avgTransaction },
              { label: 'MCC Code', value: processingInfo.mccCode },
              { label: 'Current Processor', value: processingInfo.currentProcessor },
            ])}
          </dl>
        </details>

        <details className="detail-accordion">
          <summary>Step 5: Bank Account</summary>
          <dl className="detail-grid">
            {fieldRows([
              { label: 'Bank Name', value: bankAccount.bankName },
              { label: 'Routing Number', value: bankAccount.routingNumber },
              { label: 'Account Number', value: bankAccount.accountNumber },
              { label: 'Account Type', value: bankAccount.accountType },
            ])}
          </dl>
        </details>
      </div>

      {showActions ? (
        <footer className="application-detail__actions">
          <button
            type="button"
            className="application-reject-btn"
            onClick={onReject}
            disabled={isMutating}
          >
            Reject
          </button>
          <button
            type="button"
            className="application-approve-btn"
            onClick={onApprove}
            disabled={isMutating}
          >
            Approve
          </button>
        </footer>
      ) : null}
    </section>
  )
}

export default ApplicationDetail
