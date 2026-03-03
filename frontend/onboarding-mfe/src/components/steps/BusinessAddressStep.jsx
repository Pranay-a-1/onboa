import { useEffect, useMemo, useRef, useState } from 'react'
import { useApplication } from '../../hooks/useApplication'

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

const initialValues = {
  streetAddress: '',
  suiteUnit: '',
  city: '',
  state: '',
  zipCode: '',
  phone: '',
  email: '',
  websiteUrl: '',
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidUsPhone(value) {
  return /^(?:\+1\s?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}$/.test(
    value.trim(),
  )
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function validateField(name, value) {
  const normalized = value.trim()

  switch (name) {
    case 'streetAddress':
      return normalized ? '' : 'Street Address is required.'
    case 'city':
      return normalized ? '' : 'City is required.'
    case 'state':
      return value ? '' : 'State is required.'
    case 'zipCode':
      if (!normalized) {
        return 'ZIP Code is required.'
      }
      return /^\d{5}(?:-\d{4})?$/.test(normalized)
        ? ''
        : 'ZIP Code must be 5 digits or 9-digit ZIP+4 format.'
    case 'phone':
      if (!normalized) {
        return 'Business Phone is required.'
      }
      return isValidUsPhone(normalized)
        ? ''
        : 'Business Phone must be a valid US phone number.'
    case 'email':
      if (!normalized) {
        return 'Business Email is required.'
      }
      return isValidEmail(normalized)
        ? ''
        : 'Business Email must be a valid email address.'
    case 'websiteUrl':
      if (!normalized) {
        return ''
      }
      return isValidUrl(normalized)
        ? ''
        : 'Website URL must be a valid http(s) URL.'
    default:
      return ''
  }
}

function validateForm(values) {
  return {
    streetAddress: validateField('streetAddress', values.streetAddress),
    city: validateField('city', values.city),
    state: validateField('state', values.state),
    zipCode: validateField('zipCode', values.zipCode),
    phone: validateField('phone', values.phone),
    email: validateField('email', values.email),
    websiteUrl: validateField('websiteUrl', values.websiteUrl),
  }
}

function BusinessAddressStep() {
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

  const businessAddress = application?.businessAddress ?? null

  useEffect(() => {
    const appId = application?.id ?? null
    if (hydratedForAppId.current === appId) {
      return
    }

    hydratedForAppId.current = appId

    if (!businessAddress) {
      setFormValues(initialValues)
      setErrors({})
      setTouched({})
      setSuccessMessage('')
      return
    }

    setFormValues({
      streetAddress: businessAddress.streetAddress ?? '',
      suiteUnit: businessAddress.suiteUnit ?? '',
      city: businessAddress.city ?? '',
      state: businessAddress.state ?? '',
      zipCode: businessAddress.zipCode ?? '',
      phone: businessAddress.phone ?? '',
      email: businessAddress.email ?? '',
      websiteUrl: businessAddress.websiteUrl ?? '',
    })
    setErrors({})
    setTouched({})
    setSuccessMessage('')
  }, [application?.id, businessAddress])

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
      streetAddress: true,
      city: true,
      state: true,
      zipCode: true,
      phone: true,
      email: true,
      websiteUrl: true,
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
        throw new Error('Unable to resolve application id for Step 2 save.')
      }

      await saveStep({
        appId,
        stepNumber: 2,
        data: {
          streetAddress: formValues.streetAddress.trim(),
          suiteUnit: formValues.suiteUnit.trim(),
          city: formValues.city.trim(),
          state: formValues.state,
          zipCode: formValues.zipCode.trim(),
          phone: formValues.phone.trim(),
          email: formValues.email.trim(),
          websiteUrl: formValues.websiteUrl.trim(),
        },
      })

      setSuccessMessage('Business Address saved.')
    } catch (error) {
      setUiError(error?.message ?? 'Failed to save Business Address.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="card">
      <h2>Step 2: Business Address &amp; Contact</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="streetAddress">Street Address *</label>
          <input
            id="streetAddress"
            name="streetAddress"
            type="text"
            value={formValues.streetAddress}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="street-address"
          />
          {touched.streetAddress && errors.streetAddress ? (
            <p className="error-text">{errors.streetAddress}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="suiteUnit">Suite/Unit</label>
          <input
            id="suiteUnit"
            name="suiteUnit"
            type="text"
            value={formValues.suiteUnit}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>

        <div>
          <label htmlFor="city">City *</label>
          <input
            id="city"
            name="city"
            type="text"
            value={formValues.city}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="address-level2"
          />
          {touched.city && errors.city ? (
            <p className="error-text">{errors.city}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="state">State *</label>
          <select
            id="state"
            name="state"
            value={formValues.state}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="address-level1"
          >
            <option value="">Select state</option>
            {US_STATES.map((stateCode) => (
              <option key={stateCode} value={stateCode}>
                {stateCode}
              </option>
            ))}
          </select>
          {touched.state && errors.state ? (
            <p className="error-text">{errors.state}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="zipCode">ZIP Code *</label>
          <input
            id="zipCode"
            name="zipCode"
            type="text"
            value={formValues.zipCode}
            onChange={handleChange}
            onBlur={handleBlur}
            inputMode="numeric"
            placeholder="12345 or 12345-6789"
            autoComplete="postal-code"
          />
          {touched.zipCode && errors.zipCode ? (
            <p className="error-text">{errors.zipCode}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="phone">Business Phone *</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formValues.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="(555) 123-4567"
            autoComplete="tel"
          />
          {touched.phone && errors.phone ? (
            <p className="error-text">{errors.phone}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="email">Business Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formValues.email}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="email"
          />
          {touched.email && errors.email ? (
            <p className="error-text">{errors.email}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="websiteUrl">Website URL</label>
          <input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            value={formValues.websiteUrl}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="https://example.com"
          />
          {touched.websiteUrl && errors.websiteUrl ? (
            <p className="error-text">{errors.websiteUrl}</p>
          ) : null}
        </div>

        <div>
          <button
            type="submit"
            disabled={isCreating || isSaving || isSubmitting}
          >
            {isCreating || isSaving || isSubmitting
              ? 'Saving...'
              : 'Save Business Address'}
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

export default BusinessAddressStep
