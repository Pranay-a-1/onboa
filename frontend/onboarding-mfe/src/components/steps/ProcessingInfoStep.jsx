import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApplication } from '../../hooks/useApplication'
import { autofillProcessingInfo } from '../../utils/demoAutofill'

const MCC_OPTIONS = [
  { code: '0742', label: 'Veterinary Services' },
  { code: '1520', label: 'General Contractors' },
  { code: '1711', label: 'Air Conditioning Contractors' },
  { code: '1731', label: 'Electrical Contractors' },
  { code: '1750', label: 'Carpentry Contractors' },
  { code: '1799', label: 'Special Trade Contractors' },
  { code: '4111', label: 'Transportation Services' },
  { code: '4121', label: 'Taxicabs and Limousines' },
  { code: '4789', label: 'Transportation Services (Misc.)' },
  { code: '4814', label: 'Telecommunication Services' },
  { code: '4899', label: 'Cable and Other Pay TV Services' },
  { code: '5045', label: 'Computers and Peripherals' },
  { code: '5072', label: 'Hardware Equipment' },
  { code: '5192', label: 'Books and Periodicals' },
  { code: '5311', label: 'Department Stores' },
  { code: '5331', label: 'Variety Stores' },
  { code: '5399', label: 'General Merchandise Stores' },
  { code: '5411', label: 'Grocery Stores and Supermarkets' },
  { code: '5499', label: 'Miscellaneous Food Stores' },
  { code: '5541', label: 'Service Stations' },
  { code: '5651', label: 'Family Clothing Stores' },
  { code: '5691', label: 'Men and Womens Clothing Stores' },
  { code: '5732', label: 'Electronics Stores' },
  { code: '5812', label: 'Eating Places and Restaurants' },
  { code: '5814', label: 'Fast Food Restaurants' },
  { code: '5912', label: 'Drug Stores and Pharmacies' },
  { code: '5941', label: 'Sporting Goods Stores' },
  { code: '5942', label: 'Book Stores' },
  { code: '5944', label: 'Jewelry Stores' },
  { code: '5945', label: 'Toy and Hobby Shops' },
  { code: '5999', label: 'Miscellaneous Retail Stores' },
  { code: '7011', label: 'Lodging and Hotels' },
  { code: '7230', label: 'Beauty and Barber Shops' },
  { code: '7299', label: 'Miscellaneous Personal Services' },
  { code: '7372', label: 'Computer Programming Services' },
  { code: '7392', label: 'Consulting and Public Relations' },
  { code: '7991', label: 'Tourist Attractions and Exhibits' },
  { code: '7997', label: 'Membership Clubs' },
  { code: '8011', label: 'Doctors and Physicians' },
  { code: '8021', label: 'Dentists and Orthodontists' },
  { code: '8099', label: 'Medical Services and Health Practitioners' },
  { code: '8111', label: 'Legal Services and Attorneys' },
  { code: '8211', label: 'Elementary and Secondary Schools' },
  { code: '8299', label: 'Schools and Educational Services' },
  { code: '8641', label: 'Civic and Social Associations' },
]

const MCC_SET = new Set(MCC_OPTIONS.map((option) => option.code))

const initialValues = {
  monthlyVolume: '',
  avgTransaction: '',
  mccCode: '',
  currentProcessor: '',
}

function normalizeMccCode(value) {
  const normalized = value.trim()
  const match = normalized.match(/^(\d{4})/)
  return match ? match[1] : normalized
}

function validateField(name, value) {
  const normalized = value.trim()

  switch (name) {
    case 'monthlyVolume':
      if (!normalized) {
        return 'Estimated Monthly Card Volume is required.'
      }
      return Number(normalized) > 0
        ? ''
        : 'Estimated Monthly Card Volume must be greater than 0.'
    case 'avgTransaction':
      if (!normalized) {
        return 'Average Transaction Amount is required.'
      }
      return Number(normalized) > 0
        ? ''
        : 'Average Transaction Amount must be greater than 0.'
    case 'mccCode': {
      if (!normalized) {
        return 'Industry / MCC Code is required.'
      }
      const code = normalizeMccCode(normalized)
      if (!/^\d{4}$/.test(code)) {
        return 'MCC Code must be a 4-digit code.'
      }
      return MCC_SET.has(code)
        ? ''
        : 'Select a valid MCC Code from the list.'
    }
    default:
      return ''
  }
}

function validateForm(values) {
  return {
    monthlyVolume: validateField('monthlyVolume', values.monthlyVolume),
    avgTransaction: validateField('avgTransaction', values.avgTransaction),
    mccCode: validateField('mccCode', values.mccCode),
  }
}

