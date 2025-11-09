import { NextResponse } from "next/server";

/**
 * Validates that all required fields exist in the provided data object.
 * @param data - The data object to validate
 * @param fields - Array of field names that are required
 * @returns Error message if validation fails, null if successful
 */
export function validateRequired(
  data: Record<string, unknown>,
  fields: string[]
): string | null {
  const missingFields = fields.filter((field) => {
    const value = data[field];
    return value === undefined || value === null || value === "";
  });

  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(", ")}`;
  }

  return null;
}

/**
 * Validates that a value is a positive number.
 * @param value - The value to validate
 * @param fieldName - The name of the field (for error messages)
 * @returns Error message if validation fails, null if successful
 */
export function validatePositiveNumber(
  value: unknown,
  fieldName: string
): string | null {
  if (typeof value !== "number") {
    return `${fieldName} must be a number`;
  }

  if (!Number.isFinite(value)) {
    return `${fieldName} must be a finite number`;
  }

  if (value <= 0) {
    return `${fieldName} must be positive`;
  }

  return null;
}

/**
 * Validates that a date range is logical (start date before end date).
 * @param startDate - The start date (ISO string or Date)
 * @param endDate - The end date (ISO string or Date)
 * @returns Error message if validation fails, null if successful
 */
export function validateDateRange(
  startDate: string | Date,
  endDate: string | Date
): string | null {
  let start: Date;
  let end: Date;

  try {
    start = typeof startDate === "string" ? new Date(startDate) : startDate;
    end = typeof endDate === "string" ? new Date(endDate) : endDate;
  } catch {
    return "Invalid date format";
  }

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return "Invalid date format";
  }

  if (start >= end) {
    return "Start date must be before end date";
  }

  return null;
}

/**
 * Validates that a string's length is within the specified bounds.
 * @param value - The value to validate
 * @param fieldName - The name of the field (for error messages)
 * @param minLength - Minimum length (inclusive, default: 0)
 * @param maxLength - Maximum length (inclusive)
 * @returns Error message if validation fails, null if successful
 */
export function validateStringLength(
  value: unknown,
  fieldName: string,
  minLength: number = 0,
  maxLength: number
): string | null {
  if (typeof value !== "string") {
    return `${fieldName} must be a string`;
  }

  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} character${
      minLength === 1 ? "" : "s"
    }`;
  }

  if (value.length > maxLength) {
    return `${fieldName} must be at most ${maxLength} character${
      maxLength === 1 ? "" : "s"
    }`;
  }

  return null;
}

/**
 * Creates a standardized error response.
 * @param message - The error message
 * @param status - HTTP status code (default: 400)
 * @returns NextResponse with error
 */
export function createErrorResponse(
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Creates a standardized success response.
 * @param data - The response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with data
 */
export function createSuccessResponse(
  data: unknown,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}
