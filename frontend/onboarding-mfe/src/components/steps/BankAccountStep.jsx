import { useEffect, useMemo, useRef, useState } from 'react'
import { useApplication } from '../../hooks/useApplication'

const initialValues = {
  bankName: '',
  routingNumber: '',
  accountNumber: '',
  confirmAccountNumber: '',
  accountType: '',
}

function validateField(name, value, values) {
  const normalized = value.trim()

  switch (name) {
    case 'bankName':
      return normalized ? '' : 'Bank Name is required.'
    case 'routingNumber':
      if (!normalized) {
        return 'Routing Number is required.'
      }
      return /^\d{9}$/.test(normalized)
        ? ''
        : 'Routing Number must be exactly 9 digits.'
    case 'accountNumber':
      return normalized ? '' : 'Account Number is required.'
    case 'confirmAccountNumber':
      if (!normalized) {
        return 'Confirm Account Number is required.'
      }
      return normalized === values.accountNumber.trim()
        ? ''
        : 'Account Number confirmation does not match.'
    case 'accountType':
      return value ? '' : 'Account Type is required.'
    default:
      return ''
  }
}

function validateForm(values) {
  return {
    bankName: validateField('bankName', values.bankName, values),
    routingNumber: validateField('routingNumber', values.routingNumber, values),
    accountNumber: validateField('accountNumber', values.accountNumber, values),
    confirmAccountNumber: validateField(
      'confirmAccountNumber',
      values.confirmAccountNumber,
      values,
    ),
    accountType: validateField('accountType', values.accountType, values),
  }
}

function BankAccountStep() {
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

  const bankAccount = application?.bankAccount ?? null

  useEffect(() => {
    const appId = application?.id ?? null
    if (hydratedForAppId.current === appId) {
      return
    }

    hydratedForAppId.current = appId

    if (!bankAccount) {
      setFormValues(initialValues)
      setErrors({})
      setTouched({})
      setSuccessMessage('')
      return
    }

    setFormValues({
      bankName: bankAccount.bankName ?? '',
      routingNumber: bankAccount.routingNumber ?? '',
      accountNumber: bankAccount.accountNumber ?? '',
      confirmAccountNumber: bankAccount.accountNumber ?? '',
      accountType: bankAccount.accountType ?? '',
    })
    setErrors({})
    setTouched({})
    setSuccessMessage('')
  }, [application?.id, bankAccount])

  const hasVisibleErrors = useMemo(
    () => Object.values(errors).some(Boolean),
    [errors],
  )

  function handleChange(event) {
    const { name, value } = event.target
    const nextValue = name === 'routingNumber' ? value.replace(/\D/g, '').slice(0, 9) : value

    setFormValues((current) => {
      const next = {
        ...current,
        [name]: nextValue,
      }

      if (name === 'accountNumber' && touched.confirmAccountNumber) {
        setErrors((errorState) => ({
          ...errorState,
          confirmAccountNumber: validateField(
            'confirmAccountNumber',
            next.confirmAccountNumber,
            next,
          ),
        }))
      }

      return next
    })

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: validateField(name, nextValue, {
          ...formValues,
          [name]: nextValue,
        }),
      }))
    }

    if (successMessage) {
      setSuccessMessage('')
    }
  }

  function handleBlur(event) {
    const { name, value } = event.target
    const nextValue = name === 'routingNumber' ? value.replace(/\D/g, '').slice(0, 9) : value

    const nextValues = {
      ...formValues,
      [name]: nextValue,
    }

    setTouched((current) => ({ ...current, [name]: true }))
    setErrors((current) => ({
      ...current,
      [name]: validateField(name, nextValue, nextValues),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextTouched = {
      bankName: true,
      routingNumber: true,
      accountNumber: true,
      confirmAccountNumber: true,
      accountType: true,
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
        throw new Error('Unable to resolve application id for Step 5 save.')
      }

      await saveStep({
        appId,
        stepNumber: 5,
        data: {
          bankName: formValues.bankName.trim(),
          routingNumber: formValues.routingNumber.trim(),
          accountNumber: formValues.accountNumber.trim(),
          accountType: formValues.accountType,
        },
      })

      setSuccessMessage('Bank Account details saved.')
    } catch (error) {
      setUiError(error?.message ?? 'Failed to save Bank Account details.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="card">
      <h2>Step 5: Bank Account Details</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="bankName">Bank Name *</label>
          <input
            id="bankName"
            name="bankName"
            type="text"
            value={formValues.bankName}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="organization"
          />
          {touched.bankName && errors.bankName ? (
            <p className="error-text">{errors.bankName}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="routingNumber">Routing Number *</label>
          <input
            id="routingNumber"
            name="routingNumber"
            type="text"
            inputMode="numeric"
            maxLength={9}
            value={formValues.routingNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="9-digit ABA routing number"
            autoComplete="off"
          />
          {touched.routingNumber && errors.routingNumber ? (
            <p className="error-text">{errors.routingNumber}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="accountNumber">Account Number *</label>
          <input
            id="accountNumber"
            name="accountNumber"
            type="password"
            value={formValues.accountNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="off"
          />
          {touched.accountNumber && errors.accountNumber ? (
            <p className="error-text">{errors.accountNumber}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="confirmAccountNumber">Confirm Account Number *</label>
          <input
            id="confirmAccountNumber"
            name="confirmAccountNumber"
            type="password"
            value={formValues.confirmAccountNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="off"
          />
          {touched.confirmAccountNumber && errors.confirmAccountNumber ? (
            <p className="error-text">{errors.confirmAccountNumber}</p>
          ) : null}
        </div>

        <fieldset>
          <legend>Account Type *</legend>
          <label htmlFor="accountTypeChecking">
            <input
              id="accountTypeChecking"
              type="radio"
              name="accountType"
              value="Checking"
              checked={formValues.accountType === 'Checking'}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            Checking
          </label>
          <label htmlFor="accountTypeSavings">
            <input
              id="accountTypeSavings"
              type="radio"
              name="accountType"
              value="Savings"
              checked={formValues.accountType === 'Savings'}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            Savings
          </label>
          {touched.accountType && errors.accountType ? (
            <p className="error-text">{errors.accountType}</p>
          ) : null}
        </fieldset>

        <div>
          <button
            type="submit"
            disabled={isCreating || isSaving || isSubmitting}
          >
            {isCreating || isSaving || isSubmitting
              ? 'Saving...'
              : 'Save Bank Account'}
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

export default BankAccountStep
