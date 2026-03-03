import { useEffect, useState } from 'react'
import { useApplication } from '../../hooks/useApplication'

function formatValue(value) {
  if (value == null || value === '') {
    return 'Not provided'
  }
  return String(value)
}

function ReviewRow({ label, value }) {
  return (
    <div className="review-row">
      <dt>{label}</dt>
      <dd>{formatValue(value)}</dd>
    </div>
  )
}

function ReviewSection({ title, onEdit, children }) {
  return (
    <section className="review-section card">
      <div className="review-header">
        <h3>{title}</h3>
        <button type="button" onClick={onEdit}>
          Edit
        </button>
      </div>
      <dl>{children}</dl>
    </section>
  )
}

function ReviewStep({ onEditStep, registerStepAction = null }) {
  const {
    application,
    submitApplication,
    isSubmitting,
    uiError,
    setUiError,
    clearUiError,
  } = useApplication()
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedESign, setAcceptedESign] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState('')

  const businessInfo = application?.businessInfo ?? {}
  const businessAddress = application?.businessAddress ?? {}
  const authorizedRep = application?.authorizedRep ?? {}
  const processingInfo = application?.processingInfo ?? {}
  const bankAccount = application?.bankAccount ?? {}

  const canSubmit = acceptedTerms && acceptedESign && !isSubmitting

  useEffect(() => {
    if (registerStepAction) {
      registerStepAction(null)
    }
  }, [registerStepAction])

  async function handleSubmit() {
    if (!application?.id) {
      setUiError('Create and save your application before submitting.')
      return
    }

    clearUiError()
    setSubmitSuccess('')

    try {
      await submitApplication(application.id)
      setSubmitSuccess('Application submitted successfully.')
    } catch (error) {
      setUiError(error?.message ?? 'Failed to submit application.')
    }
  }

  return (
    <section className="review-step">
      <h2>Step 6: Review &amp; Submit</h2>

      <ReviewSection title="Business Information" onEdit={() => onEditStep(0)}>
        <ReviewRow label="Legal Name" value={businessInfo.legalName} />
        <ReviewRow label="DBA Name" value={businessInfo.dbaName} />
        <ReviewRow label="EIN" value={businessInfo.ein} />
        <ReviewRow label="Business Type" value={businessInfo.businessType} />
        <ReviewRow
          label="State of Incorporation"
          value={businessInfo.stateOfIncorporation}
        />
        <ReviewRow label="Date of Formation" value={businessInfo.dateOfFormation} />
      </ReviewSection>

      <ReviewSection title="Business Address" onEdit={() => onEditStep(1)}>
        <ReviewRow label="Street Address" value={businessAddress.streetAddress} />
        <ReviewRow label="Suite/Unit" value={businessAddress.suiteUnit} />
        <ReviewRow label="City" value={businessAddress.city} />
        <ReviewRow label="State" value={businessAddress.state} />
        <ReviewRow label="ZIP Code" value={businessAddress.zipCode} />
        <ReviewRow label="Business Phone" value={businessAddress.phone} />
        <ReviewRow label="Business Email" value={businessAddress.email} />
        <ReviewRow label="Website URL" value={businessAddress.websiteUrl} />
      </ReviewSection>

      <ReviewSection title="Authorized Representative" onEdit={() => onEditStep(2)}>
        <ReviewRow label="Full Name" value={authorizedRep.fullName} />
        <ReviewRow label="Title" value={authorizedRep.title} />
        <ReviewRow label="SSN Last 4" value={authorizedRep.ssnLast4} />
        <ReviewRow label="Date of Birth" value={authorizedRep.dateOfBirth} />
        <ReviewRow label="Address" value={authorizedRep.address} />
        <ReviewRow label="Phone" value={authorizedRep.phone} />
        <ReviewRow label="Email" value={authorizedRep.email} />
      </ReviewSection>

      <ReviewSection title="Processing Information" onEdit={() => onEditStep(3)}>
        <ReviewRow label="Monthly Volume" value={processingInfo.monthlyVolume} />
        <ReviewRow label="Average Transaction" value={processingInfo.avgTransaction} />
        <ReviewRow label="MCC Code" value={processingInfo.mccCode} />
        <ReviewRow label="Current Processor" value={processingInfo.currentProcessor} />
      </ReviewSection>

      <ReviewSection title="Bank Account" onEdit={() => onEditStep(4)}>
        <ReviewRow label="Bank Name" value={bankAccount.bankName} />
        <ReviewRow label="Routing Number" value={bankAccount.routingNumber} />
        <ReviewRow label="Account Number" value={bankAccount.accountNumber} />
        <ReviewRow label="Account Type" value={bankAccount.accountType} />
      </ReviewSection>

      <section className="card review-consents">
        <h3>Consent</h3>
        <label htmlFor="acceptTerms">
          <input
            id="acceptTerms"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
          />
          I accept the Terms & Conditions.
        </label>

        <label htmlFor="acceptESign">
          <input
            id="acceptESign"
            type="checkbox"
            checked={acceptedESign}
            onChange={(event) => setAcceptedESign(event.target.checked)}
          />
          I consent to electronic signature.
        </label>

        <button type="button" disabled={!canSubmit} onClick={handleSubmit}>
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </button>
        {submitSuccess ? <p className="muted-text">{submitSuccess}</p> : null}
        {uiError ? <p className="error-text">{uiError}</p> : null}
      </section>
    </section>
  )
}

export default ReviewStep