function ProcessingInfoStep({ registerStepAction = null }) {
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

  const processingInfo = application?.processingInfo ?? null

  useEffect(() => {
    const appId = application?.id ?? null
    if (hydratedForAppId.current === appId) {
      return
    }

    hydratedForAppId.current = appId

    if (!processingInfo) {
      setFormValues(initialValues)
      setErrors({})
      setTouched({})
      setSuccessMessage('')
      return
    }

    setFormValues({
      monthlyVolume: processingInfo.monthlyVolume != null
        ? String(processingInfo.monthlyVolume)
        : '',
      avgTransaction: processingInfo.avgTransaction != null
        ? String(processingInfo.avgTransaction)
        : '',
      mccCode: processingInfo.mccCode ?? '',
      currentProcessor: processingInfo.currentProcessor ?? '',
    })
    setErrors({})
    setTouched({})
    setSuccessMessage('')
  }, [application?.id, processingInfo])

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

  const submitStep = useCallback(
    async ({ mode = 'strict', autofill = false } = {}) => {
      const nextValues = autofill ? autofillProcessingInfo(formValues) : formValues
      if (autofill) {
        setFormValues(nextValues)
      }

      const nextTouched = {
        monthlyVolume: true,
        avgTransaction: true,
        mccCode: true,
      }
      setTouched(nextTouched)

      const validationErrors =
        mode === 'quick'
          ? {
              monthlyVolume: validateField('monthlyVolume', nextValues.monthlyVolume),
            }
          : validateForm(nextValues)
      setErrors(validationErrors)

      const hasError = Object.values(validationErrors).some(Boolean)
      if (hasError) {
        return { ok: false, reason: 'validation' }
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
          throw new Error('Unable to resolve application id for Step 4 save.')
        }

        await saveStep({
          appId,
          stepNumber: 4,
          data: {
            monthlyVolume: nextValues.monthlyVolume.trim(),
            avgTransaction: nextValues.avgTransaction.trim(),
            mccCode: normalizeMccCode(nextValues.mccCode),
            currentProcessor: nextValues.currentProcessor.trim(),
          },
        })

        setSuccessMessage('Processing Information saved.')
        return { ok: true }
      } catch (error) {
        setUiError(error?.message ?? 'Failed to save Processing Information.')
        return { ok: false, reason: 'request' }
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      application?.id,
      clearUiError,
      createApplication,
      formValues,
      saveStep,
      setUiError,
    ],
  )

  useEffect(() => {
    if (!registerStepAction) {
      return undefined
    }
    registerStepAction(submitStep)
    return () => registerStepAction(null)
  }, [registerStepAction, submitStep])

  async function handleSubmit(event) {
    event.preventDefault()
    await submitStep({ mode: 'strict' })
  }

  return (
    <section className="card">
      <h2>Step 4: Processing Information</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="monthlyVolume">Estimated Monthly Card Volume ($) *</label>
          <input
            id="monthlyVolume"
            name="monthlyVolume"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={formValues.monthlyVolume}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="50000.00"
          />
          {touched.monthlyVolume && errors.monthlyVolume ? (
            <p className="error-text">{errors.monthlyVolume}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="avgTransaction">Average Transaction Amount ($) *</label>
          <input
            id="avgTransaction"
            name="avgTransaction"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={formValues.avgTransaction}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="75.00"
          />
          {touched.avgTransaction && errors.avgTransaction ? (
            <p className="error-text">{errors.avgTransaction}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="mccCode">Industry / MCC Code *</label>
          <input
            id="mccCode"
            name="mccCode"
            type="text"
            list="mcc-code-options"
            value={formValues.mccCode}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Search MCC (e.g., 5411 - Grocery Stores and Supermarkets)"
          />
          <datalist id="mcc-code-options">
            {MCC_OPTIONS.map((option) => (
              <option
                key={option.code}
                value={`${option.code} - ${option.label}`}
              />
            ))}
          </datalist>
          {touched.mccCode && errors.mccCode ? (
            <p className="error-text">{errors.mccCode}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="currentProcessor">Current Payment Processor</label>
          <input
            id="currentProcessor"
            name="currentProcessor"
            type="text"
            value={formValues.currentProcessor}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Optional"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isCreating || isSaving || isSubmitting}
          >
            {isCreating || isSaving || isSubmitting
              ? 'Saving...'
              : 'Save Processing Information'}
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

export default ProcessingInfoStep
