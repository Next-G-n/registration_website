import type { ReactNode } from 'react'
import type { VisitorHistoryRow } from '../types/checkin'
import { formatDateTime } from './format'
import { asCleanString, isPresent } from './presence'

export type VisitorMetaItem = { label: string; value: ReactNode }
export type VisitorDetailSection = { title: string; items: VisitorMetaItem[] }

function pushDisplayItem(items: VisitorMetaItem[], label: string, value: unknown) {
  if (!isPresent(value)) return
  items.push({ label, value: String(value).trim() })
}

function humanizeVisitContext(value: VisitorHistoryRow['visit_context']) {
  if (!isPresent(value)) return null
  if (value === 'personal') return 'Personal'
  if (value === 'company') return 'Company'
  return asCleanString(value)
}

function humanizeFeedbackOutcome(value: VisitorHistoryRow['feedback_visit_outcome']) {
  if (!isPresent(value)) return null
  return String(value).replaceAll('_', ' ')
}

function feedbackSummary(visit: VisitorHistoryRow) {
  const parts: string[] = []
  if (isPresent(visit.feedback_rating)) parts.push(`${visit.feedback_rating}/5`)
  if (isPresent(visit.feedback_was_helpful)) parts.push(visit.feedback_was_helpful ? 'Helpful: Yes' : 'Helpful: No')
  const outcome = humanizeFeedbackOutcome(visit.feedback_visit_outcome)
  if (isPresent(outcome)) parts.push(String(outcome))
  if (isPresent(visit.feedback_comment)) parts.push(truncate(String(visit.feedback_comment), 40))
  if (!parts.length) return null
  return parts.join(' | ')
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength)}...`
}

function plotNumber(visit: VisitorHistoryRow) {
  return asCleanString(visit.plot_number) || asCleanString(visit.apartment_number)
}

export function idLabelForVisitor(visit: VisitorHistoryRow) {
  if (visit.citizen_status === 'citizen') return 'Omang'
  if (visit.citizen_status === 'non_citizen') return 'Passport'
  return 'ID'
}

export function buildVisitorMetaItems(visit: VisitorHistoryRow, options?: { reasonMaxLength?: number }): VisitorMetaItem[] {
  const items: VisitorMetaItem[] = []
  const reasonMaxLength = options?.reasonMaxLength ?? 80
  const reason = asCleanString(visit.reason_for_visit_text)

  pushDisplayItem(items, idLabelForVisitor(visit), asCleanString(visit.id_masked))
  pushDisplayItem(items, 'Citizen status', asCleanString(visit.citizen_status))
  pushDisplayItem(items, 'Visit context', humanizeVisitContext(visit.visit_context))
  pushDisplayItem(items, 'Company name', asCleanString(visit.company_name))
  pushDisplayItem(items, 'Company location', asCleanString(visit.company_location))
  pushDisplayItem(items, 'Plot Number', plotNumber(visit))
  pushDisplayItem(items, 'Department', asCleanString(visit.department))
  pushDisplayItem(items, 'Purpose', asCleanString(visit.purpose))
  pushDisplayItem(items, 'Reason', reason ? truncate(reason, reasonMaxLength) : null)
  pushDisplayItem(items, 'Phone', asCleanString(visit.mobile_phone))
  pushDisplayItem(items, 'Email', asCleanString(visit.email))
  pushDisplayItem(items, 'Feedback', feedbackSummary(visit))

  return items
}

export function buildVisitorDetailSections(visit: VisitorHistoryRow): VisitorDetailSection[] {
  const visitor: VisitorMetaItem[] = []
  const address: VisitorMetaItem[] = []
  const visitInfo: VisitorMetaItem[] = []
  const company: VisitorMetaItem[] = []
  const feedback: VisitorMetaItem[] = []

  pushDisplayItem(visitor, idLabelForVisitor(visit), asCleanString(visit.id_masked))
  pushDisplayItem(visitor, 'Citizen status', asCleanString(visit.citizen_status))
  pushDisplayItem(visitor, 'Phone', asCleanString(visit.mobile_phone))
  pushDisplayItem(visitor, 'Email', asCleanString(visit.email))

  pushDisplayItem(address, 'Plot Number', plotNumber(visit))
  pushDisplayItem(address, 'Street', asCleanString(visit.address_street))
  pushDisplayItem(address, 'City', asCleanString(visit.address_city))
  pushDisplayItem(address, 'Country', asCleanString(visit.address_country))

  pushDisplayItem(visitInfo, 'Visit context', humanizeVisitContext(visit.visit_context))
  pushDisplayItem(visitInfo, 'Department', asCleanString(visit.department))
  pushDisplayItem(visitInfo, 'Purpose', asCleanString(visit.purpose))
  pushDisplayItem(visitInfo, 'Reason', asCleanString(visit.reason_for_visit_text))
  pushDisplayItem(visitInfo, 'Checked in', isPresent(visit.check_in_at) ? formatDateTime(visit.check_in_at) : null)
  pushDisplayItem(visitInfo, 'Checked out', isPresent(visit.check_out_at) ? formatDateTime(visit.check_out_at) : null)
  pushDisplayItem(visitInfo, 'Status', asCleanString(visit.status))

  pushDisplayItem(company, 'Company name', asCleanString(visit.company_name))
  pushDisplayItem(company, 'Company location', asCleanString(visit.company_location))
  pushDisplayItem(company, 'Company phone', asCleanString(visit.raw.company_phone))
  pushDisplayItem(company, 'Company email', asCleanString(visit.raw.company_email))

  const showFeedback =
    visit.feedback_opt_in === true ||
    isPresent(visit.feedback_rating) ||
    isPresent(visit.feedback_comment) ||
    isPresent(visit.feedback_visit_outcome) ||
    isPresent(visit.feedback_was_helpful)

  if (showFeedback) {
    if (visit.feedback_opt_in === true) pushDisplayItem(feedback, 'Feedback opted in', 'Yes')
    pushDisplayItem(
      feedback,
      'Rating',
      isPresent(visit.feedback_rating) ? `${visit.feedback_rating}/5` : null,
    )
    pushDisplayItem(
      feedback,
      'Was helpful',
      isPresent(visit.feedback_was_helpful) ? (visit.feedback_was_helpful ? 'Yes' : 'No') : null,
    )
    pushDisplayItem(feedback, 'Visit outcome', humanizeFeedbackOutcome(visit.feedback_visit_outcome))
    pushDisplayItem(feedback, 'Comment', asCleanString(visit.feedback_comment))
  }

  return [
    { title: 'Visitor', items: visitor },
    { title: 'Address', items: address },
    { title: 'Visit', items: visitInfo },
    { title: 'Company', items: company },
    { title: 'Feedback', items: feedback },
  ].filter((section) => section.items.length > 0)
}
