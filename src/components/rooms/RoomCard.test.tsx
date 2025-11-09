import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoomCard } from "./RoomCard";
import type { Room, RoomStats } from "@/lib/types";

describe("RoomCard", () => {
  const mockRoom: Room = {
    id: "room-1",
    name: "Math Lock-in",
    description: "Competitive math study group",
    createdBy: "user-1",
    createdAt: "2025-01-01T00:00:00Z",
  };

  const mockStats: RoomStats = {
    totalSessions: 15,
    totalHours: 42.5,
    avgHoursPerMember: 8.5,
    activeToday: 3,
  };

  it("renders room name", () => {
    render(<RoomCard room={mockRoom} stats={mockStats} />);

    expect(screen.getByText("Math Lock-in")).toBeInTheDocument();
  });

  it("renders room description when provided", () => {
    render(<RoomCard room={mockRoom} stats={mockStats} />);

    expect(
      screen.getByText("Competitive math study group")
    ).toBeInTheDocument();
  });

  it("does not render description when null", () => {
    const roomWithoutDescription: Room = {
      ...mockRoom,
      description: null,
    };

    const { container } = render(
      <RoomCard room={roomWithoutDescription} stats={mockStats} />
    );

    expect(
      container.querySelector(".text-slate-400.mb-4")
    ).not.toBeInTheDocument();
  });

  it("displays member count badge", () => {
    render(<RoomCard room={mockRoom} stats={mockStats} memberCount={5} />);

    expect(screen.getByText("5 members")).toBeInTheDocument();
  });

  it("displays total hours with 1 decimal place", () => {
    render(<RoomCard room={mockRoom} stats={mockStats} />);

    expect(screen.getByText("42.5h total")).toBeInTheDocument();
  });

  it("rounds total hours correctly", () => {
    const statsWithDecimal: RoomStats = {
      ...mockStats,
      totalHours: 10.234,
    };

    render(<RoomCard room={mockRoom} stats={statsWithDecimal} />);

    // Should round to 1 decimal: 10.2
    expect(screen.getByText("10.2h total")).toBeInTheDocument();
  });

  it("displays zero stats correctly", () => {
    const zeroStats: RoomStats = {
      totalSessions: 0,
      totalHours: 0,
      avgHoursPerMember: 0,
      activeToday: 0,
    };

    render(<RoomCard room={mockRoom} stats={zeroStats} memberCount={0} />);

    expect(screen.getByText("0 members")).toBeInTheDocument();
    expect(screen.getByText("0.0h total")).toBeInTheDocument();
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = vi.fn();

    render(
      <RoomCard room={mockRoom} stats={mockStats} onClick={handleClick} />
    );

    const card = screen.getByText("Math Lock-in").closest(".p-4");
    expect(card).toBeInTheDocument();

    if (card) {
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it("does not crash when onClick is undefined", () => {
    render(<RoomCard room={mockRoom} stats={mockStats} />);

    const card = screen.getByText("Math Lock-in").closest(".p-4");

    if (card) {
      fireEvent.click(card);
      // Should not throw error
    }
  });

  it("applies cursor-pointer class for clickable appearance", () => {
    render(<RoomCard room={mockRoom} stats={mockStats} />);

    const card = screen.getByText("Math Lock-in").closest(".p-4");
    expect(card).toHaveClass("cursor-pointer");
  });

  it("applies hover transition class", () => {
    render(<RoomCard room={mockRoom} stats={mockStats} />);

    const card = screen.getByText("Math Lock-in").closest(".p-4");
    expect(card).toHaveClass("hover:bg-slate-800");
    expect(card).toHaveClass("transition");
  });

  it("renders all elements in correct structure", () => {
    const { container } = render(
      <RoomCard room={mockRoom} stats={mockStats} />
    );

    // Check for heading with correct class
    const heading = container.querySelector("h3.text-xl.font-bold");
    expect(heading).toBeInTheDocument();
    expect(heading?.textContent).toBe("Math Lock-in");

    // Check for stats container
    const statsContainer = container.querySelector(".flex.gap-4.text-sm");
    expect(statsContainer).toBeInTheDocument();
  });

  it("renders with different room data correctly", () => {
    const differentRoom: Room = {
      id: "room-2",
      name: "Startup Grind",
      description: null,
      createdBy: "user-2",
      createdAt: "2025-02-01T00:00:00Z",
    };

    const differentStats: RoomStats = {
      totalSessions: 45,
      totalHours: 156.7,
      avgHoursPerMember: 13.1,
      activeToday: 8,
    };

    render(
      <RoomCard room={differentRoom} stats={differentStats} memberCount={12} />
    );

    expect(screen.getByText("Startup Grind")).toBeInTheDocument();
    expect(screen.getByText("12 members")).toBeInTheDocument();
    expect(screen.getByText("156.7h total")).toBeInTheDocument();
  });

  it("handles very large numbers", () => {
    const largeStats: RoomStats = {
      totalSessions: 5000,
      totalHours: 9999.9,
      avgHoursPerMember: 10.0,
      activeToday: 500,
    };

    render(<RoomCard room={mockRoom} stats={largeStats} memberCount={999} />);

    expect(screen.getByText("999 members")).toBeInTheDocument();
    expect(screen.getByText("9999.9h total")).toBeInTheDocument();
  });

  it("handles rooms with empty string description", () => {
    const roomWithEmptyDescription: Room = {
      ...mockRoom,
      description: "",
    };

    render(<RoomCard room={roomWithEmptyDescription} stats={mockStats} />);

    // Empty string is falsy, so description paragraph should not render
    const paragraphs = screen.queryAllByText("");
    const descriptionParagraph = paragraphs.find((p) =>
      p.classList.contains("text-slate-400")
    );
    expect(descriptionParagraph).toBeUndefined();
  });
});
