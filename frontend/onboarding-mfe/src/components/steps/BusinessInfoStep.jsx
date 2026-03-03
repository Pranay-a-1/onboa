import { useEffect, useMemo, useRef, useState } from 'react'
import { useApplication } from '../../hooks/useApplication'

const BUSINESS_TYPES = [
  'LLC',
  'Corporation',
  'Sole Proprietorship',
  'Partnership',
  'Non-Profit',
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

const initialValues = {
  legalName: '',
  dbaName: '',
  ein: '',
  businessType: '',
  stateOfIncorporation: '',
  dateOfFormation: '',
}

function validateField(name, value) {
  switch (name) {
    case 'legalName':
      return value.trim() ? '' : 'Legal Business Name is required.'
    case 'ein': {
      const normalized = value.trim()
      if (!normalized) {
        return 'EIN is required.'
      }
      return /^\d{2}-\d{7}$/.test(normalized)
        ? ''
        : 'EIN must be in XX-XXXXXXX format.'
    }
    case 'businessType':
      return value ? '' : 'Business Type is required.'
    case 'stateOfIncorporation':
      return value ? '' : 'State of Incorporation is required.'
    case 'dateOfFormation':
      return value ? '' : 'Date of Formation is required.'
    default:
      return ''
  }
}

function validateForm(values) {
  return {
    legalName: validateField('legalName', values.legalName),
    ein: validateField('ein', values.ein),
    businessType: validateField('businessType', values.businessType),
    stateOfIncorporation: validateField(
      'stateOfIncorporation',
      values.stateOfIncorporation,
    ),
    dateOfFormation: validateField('dateOfFormation', values.dateOfFormation),
  }
}

function BusinessInfoStep() {
  const {
    application,
    createApplication,
    saveStep,
    isCreating,
    isSaving,
    uiError,
    setUiError,
    clearUiError,
  } = useApplication()

  const [formValues, setFormValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hydratedForAppId = useRef(null)

  const businessInfo = application?.businessInfo ?? null

  useEffect(() => {
    const appId = application?.id ?? null
    if (hydratedForAppId.current === appId) {
      return
    }

    hydratedForAppId.current = appId

    if (!businessInfo) {
      setFormValues(initialValues)
      setErrors({})
      setTouched({})
      setSuccessMessage('')
      return
    }

    setFormValues({
      legalName: businessInfo.legalName ?? '',
      dbaName: businessInfo.dbaName ?? '',
      ein: businessInfo.ein ?? '',
      businessType: businessInfo.businessType ?? '',
      stateOfIncorporation: businessInfo.stateOfIncorporation ?? '',
      dateOfFormation: businessInfo.dateOfFormation ?? '',
    })
    setErrors({})
    setTouched({})
    setSuccessMessage('')
  }, [application?.id, businessInfo])

  const hasVisibleErrors = useMemo(
    () => Object.values(errors).some(Boolean),
    [errors],
  )

  function handleChange(event) {
    const { name, value } = event.target
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }))

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: validateField(name, value),
      }))
    }

    if (successMessage) {
      setSuccessMessage('')
    }
  }

  function handleBlur(event) {
    const { name, value } = event.target
    setTouched((current) => ({ ...current, [name]: true }))
    setErrors((current) => ({
      ...current,
      [name]: validateField(name, value),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextTouched = {
      legalName: true,
      ein: true,
      businessType: true,
      stateOfIncorporation: true,
      dateOfFormation: true,
    }
    setTouched(nextTouched)

    const validationErrors = validateForm(formValues)
    setErrors(validationErrors)

    const hasError = Object.values(validationErrors).some(Boolean)
    if (hasError) {
      return
    }

    setIsSubmitting(true)
    setSuccessMessage('')
    clearUiError()

    try {
      let appId = application?.id
      if (!appId) {
        const created = await createApplication()
        appId = created?.id
      }

      if (!appId) {
        throw new Error('Unable to resolve application id for Step 1 save.')
      }

      await saveStep({
        appId,
        stepNumber: 1,
        data: {
          legalName: formValues.legalName.trim(),
          dbaName: formValues.dbaName.trim(),
          ein: formValues.ein.trim(),
          businessType: formValues.businessType,
          stateOfIncorporation: formValues.stateOfIncorporation,
          dateOfFormation: formValues.dateOfFormation,
        },
      })

      setSuccessMessage('Business Information saved.')
    } catch (error) {
      setUiError(error?.message ?? 'Failed to save Business Information.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="card">
      <h2>Step 1: Business Information</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="legalName">Legal Business Name *</label>
          <input
            id="legalName"
            name="legalName"
            type="text"
            value={formValues.legalName}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="organization"
          />
          {touched.legalName && errors.legalName ? (
            <p className="error-text">{errors.legalName}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="dbaName">DBA (Doing Business As)</label>
          <input
            id="dbaName"
            name="dbaName"
            type="text"
            value={formValues.dbaName}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <div>
          <label htmlFor="ein">EIN *</label>
          <input
            id="ein"
            name="ein"
            type="text"
            placeholder="12-3456789"
            inputMode="numeric"
            value={formValues.ein}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.ein && errors.ein ? (
            <p className="error-text">{errors.ein}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="businessType">Business Type *</label>
          <select
            id="businessType"
            name="businessType"
            value={formValues.businessType}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            <option value="">Select business type</option>
            {BUSINESS_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {touched.businessType && errors.businessType ? (
            <p className="error-text">{errors.businessType}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="stateOfIncorporation">State of Incorporation *</label>
          <select
            id="stateOfIncorporation"
            name="stateOfIncorporation"
            value={formValues.stateOfIncorporation}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            <option value="">Select state</option>
            {US_STATES.map((stateCode) => (
              <option key={stateCode} value={stateCode}>
                {stateCode}
              </option>
            ))}
          </select>
          {touched.stateOfIncorporation && errors.stateOfIncorporation ? (
            <p className="error-text">{errors.stateOfIncorporation}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="dateOfFormation">Date of Formation *</label>
          <input
            id="dateOfFormation"
            name="dateOfFormation"
            type="date"
            value={formValues.dateOfFormation}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.dateOfFormation && errors.dateOfFormation ? (
            <p className="error-text">{errors.dateOfFormation}</p>
          ) : null}
        </div>

        <div>
          <button
            type="submit"
            disabled={isCreating || isSaving || isSubmitting}
          >
            {isCreating || isSaving || isSubmitting
              ? 'Saving...'
              : 'Save Business Information'}
          </button>
        </div>

        {successMessage ? <p className="muted-text">{successMessage}</p> : null}
        {hasVisibleErrors ? (
          <p className="error-text">Please fix validation errors before saving.</p>
        ) : null}
        {uiError ? <p className="error-text">{uiError}</p> : null}
      </form>
    </section>
  )
}

export default BusinessInfoStep
