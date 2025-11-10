import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoomHeader } from "./RoomHeader";
import type { RoomWithDetails } from "@/lib/types";

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock formatDate utility
vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual("@/lib/utils");
  return {
    ...actual,
    formatDate: (dateString: string) => "Jan 1, 2025",
  };
});

describe("RoomHeader", () => {
  const mockOwnerRoom: RoomWithDetails = {
    id: "room-1",
    name: "Morning Grinders",
    description: "Early bird study group for productivity",
    createdBy: "user-1",
    createdAt: "2025-01-01T00:00:00Z",
    role: "owner",
    memberCount: 5,
    members: [],
    stats: undefined,
  };

  const mockMemberRoom: RoomWithDetails = {
    ...mockOwnerRoom,
    role: "member",
    memberCount: 10,
  };

  beforeEach(() => {
    mockPush.mockClear();
  });

  describe("Room Information Display", () => {
    it("renders room name", () => {
      render(<RoomHeader room={mockOwnerRoom} currentUserId="user-1" />);
      expect(screen.getByText("Morning Grinders")).toBeInTheDocument();
    });

    it("renders room description when provided", () => {
      render(<RoomHeader room={mockOwnerRoom} currentUserId="user-1" />);
      expect(
        screen.getByText("Early bird study group for productivity")
      ).toBeInTheDocument();
    });

    it('shows "No description" when description is null', () => {
      const roomWithoutDescription = { ...mockOwnerRoom, description: null };
      render(
        <RoomHeader room={roomWithoutDescription} currentUserId="user-1" />
      );
      expect(screen.getByText("No description")).toBeInTheDocument();
    });

    it('shows "No description" when description is empty string', () => {
      const roomWithEmptyDescription = { ...mockOwnerRoom, description: "" };
      render(
        <RoomHeader room={roomWithEmptyDescription} currentUserId="user-1" />
      );
      expect(screen.getByText("No description")).toBeInTheDocument();
    });

    it("displays created date formatted correctly", () => {
      render(<RoomHeader room={mockOwnerRoom} currentUserId="user-1" />);
      expect(screen.getByText("Created Jan 1, 2025")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("shows Back to Rooms button", () => {
      render(<RoomHeader room={mockOwnerRoom} currentUserId="user-1" />);
      expect(screen.getByText("Back to Rooms")).toBeInTheDocument();
    });

    it("navigates to /rooms when Back button is clicked", () => {
      render(<RoomHeader room={mockOwnerRoom} currentUserId="user-1" />);
      const backButton = screen.getByText("Back to Rooms");
      fireEvent.click(backButton);
      expect(mockPush).toHaveBeenCalledWith("/rooms");
    });
  });

  describe("Action Buttons", () => {
    it("shows Settings button only for room owner", () => {
      render(<RoomHeader room={mockOwnerRoom} currentUserId="user-1" />);
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("does not show Settings button for regular member", () => {
      render(<RoomHeader room={mockMemberRoom} currentUserId="user-2" />);
      expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    });

    it("shows Leave Room button for all members", () => {
      render(<RoomHeader room={mockOwnerRoom} currentUserId="user-1" />);
      expect(screen.getByText("Leave Room")).toBeInTheDocument();
    });

    it("shows Leave Room button for regular members", () => {
      render(<RoomHeader room={mockMemberRoom} currentUserId="user-2" />);
      expect(screen.getByText("Leave Room")).toBeInTheDocument();
    });

    it("shows alert when Settings button is clicked (TODO feature)", () => {
      // Mock window.alert
      const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});

      render(<RoomHeader room={mockOwnerRoom} currentUserId="user-1" />);
      const settingsButton = screen.getByText("Settings");
      fireEvent.click(settingsButton);

      expect(alertMock).toHaveBeenCalledWith("Room settings coming soon!");
      alertMock.mockRestore();
    });
  });

  describe("Leave Room Dialog", () => {
    it("does not show dialog initially", () => {
      render(<RoomHeader room={mockOwnerRoom} currentUserId="user-1" />);
      // Dialog content should not be visible
      expect(screen.queryByText("Leave Room?")).not.toBeInTheDocument();
    });

    it("opens LeaveRoomDialog when Leave Room button is clicked", () => {
      render(<RoomHeader room={mockOwnerRoom} currentUserId="user-1" />);
      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      // Dialog should now be visible (check for dialog content)
      expect(
        screen.getByText(/Are you sure you want to leave/i)
      ).toBeInTheDocument();
    });

    it("passes correct props to LeaveRoomDialog for owner with other members", () => {
      render(<RoomHeader room={mockOwnerRoom} currentUserId="user-1" />);
      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      // Should show warning for owner with other members
      expect(screen.getByText("Cannot Leave Room")).toBeInTheDocument();
    });

    it("passes correct props to LeaveRoomDialog for owner alone", () => {
      const ownerAlone = { ...mockOwnerRoom, memberCount: 1 };
      render(<RoomHeader room={ownerAlone} currentUserId="user-1" />);
      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      // Should show normal confirmation for owner alone
      expect(screen.getByText("Leave Room?")).toBeInTheDocument();
      expect(screen.getByText(/As the owner, leaving will delete this room permanently/)).toBeInTheDocument();
    });

    it("passes correct props to LeaveRoomDialog for regular member", () => {
      render(<RoomHeader room={mockMemberRoom} currentUserId="user-2" />);
      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      // Should show normal confirmation for member
      expect(screen.getByText("Leave Room?")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading hierarchy", () => {
      const { container } = render(
        <RoomHeader room={mockOwnerRoom} currentUserId="user-1" />
      );
      const heading = container.querySelector("h1");
      expect(heading).toBeInTheDocument();
      expect(heading?.textContent).toBe("Morning Grinders");
    });

    it("has descriptive button text", () => {
      render(<RoomHeader room={mockOwnerRoom} currentUserId="user-1" />);
      expect(screen.getByText("Back to Rooms")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("Leave Room")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles very long room names", () => {
      const longNameRoom = {
        ...mockOwnerRoom,
        name: "A".repeat(200),
      };
      render(<RoomHeader room={longNameRoom} currentUserId="user-1" />);
      expect(screen.getByText("A".repeat(200))).toBeInTheDocument();
    });

    it("handles very long descriptions", () => {
      const longDescRoom = {
        ...mockOwnerRoom,
        description: "B".repeat(500),
      };
      render(<RoomHeader room={longDescRoom} currentUserId="user-1" />);
      expect(screen.getByText("B".repeat(500))).toBeInTheDocument();
    });

    it("handles special characters in room name", () => {
      const specialCharRoom = {
        ...mockOwnerRoom,
        name: "Test & <Special> \"Chars\"",
      };
      render(<RoomHeader room={specialCharRoom} currentUserId="user-1" />);
      expect(screen.getByText('Test & <Special> "Chars"')).toBeInTheDocument();
    });

    it("handles memberCount of 0", () => {
      const emptyRoom = { ...mockOwnerRoom, memberCount: 0 };
      render(<RoomHeader room={emptyRoom} currentUserId="user-1" />);
      // Should still render without errors
      expect(screen.getByText("Morning Grinders")).toBeInTheDocument();
    });
  });
});

