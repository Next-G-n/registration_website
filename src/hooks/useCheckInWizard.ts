import { useMemo, useState } from 'react'
import type { FieldPath, UseFormReturn } from 'react-hook-form'
import type { CheckInWizardForm } from '../types/checkin'

export type WizardPanelId =
  | 'who_are_you'
  | 'image_upload'
  | 'personal_info'
  | 'address'
  | 'identity_contact'
  | 'company_details'
  | 'visit_info'
  | 'reason'
  | 'consent'

const basePanelOrder: WizardPanelId[] = [
  'who_are_you',
  'identity_contact',
  'image_upload',
  'personal_info',
  'address',
  'visit_info',
  'reason',
  'consent',
]

const panelFields: Record<WizardPanelId, FieldPath<CheckInWizardForm>[]> = {
  who_are_you: ['citizen_status', 'visit_context'],
  image_upload: ['visitor_photo'],
  personal_info: ['first_name', 'last_name', 'date_of_birth', 'gender', 'nationality'],
  address: ['apartment_number', 'address_street', 'address_city', 'address_country'],
  identity_contact: ['omang_number', 'passport_number', 'passport_country', 'mobile_phone', 'email'],
  company_details: ['company_name', 'company_location', 'company_phone', 'company_email'],
  visit_info: ['department_id', 'purpose', 'purpose_other'],
  reason: ['reason_for_visit_text'],
  consent: ['data_protection_consent'],
}

export function panelForField(field: string): WizardPanelId | null {
  if (['citizen_status', 'visit_context'].includes(field)) return 'who_are_you'
  if (['visitor_photo'].includes(field)) return 'image_upload'
  if (['first_name', 'last_name', 'date_of_birth', 'gender', 'nationality'].includes(field)) return 'personal_info'
  if (['apartment_number', 'address_street', 'address_city', 'address_country'].includes(field)) return 'address'
  if (['omang_number', 'passport_number', 'passport_country', 'mobile_phone', 'email'].includes(field)) return 'identity_contact'
  if (['company_name', 'company_location', 'company_phone', 'company_email'].includes(field)) {
    return 'company_details'
  }
  if (['department_id', 'purpose', 'purpose_other'].includes(field)) return 'visit_info'
  if (['reason_for_visit_text'].includes(field)) return 'reason'
  if (['data_protection_consent'].includes(field)) return 'consent'
  return null
}

export function useCheckInWizard(form: UseFormReturn<CheckInWizardForm>, hasDepartments: boolean, skipProfilePanels = false) {
  const visitContext = form.watch('visit_context')
  const panelOrder = useMemo<WizardPanelId[]>(() => {
    let order = [...basePanelOrder]

    if (skipProfilePanels) {
      order = order.filter((panel) => panel !== 'personal_info' && panel !== 'address')
    }

    if (visitContext === 'company') {
      const visitInfoIndex = order.indexOf('visit_info')
      if (visitInfoIndex >= 0) {
        return [...order.slice(0, visitInfoIndex), 'company_details', ...order.slice(visitInfoIndex)]
      }
    }

    return order
  }, [skipProfilePanels, visitContext])

  const [panelIndex, setPanelIndex] = useState(0)

  const safeIndex = Math.min(panelIndex, panelOrder.length - 1)
  const currentPanel: WizardPanelId = panelOrder[safeIndex]
  const isFirst = safeIndex === 0
  const isLast = safeIndex === panelOrder.length - 1

  const effectiveFields = useMemo(() => {
    const fields = [...panelFields[currentPanel]]
    const citizenStatus = form.getValues('citizen_status')

    if (currentPanel === 'identity_contact') {
      if (citizenStatus === 'citizen') {
        return fields.filter((field) => field !== 'passport_number' && field !== 'passport_country')
      }
      return fields.filter((field) => field !== 'omang_number')
    }
    if (currentPanel === 'visit_info' && form.getValues('purpose') !== 'Other') {
      return fields.filter((field) => field !== 'purpose_other')
    }
    return fields
  }, [currentPanel, form])

  const goBack = () => setPanelIndex((prev) => Math.max(0, prev - 1))

  const goNext = async () => {
    if (currentPanel === 'visit_info' && !hasDepartments) return false
    const valid = await form.trigger(effectiveFields)
    if (!valid) return false
    setPanelIndex((prev) => Math.min(panelOrder.length - 1, prev + 1))
    return true
  }

  const goToPanel = (panel: WizardPanelId) => {
    const target = panelOrder.indexOf(panel)
    if (target >= 0) setPanelIndex(target)
  }

  return {
    panelOrder,
    currentPanel,
    panelIndex: safeIndex,
    isFirst,
    isLast,
    goBack,
    goNext,
    goToPanel,
  }
}
