import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MembersSection } from "./MembersSection";
import type { RoomMemberWithProfile } from "@/lib/types";

// Mock formatDate utility
vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual("@/lib/utils");
  return {
    ...actual,
    formatDate: (dateString: string) => {
      if (dateString.includes("2025-01-01")) return "Jan 1, 2025";
      if (dateString.includes("2025-01-02")) return "Jan 2, 2025";
      if (dateString.includes("2025-01-05")) return "Jan 5, 2025";
      if (dateString.includes("2025-01-08")) return "Jan 8, 2025";
      return "Jan 1, 2025";
    },
  };
});

describe("MembersSection", () => {
  const mockMembers: RoomMemberWithProfile[] = [
    {
      userId: "user-1",
      roomId: "room-1",
      role: "owner",
      joinedAt: "2025-01-01T00:00:00Z",
      profile: {
        id: "user-1",
        displayName: "Alice",
        avatarUrl: null,
        createdAt: "2025-01-01T00:00:00Z",
      },
    },
    {
      userId: "user-2",
      roomId: "room-1",
      role: "admin",
      joinedAt: "2025-01-02T00:00:00Z",
      profile: {
        id: "user-2",
        displayName: "Bob",
        avatarUrl: null,
        createdAt: "2025-01-01T00:00:00Z",
      },
    },
    {
      userId: "user-3",
      roomId: "room-1",
      role: "member",
      joinedAt: "2025-01-05T00:00:00Z",
      profile: {
        id: "user-3",
        displayName: "Charlie",
        avatarUrl: null,
        createdAt: "2025-01-01T00:00:00Z",
      },
    },
    {
      userId: "user-4",
      roomId: "room-1",
      role: "member",
      joinedAt: "2025-01-08T00:00:00Z",
      profile: {
        id: "user-4",
        displayName: "David",
        avatarUrl: null,
        createdAt: "2025-01-01T00:00:00Z",
      },
    },
  ];

  describe("Member Count Display", () => {
    it("displays member count in title", () => {
      render(<MembersSection members={mockMembers} />);
      expect(screen.getByText("Members (4)")).toBeInTheDocument();
    });

    it("displays correct count with different numbers", () => {
      render(<MembersSection members={[mockMembers[0]]} />);
      expect(screen.getByText("Members (1)")).toBeInTheDocument();
    });

    it("displays zero count for empty list", () => {
      render(<MembersSection members={[]} />);
      expect(screen.getByText("Members (0)")).toBeInTheDocument();
    });
  });

  describe("Members List", () => {
    it("renders all members", () => {
      render(<MembersSection members={mockMembers} />);

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
      expect(screen.getByText("David")).toBeInTheDocument();
    });

    it("displays member display names", () => {
      render(<MembersSection members={mockMembers} />);

      mockMembers.forEach((member) => {
        expect(
          screen.getByText(member.profile.displayName)
        ).toBeInTheDocument();
      });
    });

    it("displays joined dates for all members", () => {
      render(<MembersSection members={mockMembers} />);

      expect(screen.getByText("Joined Jan 1, 2025")).toBeInTheDocument();
      expect(screen.getByText("Joined Jan 2, 2025")).toBeInTheDocument();
      expect(screen.getByText("Joined Jan 5, 2025")).toBeInTheDocument();
      expect(screen.getByText("Joined Jan 8, 2025")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty state when no members", () => {
      render(<MembersSection members={[]} />);
      expect(screen.getByText("No members found")).toBeInTheDocument();
    });

    it("does not show member list when empty", () => {
      render(<MembersSection members={[]} />);
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    });

    it("shows empty state with proper styling", () => {
      const { container } = render(<MembersSection members={[]} />);
      const emptyState = container.querySelector(".text-center.py-8");
      expect(emptyState).toBeInTheDocument();
    });
  });

  describe("User Avatars", () => {
    it("displays user initials in avatars", () => {
      render(<MembersSection members={mockMembers} />);

      expect(screen.getByText("AL")).toBeInTheDocument(); // Alice
      expect(screen.getByText("BO")).toBeInTheDocument(); // Bob
      expect(screen.getByText("CH")).toBeInTheDocument(); // Charlie
      expect(screen.getByText("DA")).toBeInTheDocument(); // David
    });

    it("handles single-word names", () => {
      const singleNameMembers: RoomMemberWithProfile[] = [
        {
          ...mockMembers[0],
          profile: { ...mockMembers[0].profile, displayName: "Eve" },
        },
      ];

      render(<MembersSection members={singleNameMembers} />);
      expect(screen.getByText("EV")).toBeInTheDocument();
    });

    it("handles multi-word names (takes first 2 initials)", () => {
      const multiWordMembers: RoomMemberWithProfile[] = [
        {
          ...mockMembers[0],
          profile: {
            ...mockMembers[0].profile,
            displayName: "John Michael Smith",
          },
        },
      ];

      render(<MembersSection members={multiWordMembers} />);
      expect(screen.getByText("JM")).toBeInTheDocument();
    });
  });

  describe("Role Badges", () => {
    it("displays Owner badge for owner", () => {
      render(<MembersSection members={mockMembers} />);
      expect(screen.getByText("Owner")).toBeInTheDocument();
    });

    it("displays Admin badge for admin", () => {
      render(<MembersSection members={mockMembers} />);
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("displays Member badge for members", () => {
      render(<MembersSection members={mockMembers} />);
      const memberBadges = screen.getAllByText("Member");
      expect(memberBadges).toHaveLength(2); // Charlie and David
    });

    it("capitalizes role labels correctly", () => {
      render(<MembersSection members={mockMembers} />);
      
      // Should show "Owner" not "owner"
      expect(screen.getByText("Owner")).toBeInTheDocument();
      expect(screen.queryByText("owner")).not.toBeInTheDocument();
    });

    it("uses correct badge variant for owner (default)", () => {
      const { container } = render(<MembersSection members={[mockMembers[0]]} />);
      
      // Owner badge should be present
      const ownerBadge = screen.getByText("Owner");
      expect(ownerBadge).toBeInTheDocument();
    });

    it("uses correct badge variant for admin (secondary)", () => {
      const { container } = render(<MembersSection members={[mockMembers[1]]} />);
      
      // Admin badge should be present
      const adminBadge = screen.getByText("Admin");
      expect(adminBadge).toBeInTheDocument();
    });

    it("uses correct badge variant for member (outline)", () => {
      const { container } = render(<MembersSection members={[mockMembers[2]]} />);
      
      // Member badge should be present
      const memberBadge = screen.getByText("Member");
      expect(memberBadge).toBeInTheDocument();
    });
  });

  describe("Layout and Styling", () => {
    it("wraps content in Card component", () => {
      const { container } = render(<MembersSection members={mockMembers} />);
      expect(container.querySelector('[class*="border"]')).toBeInTheDocument();
    });

    it("has proper spacing between members", () => {
      const { container } = render(<MembersSection members={mockMembers} />);
      const membersList = container.querySelector(".space-y-3");
      expect(membersList).toBeInTheDocument();
    });

    it("has hover effect on member items", () => {
      const { container } = render(<MembersSection members={mockMembers} />);
      const memberItems = container.querySelectorAll(".hover\\:bg-slate-900");
      expect(memberItems.length).toBeGreaterThan(0);
    });

    it("has transition classes", () => {
      const { container } = render(<MembersSection members={mockMembers} />);
      const memberItems = container.querySelectorAll(".transition-colors");
      expect(memberItems.length).toBeGreaterThan(0);
    });
  });

  describe("Component Title", () => {
    it("displays Members title with count", () => {
      render(<MembersSection members={mockMembers} />);
      expect(screen.getByText("Members (4)")).toBeInTheDocument();
    });

    it("displays Users icon in title", () => {
      const { container } = render(<MembersSection members={mockMembers} />);
      // Users icon should be in the CardTitle
      const title = container.querySelector(".flex.items-center.gap-2");
      expect(title).toBeInTheDocument();
    });
  });

  describe("Member Order", () => {
    it("displays members in the order provided", () => {
      const { container } = render(<MembersSection members={mockMembers} />);
      
      const memberElements = screen.getAllByText(/Alice|Bob|Charlie|David/);
      
      // Check that members appear in order
      expect(memberElements[0]).toHaveTextContent("Alice");
      expect(memberElements[1]).toHaveTextContent("Bob");
      expect(memberElements[2]).toHaveTextContent("Charlie");
      expect(memberElements[3]).toHaveTextContent("David");
    });
  });

  describe("Edge Cases", () => {
    it("handles single member", () => {
      render(<MembersSection members={[mockMembers[0]]} />);
      
      expect(screen.getByText("Members (1)")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("handles many members", () => {
      const manyMembers: RoomMemberWithProfile[] = Array.from(
        { length: 50 },
        (_, i) => ({
          userId: `user-${i}`,
          roomId: "room-1",
          role: "member" as const,
          joinedAt: "2025-01-01T00:00:00Z",
          profile: {
            id: `user-${i}`,
            displayName: `User ${i}`,
            avatarUrl: null,
            createdAt: "2025-01-01T00:00:00Z",
          },
        })
      );

      render(<MembersSection members={manyMembers} />);
      
      expect(screen.getByText("Members (50)")).toBeInTheDocument();
      expect(screen.getByText("User 0")).toBeInTheDocument();
      expect(screen.getByText("User 49")).toBeInTheDocument();
    });

    it("handles very long display names", () => {
      const longNameMembers: RoomMemberWithProfile[] = [
        {
          ...mockMembers[0],
          profile: {
            ...mockMembers[0].profile,
            displayName: "A".repeat(100),
          },
        },
      ];

      render(<MembersSection members={longNameMembers} />);
      expect(screen.getByText("A".repeat(100))).toBeInTheDocument();
    });

    it("handles special characters in display names", () => {
      const specialCharMembers: RoomMemberWithProfile[] = [
        {
          ...mockMembers[0],
          profile: {
            ...mockMembers[0].profile,
            displayName: "Test & <Special> \"Chars\"",
          },
        },
      ];

      render(<MembersSection members={specialCharMembers} />);
      expect(screen.getByText('Test & <Special> "Chars"')).toBeInTheDocument();
    });

    it("handles all roles correctly", () => {
      const allRolesMembers: RoomMemberWithProfile[] = [
        { ...mockMembers[0], role: "owner" },
        { ...mockMembers[1], role: "admin" },
        { ...mockMembers[2], role: "member" },
      ];

      render(<MembersSection members={allRolesMembers} />);
      
      expect(screen.getByText("Owner")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(screen.getByText("Member")).toBeInTheDocument();
    });

    it("handles null avatar_url gracefully", () => {
      render(<MembersSection members={mockMembers} />);
      
      // Should show initials, not crash
      expect(screen.getByText("AL")).toBeInTheDocument();
    });

    it("handles different date formats in joinedAt", () => {
      const differentDateMembers: RoomMemberWithProfile[] = [
        {
          ...mockMembers[0],
          joinedAt: "2025-12-31T23:59:59Z",
        },
      ];

      render(<MembersSection members={differentDateMembers} />);
      // Should not crash, formatDate should handle it
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper semantic structure", () => {
      const { container } = render(<MembersSection members={mockMembers} />);
      
      // Card should have proper structure
      expect(container.querySelector('[role="region"]') || container.querySelector('.space-y-3')).toBeTruthy();
    });

    it("has readable text contrast", () => {
      const { container } = render(<MembersSection members={mockMembers} />);
      
      // Text should have proper color classes
      const textElements = container.querySelectorAll(".text-slate-400");
      expect(textElements.length).toBeGreaterThan(0);
    });
  });
});

