import { useApplication } from '../hooks/useApplication'

const WORKFLOW_STATUSES = [
  { key: 'DRAFT', label: 'Draft' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
]

function formatValue(value) {
  if (value == null || value === '') {
    return 'Not provided'
  }
  return String(value)
}

function formatDate(value) {
  if (!value) {
    return 'Not available'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return String(value)
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function SummarySection({ title, fields }) {
  return (
    <details className="portal-accordion card" open>
      <summary>{title}</summary>
      <dl>
        {fields.map((field) => (
          <div key={field.label} className="review-row">
            <dt>{field.label}</dt>
            <dd>{formatValue(field.value)}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

function ClientPortal() {
  const { application, refetchApplication, setActiveStep } = useApplication()
  const status = application?.status ?? 'UNKNOWN'

  const currentStatusIndex = WORKFLOW_STATUSES.findIndex(
    (item) => item.key === status,
  )

  const businessInfo = application?.businessInfo ?? {}
  const businessAddress = application?.businessAddress ?? {}
  const authorizedRep = application?.authorizedRep ?? {}
  const processingInfo = application?.processingInfo ?? {}
  const bankAccount = application?.bankAccount ?? {}

  async function handleEditAndResubmit() {
    setActiveStep(0)
    await refetchApplication()
  }

  return (
    <section className="portal-root card">
      <header className="portal-header">
        <div>
          <h2>Client Portal</h2>
          <p className="muted-text">Track your merchant onboarding status and submitted details.</p>
        </div>
        <button type="button" onClick={() => refetchApplication().catch(() => {})}>
          Refresh
        </button>
      </header>

      <section className="card portal-status-card">
        <h3>Status Tracker</h3>
        <ol className="portal-status-tracker">
          {WORKFLOW_STATUSES.map((item, index) => {
            const isActive = status === item.key
            const isCompleted =
              currentStatusIndex >= 0 &&
              index <= currentStatusIndex &&
              item.key !== 'REJECTED' &&
              status !== 'REJECTED'
            return (
              <li
                key={item.key}
                className={[
                  isCompleted ? 'status-complete' : '',
                  isActive ? 'status-active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="status-dot" aria-hidden="true" />
                <span>{item.label}</span>
              </li>
            )
          })}
        </ol>
      </section>

      {status === 'APPROVED' ? (
        <section className="card portal-merchant-card">
          <h3>Merchant Account</h3>
          <div className="merchant-grid">
            <p>
              <strong>Merchant ID:</strong>{' '}
              <span className="merchant-badge">{formatValue(application?.merchantId)}</span>
            </p>
            <p>
              <strong>Approval Date:</strong> {formatDate(application?.updatedAt)}
            </p>
            <p>
              <strong>Account Status:</strong> Active
            </p>
          </div>
        </section>
      ) : null}

      {status === 'REJECTED' ? (
        <section className="card portal-rejection-card">
          <h3>Application Rejected</h3>
          <p>
            <strong>Admin Notes:</strong> {formatValue(application?.adminNotes)}
          </p>
          <button type="button" onClick={() => handleEditAndResubmit().catch(() => {})}>
            Edit &amp; Resubmit
          </button>
        </section>
      ) : null}

      {status === 'DRAFT' ? (
        <section className="card portal-draft-card">
          <h3>Draft in Progress</h3>
          <p className="muted-text">Your application is saved as draft. Continue from where you left off.</p>
          <button type="button" onClick={() => setActiveStep(0)}>
            Continue Application
          </button>
        </section>
      ) : null}

      <section className="portal-summary">
        <h3>Application Summary</h3>
        <SummarySection
          title="Business Information"
          fields={[
            { label: 'Legal Name', value: businessInfo.legalName },
            { label: 'DBA Name', value: businessInfo.dbaName },
            { label: 'EIN', value: businessInfo.ein },
            { label: 'Business Type', value: businessInfo.businessType },
            { label: 'State of Incorporation', value: businessInfo.stateOfIncorporation },
            { label: 'Date of Formation', value: businessInfo.dateOfFormation },
          ]}
        />
        <SummarySection
          title="Business Address"
          fields={[
            { label: 'Street Address', value: businessAddress.streetAddress },
            { label: 'Suite/Unit', value: businessAddress.suiteUnit },
            { label: 'City', value: businessAddress.city },
            { label: 'State', value: businessAddress.state },
            { label: 'ZIP Code', value: businessAddress.zipCode },
            { label: 'Business Phone', value: businessAddress.phone },
            { label: 'Business Email', value: businessAddress.email },
            { label: 'Website URL', value: businessAddress.websiteUrl },
          ]}
        />
        <SummarySection
          title="Authorized Representative"
          fields={[
            { label: 'Full Name', value: authorizedRep.fullName },
            { label: 'Title', value: authorizedRep.title },
            { label: 'SSN Last 4', value: authorizedRep.ssnLast4 },
            { label: 'Date of Birth', value: authorizedRep.dateOfBirth },
            { label: 'Address', value: authorizedRep.address },
            { label: 'Phone', value: authorizedRep.phone },
            { label: 'Email', value: authorizedRep.email },
          ]}
        />
        <SummarySection
          title="Processing Information"
          fields={[
            { label: 'Monthly Volume', value: processingInfo.monthlyVolume },
            { label: 'Average Transaction', value: processingInfo.avgTransaction },
            { label: 'MCC Code', value: processingInfo.mccCode },
            { label: 'Current Processor', value: processingInfo.currentProcessor },
          ]}
        />
        <SummarySection
          title="Bank Account"
          fields={[
            { label: 'Bank Name', value: bankAccount.bankName },
            { label: 'Routing Number', value: bankAccount.routingNumber },
            { label: 'Account Number', value: bankAccount.accountNumber },
            { label: 'Account Type', value: bankAccount.accountType },
          ]}
        />
      </section>
    </section>
  )
}

export default ClientPortal
