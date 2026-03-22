export type CitizenStatus = 'citizen' | 'non_citizen'
export type VisitContext = 'personal' | 'company'

export type CheckInWizardForm = {
  citizen_status: CitizenStatus
  visit_context: VisitContext
  visitor_photo: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  nationality: string
  apartment_number: string
  address_street: string
  address_city: string
  address_country: string
  omang_number?: string
  passport_number?: string
  passport_country?: string
  mobile_phone: string
  email?: string
  company_name?: string
  company_location?: string
  company_phone?: string
  company_email?: string
  department_id: number
  purpose: string
  purpose_other?: string
  reason_for_visit_text: string
  data_protection_consent: boolean
}

export type PublicDepartment = {
  id: number
  name: string
}

export type PublicRegistrationPoint = {
  id: number
  name: string
  department?: PublicDepartment | null
  organization?: {
    id: number
    name: string
  } | null
}

export type PublicOrgMetadata = {
  active?: boolean
  org_name: string
  company_image?: string | null
  logo_url?: string | null
  primary_color?: string | null
  accent_color?: string | null
  background_color?: string | null
  text_color?: string | null
  registration_point?: PublicRegistrationPoint | null
  departments: PublicDepartment[]
  purposes?: string[]
}

export type PublicCheckInPayload = {
  visitor_type: CitizenStatus
  citizen_status: CitizenStatus
  visit_context: VisitContext
  last_name: string
  surname: string
  first_name: string
  first_names: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  nationality: string
  apartment_number: string
  address_street: string
  address_city: string
  address_country: string
  home_village_town: string
  omang_number: string | null
  passport_number: string | null
  passport_country: string | null
  mobile_phone: string
  email: string | null
  company_name: string | null
  company_location: string | null
  company_phone: string | null
  company_email: string | null
  department_id: number
  purpose: string
  reason_for_visit_text: string
  additional_info: string | null
  host_name: string | null
  visitor_photo: string
  data_protection_consent: boolean
}

export type PublicCheckInSuccess = {
  visit_id: number
  visit_code: string
  check_in_at: string
  status: string
}

export type PublicPrefillRequest = {
  citizen_status: CitizenStatus
  omang_number?: string
  passport_number?: string
}

export type PublicPrefillPerson = {
  first_name: string | null
  last_name: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | null
  nationality: string | null
  apartment_number: string | null
  address_street: string | null
  address_city: string | null
  address_country: string | null
  mobile_phone: string | null
  email: string | null
  citizen_status: CitizenStatus | null
  omang_number: string | null
  passport_number: string | null
  passport_country: string | null
}

export type PublicPrefillResponse = {
  found: boolean
  person: PublicPrefillPerson | null
}

export type VisitorHistoryRow = {
  id: number
  checkin_id: number
  full_name: string
  citizen_status: CitizenStatus | null
  visit_context: VisitContext | null
  company_name: string | null
  company_location: string | null
  apartment_number: string | null
  plot_number: string | null
  address_street: string | null
  address_city: string | null
  address_country: string | null
  department: string | null
  purpose: string | null
  reason_for_visit_text: string | null
  check_in_at: string | null
  check_out_at: string | null
  status: 'IN' | 'OUT'
  checkin_source: string | null
  public_key: string | null
  person_id: number | null
  id_masked: string | null
  visitor_photo: string | null
  mobile_phone: string | null
  email: string | null
  feedback_opt_in: boolean | null
  feedback_rating: number | null
  feedback_was_helpful: boolean | null
  feedback_visit_outcome: 'completed_what_i_came_for' | 'partially_completed' | 'not_completed' | null
  feedback_comment: string | null
  raw: Record<string, unknown>
}

export type CheckoutFeedbackPayload = {
  feedback_opt_in: boolean
  feedback_rating: number | null
  feedback_was_helpful: boolean | null
  feedback_visit_outcome: 'completed_what_i_came_for' | 'partially_completed' | 'not_completed' | null
  feedback_comment: string | null
}

export type CheckoutFeedbackResponse = {
  id?: number
  checkin_id?: number
  check_out_at?: string
  status?: string
  [key: string]: unknown
}

export type PublicApiError = Error & {
  status: number
  data?: unknown
  fieldErrors?: Record<string, string>
}
