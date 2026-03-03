import { useEffect, useMemo, useRef, useState } from 'react'
import { useApplication } from '../../hooks/useApplication'

const initialValues = {
  fullName: '',
  title: '',
  ssnLast4: '',
  dateOfBirth: '',
  address: '',
  phone: '',
  email: '',
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidUsPhone(value) {
  return /^(?:\+1\s?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}$/.test(
    value.trim(),
  )
}

function isAdultDate(value) {
  if (!value) {
    return false
  }

  const dob = new Date(value)
  if (Number.isNaN(dob.getTime())) {
    return false
  }

  const today = new Date()
  const cutoff = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  )

  return dob <= cutoff
}

function validateField(name, value) {
  const normalized = value.trim()

  switch (name) {
    case 'fullName':
      return normalized ? '' : 'Full Name is required.'
    case 'title':
      return normalized ? '' : 'Title is required.'
    case 'ssnLast4':
      if (!normalized) {
        return 'SSN last 4 is required.'
      }
      return /^\d{4}$/.test(normalized)
        ? ''
        : 'SSN last 4 must be exactly 4 digits.'
    case 'dateOfBirth':
      if (!value) {
        return 'Date of Birth is required.'
      }
      return isAdultDate(value)
        ? ''
        : 'Authorized Representative must be at least 18 years old.'
    case 'address':
      return normalized ? '' : 'Address is required.'
    case 'phone':
      if (!normalized) {
        return 'Phone Number is required.'
      }
      return isValidUsPhone(normalized)
        ? ''
        : 'Phone Number must be a valid US phone number.'
    case 'email':
      if (!normalized) {
        return 'Email is required.'
      }
      return isValidEmail(normalized)
        ? ''
        : 'Email must be a valid email address.'
    default:
      return ''
  }
}

function validateForm(values) {
  return {
    fullName: validateField('fullName', values.fullName),
    title: validateField('title', values.title),
    ssnLast4: validateField('ssnLast4', values.ssnLast4),
    dateOfBirth: validateField('dateOfBirth', values.dateOfBirth),
    address: validateField('address', values.address),
    phone: validateField('phone', values.phone),
    email: validateField('email', values.email),
  }
}

function AuthRepStep() {
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

  const authorizedRep = application?.authorizedRep ?? null

  useEffect(() => {
    const appId = application?.id ?? null
    if (hydratedForAppId.current === appId) {
      return
    }

    hydratedForAppId.current = appId

    if (!authorizedRep) {
      setFormValues(initialValues)
      setErrors({})
      setTouched({})
      setSuccessMessage('')
      return
    }

    setFormValues({
      fullName: authorizedRep.fullName ?? '',
      title: authorizedRep.title ?? '',
      ssnLast4: authorizedRep.ssnLast4 ?? '',
      dateOfBirth: authorizedRep.dateOfBirth ?? '',
      address: authorizedRep.address ?? '',
      phone: authorizedRep.phone ?? '',
      email: authorizedRep.email ?? '',
    })
    setErrors({})
    setTouched({})
    setSuccessMessage('')
  }, [application?.id, authorizedRep])

  const hasVisibleErrors = useMemo(
    () => Object.values(errors).some(Boolean),
    [errors],
  )

  function handleChange(event) {
    const { name, value } = event.target
    const nextValue = name === 'ssnLast4' ? value.replace(/\D/g, '').slice(0, 4) : value

    setFormValues((current) => ({
      ...current,
      [name]: nextValue,
    }))

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: validateField(name, nextValue),
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
      fullName: true,
      title: true,
      ssnLast4: true,
      dateOfBirth: true,
      address: true,
      phone: true,
      email: true,
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
        throw new Error('Unable to resolve application id for Step 3 save.')
      }

      await saveStep({
        appId,
        stepNumber: 3,
        data: {
          fullName: formValues.fullName.trim(),
          title: formValues.title.trim(),
          ssnLast4: formValues.ssnLast4.trim(),
          dateOfBirth: formValues.dateOfBirth,
          address: formValues.address.trim(),
          phone: formValues.phone.trim(),
          email: formValues.email.trim(),
        },
      })

      setSuccessMessage('Authorized Representative details saved.')
    } catch (error) {
      setUiError(error?.message ?? 'Failed to save Authorized Representative.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="card">
      <h2>Step 3: Authorized Representative</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="fullName">Full Name *</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formValues.fullName}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="name"
          />
          {touched.fullName && errors.fullName ? (
            <p className="error-text">{errors.fullName}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="title">Title / Designation *</label>
          <input
            id="title"
            name="title"
            type="text"
            value={formValues.title}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.title && errors.title ? (
            <p className="error-text">{errors.title}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="ssnLast4">SSN (Last 4 Digits) *</label>
          <input
            id="ssnLast4"
            name="ssnLast4"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={formValues.ssnLast4}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="off"
          />
          {touched.ssnLast4 && errors.ssnLast4 ? (
            <p className="error-text">{errors.ssnLast4}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="dateOfBirth">Date of Birth *</label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            value={formValues.dateOfBirth}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {touched.dateOfBirth && errors.dateOfBirth ? (
            <p className="error-text">{errors.dateOfBirth}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="address">Address *</label>
          <input
            id="address"
            name="address"
            type="text"
            value={formValues.address}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Street, City, State, ZIP"
          />
          {touched.address && errors.address ? (
            <p className="error-text">{errors.address}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="phone">Phone Number *</label>
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
          <label htmlFor="email">Email *</label>
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
          <button
            type="submit"
            disabled={isCreating || isSaving || isSubmitting}
          >
            {isCreating || isSaving || isSubmitting
              ? 'Saving...'
              : 'Save Authorized Representative'}
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

export default AuthRepStep
