import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoomStatsCard } from "./RoomStatsCard";
import type { RoomStats } from "@/lib/types";

describe("RoomStatsCard", () => {
  const mockStats: RoomStats = {
    totalHours: 156.7,
    totalSessions: 342,
    activeToday: 5,
    avgHoursPerMember: 13.1,
  };

  describe("Stats Display", () => {
    it("displays total hours correctly", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={12} />);
      expect(screen.getByText("156.7h")).toBeInTheDocument();
    });

    it("displays total sessions correctly", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={12} />);
      expect(screen.getByText("342")).toBeInTheDocument();
    });

    it("displays member count correctly", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={12} />);
      expect(screen.getByText("12")).toBeInTheDocument();
    });

    it("displays active today count correctly", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={12} />);
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("displays average hours per member when memberCount > 0", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={12} />);
      expect(screen.getByText(/13\.1h/)).toBeInTheDocument();
      expect(screen.getByText(/Average per member:/)).toBeInTheDocument();
    });
  });

  describe("Number Formatting", () => {
    it("formats total hours with 1 decimal place", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={12} />);
      expect(screen.getByText("156.7h")).toBeInTheDocument();
    });

    it("formats hours with 1 decimal even for whole numbers", () => {
      const wholeNumberStats = { ...mockStats, totalHours: 100 };
      render(<RoomStatsCard stats={wholeNumberStats} memberCount={12} />);
      expect(screen.getByText("100.0h")).toBeInTheDocument();
    });

    it("rounds hours to 1 decimal place", () => {
      const preciseStats = { ...mockStats, totalHours: 156.789 };
      render(<RoomStatsCard stats={preciseStats} memberCount={12} />);
      expect(screen.getByText("156.8h")).toBeInTheDocument();
    });

    it("formats average hours per member with 1 decimal", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={12} />);
      expect(screen.getByText(/13\.1h/)).toBeInTheDocument();
    });
  });

  describe("Undefined/Missing Stats", () => {
    it("displays 0.0h when stats is undefined", () => {
      render(<RoomStatsCard stats={undefined} memberCount={0} />);
      expect(screen.getByText("0.0h")).toBeInTheDocument();
    });

    it("displays 0 sessions when stats is undefined", () => {
      render(<RoomStatsCard stats={undefined} memberCount={0} />);
      // Multiple 0s will appear (sessions, members, activeToday)
      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBeGreaterThan(0);
    });

    it("handles missing totalHours", () => {
      const incompleteStats = {
        ...mockStats,
        totalHours: undefined as any,
      };
      render(<RoomStatsCard stats={incompleteStats} memberCount={12} />);
      expect(screen.getByText("0.0h")).toBeInTheDocument();
    });

    it("handles missing totalSessions", () => {
      const incompleteStats = {
        ...mockStats,
        totalSessions: undefined as any,
      };
      render(<RoomStatsCard stats={incompleteStats} memberCount={12} />);
      // Should have at least one "0" for sessions
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  describe("Average Hours Section", () => {
    it("shows average section when memberCount > 0", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={12} />);
      expect(screen.getByText(/Average per member:/)).toBeInTheDocument();
    });

    it("hides average section when memberCount is 0", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={0} />);
      expect(
        screen.queryByText(/Average per member:/)
      ).not.toBeInTheDocument();
    });

    it("hides average section when memberCount is negative (edge case)", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={-1} />);
      expect(
        screen.queryByText(/Average per member:/)
      ).not.toBeInTheDocument();
    });
  });

  describe("Labels and Icons", () => {
    it("displays Total Hours label", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={12} />);
      expect(screen.getByText("Total Hours")).toBeInTheDocument();
    });

    it("displays Sessions label", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={12} />);
      expect(screen.getByText("Sessions")).toBeInTheDocument();
    });

    it("displays Members label", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={12} />);
      expect(screen.getByText("Members")).toBeInTheDocument();
    });

    it("displays Active Today label", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={12} />);
      expect(screen.getByText("Active Today")).toBeInTheDocument();
    });

    it("displays Room Statistics title", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={12} />);
      expect(screen.getByText("Room Statistics")).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("has responsive grid layout", () => {
      const { container } = render(
        <RoomStatsCard stats={mockStats} memberCount={12} />
      );
      const grid = container.querySelector(".grid.grid-cols-2.md\\:grid-cols-4");
      expect(grid).toBeInTheDocument();
    });

    it("has proper gap spacing", () => {
      const { container } = render(
        <RoomStatsCard stats={mockStats} memberCount={12} />
      );
      const grid = container.querySelector(".gap-4");
      expect(grid).toBeInTheDocument();
    });

    it("wraps content in Card component", () => {
      const { container } = render(
        <RoomStatsCard stats={mockStats} memberCount={12} />
      );
      // Card component should add specific classes
      expect(container.querySelector('[class*="border"]')).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles very large numbers", () => {
      const largeStats: RoomStats = {
        totalHours: 99999.9,
        totalSessions: 999999,
        activeToday: 9999,
        avgHoursPerMember: 8888.8,
      };
      render(<RoomStatsCard stats={largeStats} memberCount={9999} />);
      expect(screen.getByText("99999.9h")).toBeInTheDocument();
      expect(screen.getByText("999999")).toBeInTheDocument();
      // 9999 appears twice (members and activeToday)
      const nines = screen.getAllByText("9999");
      expect(nines.length).toBe(2);
    });

    it("handles decimal member counts (though unlikely)", () => {
      render(<RoomStatsCard stats={mockStats} memberCount={12.5} />);
      // Should display as-is
      expect(screen.getByText("12.5")).toBeInTheDocument();
    });

    it("handles zero stats gracefully", () => {
      const zeroStats: RoomStats = {
        totalHours: 0,
        totalSessions: 0,
        activeToday: 0,
        avgHoursPerMember: 0,
      };
      render(<RoomStatsCard stats={zeroStats} memberCount={0} />);
      expect(screen.getByText("0.0h")).toBeInTheDocument();
      expect(screen.getAllByText("0")).toHaveLength(3); // sessions, members, activeToday
    });

    it("handles null stats values", () => {
      const nullStats = {
        totalHours: null as any,
        totalSessions: null as any,
        activeToday: null as any,
        avgHoursPerMember: null as any,
      };
      render(<RoomStatsCard stats={nullStats} memberCount={0} />);
      // Should use default 0 values
      expect(screen.getByText("0.0h")).toBeInTheDocument();
    });

    it("handles negative stats (data integrity issue)", () => {
      const negativeStats: RoomStats = {
        totalHours: -10,
        totalSessions: -5,
        activeToday: -1,
        avgHoursPerMember: -2,
      };
      render(<RoomStatsCard stats={negativeStats} memberCount={5} />);
      // Should display as-is (negative values indicate data issue)
      expect(screen.getByText("-10.0h")).toBeInTheDocument();
    });
  });

  describe("Average Calculation Display", () => {
    it("displays correct average with multiple members", () => {
      const statsWithAvg = { ...mockStats, avgHoursPerMember: 15.5 };
      render(<RoomStatsCard stats={statsWithAvg} memberCount={10} />);
      expect(screen.getByText(/15\.5h/)).toBeInTheDocument();
    });

    it("displays average even with 1 member", () => {
      const singleMemberStats = { ...mockStats, avgHoursPerMember: 42.0 };
      render(<RoomStatsCard stats={singleMemberStats} memberCount={1} />);
      expect(screen.getByText(/42\.0h/)).toBeInTheDocument();
    });

    it("has proper styling for average section", () => {
      const { container } = render(
        <RoomStatsCard stats={mockStats} memberCount={12} />
      );
      const avgSection = container.querySelector(".border-t.border-slate-800");
      expect(avgSection).toBeInTheDocument();
    });
  });
});

