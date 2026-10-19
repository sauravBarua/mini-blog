import { ApiError } from './api';

export type FormErrors = {
  fields: Record<string, string>;
  form?: string;
};

export const noErrors: FormErrors = { fields: {} };

function fieldErrors(details: unknown): Record<string, string> {
  const fields: Record<string, string> = {};
  if (!Array.isArray(details)) {
    return fields;
  }

  for (const detail of details as { path?: unknown; message?: unknown }[]) {
    if (
      typeof detail.path === 'string' &&
      typeof detail.message === 'string' &&
      !(detail.path in fields)
    ) {
      fields[detail.path] = detail.message;
    }
  }
  return fields;
}

// Turns an API error into messages the forms can show next to the right input.
export function toFormErrors(error: unknown): FormErrors {
  if (!(error instanceof ApiError)) {
    return { fields: {}, form: 'Could not reach the server. Please try again.' };
  }

  switch (error.code) {
    case 'VALIDATION_ERROR': {
      const fields = fieldErrors(error.details);
      return Object.keys(fields).length > 0
        ? { fields }
        : { fields, form: 'Please check the form and try again.' };
    }
    case 'EMAIL_TAKEN':
      return { fields: { email: 'This email is already registered.' } };
    case 'INVALID_CREDENTIALS':
      return { fields: {}, form: 'Invalid email or password.' };
    case 'RATE_LIMITED':
      return { fields: {}, form: 'Too many attempts. Please try again in a few minutes.' };
    default:
      return { fields: {}, form: error.message };
  }
}
