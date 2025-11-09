import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RootLayout, { metadata } from "./layout";

/**
 * Tests for the root layout component.
 *
 * Note: Next.js layout components with <html> and <body> elements don't render
 * properly in React Testing Library's jsdom environment (which wraps everything
 * in a div). Therefore, we focus on:
 * 1. Testing metadata exports
 * 2. Testing that children render correctly
 *
 * HTML/body attributes (dark mode class, lang, font variables) are verified
 * through manual testing and integration tests rather than unit tests.
 */
describe("RootLayout", () => {
  describe("metadata", () => {
    it("exports correct title", () => {
      expect(metadata.title).toBe("Clash of Grinders");
    });

    it("exports correct description", () => {
      expect(metadata.description).toBe(
        "Track your grind, compete with friends"
      );
    });
  });

  describe("component", () => {
    it("renders children correctly", () => {
      const testText = "Test Child Content";

      render(
        <RootLayout>
          <div data-testid="test-child">{testText}</div>
        </RootLayout>
      );

      expect(screen.getByTestId("test-child")).toBeInTheDocument();
      expect(screen.getByText(testText)).toBeInTheDocument();
    });

    it("renders multiple children correctly", () => {
      render(
        <RootLayout>
          <div>First Child</div>
          <div>Second Child</div>
        </RootLayout>
      );

      expect(screen.getByText("First Child")).toBeInTheDocument();
      expect(screen.getByText("Second Child")).toBeInTheDocument();
    });

    it("renders without errors when children are provided", () => {
      const { container } = render(
        <RootLayout>
          <main>
            <h1>Page Title</h1>
            <p>Page content</p>
          </main>
        </RootLayout>
      );

      expect(container).toBeInTheDocument();
      expect(screen.getByText("Page Title")).toBeInTheDocument();
      expect(screen.getByText("Page content")).toBeInTheDocument();
    });
  });
});
