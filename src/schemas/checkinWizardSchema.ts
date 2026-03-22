import { z } from 'zod'

export const localNationality = 'Botswana'

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

export const checkinWizardSchema = z
  .object({
    citizen_status: z.enum(['citizen', 'non_citizen']),
    visit_context: z.enum(['personal', 'company']),
    visitor_photo: z.string().min(1, 'Please upload one image.'),
    first_name: z.string().trim().min(1, 'First name is required.'),
    last_name: z.string().trim().min(1, 'Last name is required.'),
    date_of_birth: z.string().regex(dateRegex, 'Date of birth is required.'),
    gender: z.enum(['male', 'female', 'other']),
    nationality: z.string().trim().min(1, 'Nationality is required.'),
    apartment_number: z.string().trim().min(1, 'Apartment number is required.'),
    address_street: z.string().trim().min(1, 'Street is required.'),
    address_city: z.string().trim().min(1, 'City is required.'),
    address_country: z.string().trim().min(1, 'Country is required.'),
    omang_number: z.string().trim().optional(),
    passport_number: z.string().trim().optional(),
    passport_country: z.string().trim().optional(),
    mobile_phone: z.string().trim().min(7, 'Phone number must be at least 7 characters.'),
    email: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || z.string().email().safeParse(value).success, 'Invalid email address.'),
    company_name: z.string().trim().optional(),
    company_location: z.string().trim().optional(),
    company_phone: z.string().trim().optional(),
    company_email: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || z.string().email().safeParse(value).success, 'Invalid company email address.'),
    department_id: z.number().int().positive('Department is required.'),
    purpose: z.string().trim().min(1, 'Purpose is required.'),
    purpose_other: z.string().trim().optional(),
    reason_for_visit_text: z.string().trim().min(3, 'Reason for visit must be at least 3 characters.'),
    data_protection_consent: z.boolean().refine((value) => value, 'You must accept the privacy acknowledgement.'),
  })
  .superRefine((values, ctx) => {
    if (values.citizen_status === 'citizen') {
      if (!values.omang_number || values.omang_number.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['omang_number'],
          message: 'Omang number is required and must be at least 5 characters.',
        })
      }
    }

    if (values.citizen_status === 'non_citizen') {
      if (!values.passport_number || values.passport_number.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['passport_number'],
          message: 'Passport number is required and must be at least 5 characters.',
        })
      }
      if (!values.passport_country) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['passport_country'],
          message: 'Passport country is required.',
        })
      }
    }

    if (values.visit_context === 'company') {
      if (!values.company_name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['company_name'],
          message: 'Company name is required for company visits.',
        })
      }
      if (!values.company_location) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['company_location'],
          message: 'Company location is required for company visits.',
        })
      }
    }

    if (values.purpose === 'Other' && !values.purpose_other) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['purpose_other'],
        message: 'Please describe the purpose.',
      })
    }
  })

export const checkoutFeedbackSchema = z
  .object({
    feedback_opt_in: z.boolean(),
    feedback_rating: z.number().int().min(1).max(5).nullable(),
    feedback_was_helpful: z.boolean().nullable(),
    feedback_visit_outcome: z.enum(['completed_what_i_came_for', 'partially_completed', 'not_completed']).nullable(),
    feedback_comment: z.string().trim().max(500, 'Feedback comment must be 500 characters or fewer.').nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.feedback_opt_in && (value.feedback_rating === null || value.feedback_rating === undefined)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['feedback_rating'],
        message: 'Rating is required when feedback is enabled.',
      })
    }
  })

export type CheckoutFeedbackForm = z.infer<typeof checkoutFeedbackSchema>
