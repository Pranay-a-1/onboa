function randomDigits(length) {
  let output = ''
  for (let index = 0; index < length; index += 1) {
    output += Math.floor(Math.random() * 10)
  }
  return output
}

function todayMinusYears(years) {
  const date = new Date()
  date.setFullYear(date.getFullYear() - years)
  return date.toISOString().slice(0, 10)
}

export function autofillBusinessInfo(values) {
  return {
    legalName: values.legalName || 'Demo Coffee Roasters LLC',
    dbaName: values.dbaName || 'Demo Coffee',
    ein: values.ein || `${randomDigits(2)}-${randomDigits(7)}`,
    businessType: values.businessType || 'LLC',
    stateOfIncorporation: values.stateOfIncorporation || 'CA',
    dateOfFormation: values.dateOfFormation || '2019-04-12',
  }
}

export function autofillBusinessAddress(values) {
  return {
    streetAddress: values.streetAddress || '120 Market Street',
    suiteUnit: values.suiteUnit || 'Suite 400',
    city: values.city || 'San Francisco',
    state: values.state || 'CA',
    zipCode: values.zipCode || '94105',
    phone: values.phone || '(415) 555-0179',
    email: values.email || 'ops@democoffee.com',
    websiteUrl: values.websiteUrl || 'https://democoffee.example',
  }
}

export function autofillAuthRep(values) {
  return {
    fullName: values.fullName || 'Jordan Smith',
    title: values.title || 'Owner',
    ssnLast4: values.ssnLast4 || randomDigits(4),
    dateOfBirth: values.dateOfBirth || todayMinusYears(30),
    address: values.address || '120 Market Street, San Francisco, CA 94105',
    phone: values.phone || '(415) 555-0161',
    email: values.email || 'jordan.smith@example.com',
  }
}

export function autofillProcessingInfo(values) {
  return {
    monthlyVolume: values.monthlyVolume || '50000',
    avgTransaction: values.avgTransaction || '85',
    mccCode: values.mccCode || '5411 - Grocery Stores and Supermarkets',
    currentProcessor: values.currentProcessor || 'LegacyPay',
  }
}

export function autofillBankAccount(values) {
  const accountNumber = values.accountNumber || `11${randomDigits(10)}`
  return {
    bankName: values.bankName || 'Pranay National Bank',
    routingNumber: values.routingNumber || '021000021',
    accountNumber,
    confirmAccountNumber: values.confirmAccountNumber || accountNumber,
    accountType: values.accountType || 'Checking',
  }
}
