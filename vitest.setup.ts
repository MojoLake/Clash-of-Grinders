import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock Next.js font functions
vi.mock("next/font/local", () => ({
  default: () => ({
    className: "mocked-local-font",
    variable: "--font-mocked",
    style: { fontFamily: "mocked" },
  }),
}));

vi.mock("next/font/google", () => ({
  Geist_Mono: () => ({
    className: "mocked-geist-mono",
    variable: "--font-geist-mono",
    style: { fontFamily: "mocked-mono" },
  }),
}));
