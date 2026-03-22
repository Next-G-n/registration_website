import type { CheckInWizardForm, PublicCheckInPayload } from '../types/checkin'

function normalizeOptional(value?: string) {
  const cleaned = String(value || '').trim()
  return cleaned ? cleaned : null
}

export function mapCheckInFormToPayload(values: CheckInWizardForm): PublicCheckInPayload {
  const firstName = values.first_name.trim()
  const addressStreet = values.address_street.trim()
  const addressCity = values.address_city.trim()
  const addressCountry = values.address_country.trim()
  const fullAddress = [addressStreet, addressCity, addressCountry].filter(Boolean).join(', ')

  const purpose = values.purpose === 'Other' ? (values.purpose_other || 'Other').trim() : values.purpose.trim()

  return {
    visitor_type: values.citizen_status,
    citizen_status: values.citizen_status,
    visit_context: values.visit_context,
    last_name: values.last_name.trim(),
    surname: values.last_name.trim(),
    first_name: firstName,
    first_names: firstName,
    date_of_birth: values.date_of_birth,
    gender: values.gender,
    nationality: values.nationality.trim(),
    apartment_number: values.apartment_number.trim(),
    address_street: addressStreet,
    address_city: addressCity,
    address_country: addressCountry,
    home_village_town: fullAddress,
    omang_number: values.citizen_status === 'citizen' ? normalizeOptional(values.omang_number) : null,
    passport_number: values.citizen_status === 'non_citizen' ? normalizeOptional(values.passport_number) : null,
    passport_country: values.citizen_status === 'non_citizen' ? normalizeOptional(values.passport_country) : null,
    mobile_phone: values.mobile_phone.trim(),
    email: normalizeOptional(values.email),
    company_name: values.visit_context === 'company' ? normalizeOptional(values.company_name) : null,
    company_location: values.visit_context === 'company' ? normalizeOptional(values.company_location) : null,
    company_phone: values.visit_context === 'company' ? normalizeOptional(values.company_phone) : null,
    company_email: values.visit_context === 'company' ? normalizeOptional(values.company_email) : null,
    department_id: values.department_id,
    purpose,
    reason_for_visit_text: values.reason_for_visit_text.trim(),
    additional_info: null,
    host_name: null,
    visitor_photo: values.visitor_photo,
    data_protection_consent: true,
  }
}
