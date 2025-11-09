import { describe, it, expect } from "vitest";
import {
  validateRequired,
  validatePositiveNumber,
  validateDateRange,
  createErrorResponse,
  createSuccessResponse,
} from "./validation";

describe("validateRequired", () => {
  it("should return null when all required fields are present", () => {
    const data = {
      name: "Test",
      email: "test@example.com",
      age: 25,
    };
    const result = validateRequired(data, ["name", "email", "age"]);
    expect(result).toBeNull();
  });

  it("should return error message when a field is missing", () => {
    const data = {
      name: "Test",
      email: "test@example.com",
    };
    const result = validateRequired(data, ["name", "email", "age"]);
    expect(result).toBe("Missing required fields: age");
  });

  it("should return error message when multiple fields are missing", () => {
    const data = {
      name: "Test",
    };
    const result = validateRequired(data, ["name", "email", "age"]);
    expect(result).toBe("Missing required fields: email, age");
  });

  it("should treat null as missing", () => {
    const data = {
      name: "Test",
      email: null,
    };
    const result = validateRequired(data, ["name", "email"]);
    expect(result).toBe("Missing required fields: email");
  });

  it("should treat undefined as missing", () => {
    const data = {
      name: "Test",
      email: undefined,
    };
    const result = validateRequired(data, ["name", "email"]);
    expect(result).toBe("Missing required fields: email");
  });

  it("should treat empty string as missing", () => {
    const data = {
      name: "Test",
      email: "",
    };
    const result = validateRequired(data, ["name", "email"]);
    expect(result).toBe("Missing required fields: email");
  });

  it("should handle empty required fields array", () => {
    const data = { name: "Test" };
    const result = validateRequired(data, []);
    expect(result).toBeNull();
  });

  it("should accept zero as a valid value", () => {
    const data = {
      count: 0,
      name: "Test",
    };
    const result = validateRequired(data, ["count", "name"]);
    expect(result).toBeNull();
  });

  it("should accept false as a valid value", () => {
    const data = {
      isActive: false,
      name: "Test",
    };
    const result = validateRequired(data, ["isActive", "name"]);
    expect(result).toBeNull();
  });
});

describe("validatePositiveNumber", () => {
  it("should return null for positive numbers", () => {
    expect(validatePositiveNumber(1, "count")).toBeNull();
    expect(validatePositiveNumber(100.5, "amount")).toBeNull();
    expect(validatePositiveNumber(0.001, "value")).toBeNull();
  });

  it("should return error for zero", () => {
    const result = validatePositiveNumber(0, "count");
    expect(result).toBe("count must be positive");
  });

  it("should return error for negative numbers", () => {
    const result = validatePositiveNumber(-5, "count");
    expect(result).toBe("count must be positive");
  });

  it("should return error for non-numbers", () => {
    expect(validatePositiveNumber("10", "count")).toBe(
      "count must be a number"
    );
    expect(validatePositiveNumber(null, "count")).toBe(
      "count must be a number"
    );
    expect(validatePositiveNumber(undefined, "count")).toBe(
      "count must be a number"
    );
    expect(validatePositiveNumber({}, "count")).toBe("count must be a number");
  });

  it("should return error for Infinity", () => {
    const result = validatePositiveNumber(Infinity, "count");
    expect(result).toBe("count must be a finite number");
  });

  it("should return error for NaN", () => {
    const result = validatePositiveNumber(NaN, "count");
    expect(result).toBe("count must be a finite number");
  });
});

describe("validateDateRange", () => {
  it("should return null for valid date range with ISO strings", () => {
    const start = "2025-01-09T10:00:00Z";
    const end = "2025-01-09T11:00:00Z";
    const result = validateDateRange(start, end);
    expect(result).toBeNull();
  });

  it("should return null for valid date range with Date objects", () => {
    const start = new Date("2025-01-09T10:00:00Z");
    const end = new Date("2025-01-09T11:00:00Z");
    const result = validateDateRange(start, end);
    expect(result).toBeNull();
  });

  it("should return null for valid date range with mixed types", () => {
    const start = "2025-01-09T10:00:00Z";
    const end = new Date("2025-01-09T11:00:00Z");
    const result = validateDateRange(start, end);
    expect(result).toBeNull();
  });

  it("should return error when start equals end", () => {
    const date = "2025-01-09T10:00:00Z";
    const result = validateDateRange(date, date);
    expect(result).toBe("Start date must be before end date");
  });

  it("should return error when start is after end", () => {
    const start = "2025-01-09T11:00:00Z";
    const end = "2025-01-09T10:00:00Z";
    const result = validateDateRange(start, end);
    expect(result).toBe("Start date must be before end date");
  });

  it("should return error for invalid date strings", () => {
    const result = validateDateRange("invalid", "2025-01-09T10:00:00Z");
    expect(result).toBe("Invalid date format");
  });

  it("should return error for both invalid dates", () => {
    const result = validateDateRange("invalid1", "invalid2");
    expect(result).toBe("Invalid date format");
  });
});

describe("createErrorResponse", () => {
  it("should create error response with default status 400", () => {
    const response = createErrorResponse("Something went wrong");
    expect(response.status).toBe(400);
  });

  it("should create error response with custom status", () => {
    const response = createErrorResponse("Not found", 404);
    expect(response.status).toBe(404);
  });

  it("should return response with error property", async () => {
    const response = createErrorResponse("Test error");
    const json = await response.json();
    expect(json).toEqual({ error: "Test error" });
  });
});

describe("createSuccessResponse", () => {
  it("should create success response with default status 200", () => {
    const response = createSuccessResponse({ message: "Success" });
    expect(response.status).toBe(200);
  });

  it("should create success response with custom status", () => {
    const response = createSuccessResponse({ id: "123" }, 201);
    expect(response.status).toBe(201);
  });

  it("should return response with provided data", async () => {
    const data = { user: { id: "1", name: "Test" } };
    const response = createSuccessResponse(data);
    const json = await response.json();
    expect(json).toEqual(data);
  });

  it("should handle array data", async () => {
    const data = [1, 2, 3];
    const response = createSuccessResponse(data);
    const json = await response.json();
    expect(json).toEqual(data);
  });

  it("should handle null data", async () => {
    const response = createSuccessResponse(null);
    const json = await response.json();
    expect(json).toBeNull();
  });
});
