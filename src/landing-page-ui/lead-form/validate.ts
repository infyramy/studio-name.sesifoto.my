export type LeadFormFieldKey =
  | "contactName"
  | "contactPhone"
  | "contactEmail"
  | "eventDate"
  | "eventType"
  | "serviceInterest"
  | "venue"
  | "notes";

export type LeadFormFieldErrors = Partial<Record<LeadFormFieldKey, string>>;

export type LeadFormValidationMessages = {
  nameRequired: string;
  nameTooShort: string;
  phoneRequired: string;
  phoneInvalid: string;
  emailRequired: string;
  emailInvalid: string;
  eventTypeRequired: string;
  eventDateInvalid: string;
  eventDatePast: string;
  serviceRequired: string;
};

export type LeadFormValues = {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  eventDate: string;
  eventType: string;
  serviceInterest: string;
  requireEventType: boolean;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Accept MY-style WhatsApp: 9–12 digits after stripping, optional leading 60. */
export function isValidLeadPhone(raw: string): boolean {
  let digits = digitsOnly(raw);
  if (digits.startsWith("60") && digits.length >= 11) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.length >= 8 && digits.length <= 11;
}

export function isValidLeadEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

export function todayIsoDate(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
  );
}

export function validateLeadForm(
  values: LeadFormValues,
  messages: LeadFormValidationMessages,
  allowedServiceValues?: string[],
): LeadFormFieldErrors {
  const errors: LeadFormFieldErrors = {};

  const name = values.contactName.trim();
  if (!name) {
    errors.contactName = messages.nameRequired;
  } else if (name.length < 2) {
    errors.contactName = messages.nameTooShort;
  }

  const phone = values.contactPhone.trim();
  if (!phone) {
    errors.contactPhone = messages.phoneRequired;
  } else if (!isValidLeadPhone(phone)) {
    errors.contactPhone = messages.phoneInvalid;
  }

  const email = values.contactEmail.trim();
  if (!email) {
    errors.contactEmail = messages.emailRequired;
  } else if (!isValidLeadEmail(email)) {
    errors.contactEmail = messages.emailInvalid;
  }

  const date = values.eventDate.trim();
  if (date) {
    if (!isIsoDate(date)) {
      errors.eventDate = messages.eventDateInvalid;
    } else if (date < todayIsoDate()) {
      errors.eventDate = messages.eventDatePast;
    }
  }

  if (values.requireEventType && !values.eventType.trim()) {
    errors.eventType = messages.eventTypeRequired;
  }

  const allowed =
    allowedServiceValues?.length
      ? allowedServiceValues
      : ["photo", "video", "photo_video"];
  if (!allowed.includes(values.serviceInterest)) {
    errors.serviceInterest = messages.serviceRequired;
  }

  return errors;
}

export function firstFieldError(
  errors: LeadFormFieldErrors,
): LeadFormFieldKey | null {
  const order: LeadFormFieldKey[] = [
    "contactName",
    "contactPhone",
    "contactEmail",
    "eventDate",
    "eventType",
    "serviceInterest",
    "venue",
    "notes",
  ];
  return order.find((key) => errors[key]) ?? null;
}
