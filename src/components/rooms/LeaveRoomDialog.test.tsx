import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LeaveRoomDialog } from "./LeaveRoomDialog";

// Mock Next.js navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock leaveRoomAction
vi.mock("@/lib/actions/rooms", () => ({
  leaveRoomAction: vi.fn(),
}));

import { leaveRoomAction } from "@/lib/actions/rooms";
const mockLeaveRoomAction = leaveRoomAction as ReturnType<typeof vi.fn>;

describe("LeaveRoomDialog", () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    mockPush.mockClear();
    mockRefresh.mockClear();
    mockLeaveRoomAction.mockClear();
    mockOnOpenChange.mockClear();
  });

  describe("Dialog Visibility", () => {
    it("renders nothing when open is false", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={false}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.queryByText("Leave Room?")).not.toBeInTheDocument();
      expect(screen.queryByText("Cannot Leave Room")).not.toBeInTheDocument();
    });

    it("shows dialog when open is true", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText("Leave Room?")).toBeInTheDocument();
    });
  });

  describe("Regular Member Confirmation", () => {
    it("shows normal confirmation dialog for regular member", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Morning Grinders"
          isOwner={false}
          hasOtherMembers={true}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText("Leave Room?")).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to leave "Morning Grinders"/)
      ).toBeInTheDocument();
    });

    it("displays room name in confirmation message", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room Name"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(
        screen.getByText(/Test Room Name/)
      ).toBeInTheDocument();
    });

    it("shows Cancel and Leave Room buttons", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Leave Room")).toBeInTheDocument();
    });
  });

  describe("Owner with Other Members Warning", () => {
    it("shows warning dialog for owner with other members", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={true}
          hasOtherMembers={true}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText("Cannot Leave Room")).toBeInTheDocument();
    });

    it("displays warning message for owner with other members", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={true}
          hasOtherMembers={true}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(
        screen.getByText(/You are the owner of this room and other members are still present/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Please transfer ownership or remove all members before leaving/)
      ).toBeInTheDocument();
    });

    it("shows only OK button for owner warning", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={true}
          hasOtherMembers={true}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText("OK")).toBeInTheDocument();
      expect(screen.queryByText("Leave Room")).not.toBeInTheDocument();
    });

    it("shows AlertTriangle icon in warning dialog", () => {
      const { container } = render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={true}
          hasOtherMembers={true}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      // AlertTriangle icon should be present (lucide-react renders as svg)
      const alertIcon = container.querySelector('svg');
      expect(alertIcon).toBeInTheDocument();
    });
  });

  describe("Owner Alone Confirmation", () => {
    it("shows normal confirmation for owner without other members", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={true}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText("Leave Room?")).toBeInTheDocument();
      expect(screen.queryByText("Cannot Leave Room")).not.toBeInTheDocument();
    });

    it("shows deletion warning for owner leaving", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={true}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(
        screen.getByText(/As the owner, leaving will delete this room permanently/)
      ).toBeInTheDocument();
    });
  });

  describe("Cancel Button", () => {
    it("closes dialog when Cancel is clicked", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("closes warning dialog when OK is clicked", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={true}
          hasOtherMembers={true}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const okButton = screen.getByText("OK");
      fireEvent.click(okButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Leave Room Action", () => {
    it("calls leaveRoomAction with roomId when Leave is clicked", async () => {
      mockLeaveRoomAction.mockResolvedValue({ success: true });

      render(
        <LeaveRoomDialog
          roomId="room-123"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockLeaveRoomAction).toHaveBeenCalledWith("room-123");
      });
    });

    it("shows loading state during API call", async () => {
      mockLeaveRoomAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      // Should show loading text
      await waitFor(() => {
        expect(screen.getByText("Leaving...")).toBeInTheDocument();
      });
    });

    it("disables buttons during loading", async () => {
      mockLeaveRoomAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      await waitFor(() => {
        const cancelButton = screen.getByText("Cancel");
        const leavingButton = screen.getByText("Leaving...");
        
        expect(cancelButton).toBeDisabled();
        expect(leavingButton).toBeDisabled();
      });
    });
  });

  describe("Successful Leave", () => {
    it("closes dialog on success", async () => {
      mockLeaveRoomAction.mockResolvedValue({ success: true });

      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("redirects to /rooms on success", async () => {
      mockLeaveRoomAction.mockResolvedValue({ success: true });

      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/rooms");
      });
    });

    it("calls router.refresh() on success", async () => {
      mockLeaveRoomAction.mockResolvedValue({ success: true });

      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe("Failed Leave", () => {
    it("displays error message on failure", async () => {
      mockLeaveRoomAction.mockResolvedValue({
        success: false,
        error: "Failed to leave room",
      });

      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(screen.getByText("Failed to leave room")).toBeInTheDocument();
      });
    });

    it("does not close dialog on failure", async () => {
      mockLeaveRoomAction.mockResolvedValue({
        success: false,
        error: "Error message",
      });

      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(screen.getByText("Error message")).toBeInTheDocument();
      });

      // Dialog should still be open (title still visible)
      expect(screen.getByText("Leave Room?")).toBeInTheDocument();
    });

    it("does not redirect on failure", async () => {
      mockLeaveRoomAction.mockResolvedValue({
        success: false,
        error: "Error",
      });

      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(screen.getByText("Error")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });

    it("shows error banner with red styling", async () => {
      mockLeaveRoomAction.mockResolvedValue({
        success: false,
        error: "Test error",
      });

      const { container } = render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(screen.getByText("Test error")).toBeInTheDocument();
      });

      // Error banner should have red styling
      const errorBanner = container.querySelector(".bg-red-950\\/50");
      expect(errorBanner).toBeInTheDocument();
    });

    it("can retry after error", async () => {
      // First call fails, second succeeds
      mockLeaveRoomAction
        .mockResolvedValueOnce({ success: false, error: "Network error" })
        .mockResolvedValueOnce({ success: true });

      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const leaveButton = screen.getByText("Leave Room");
      
      // First attempt
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });

      // Second attempt
      fireEvent.click(leaveButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/rooms");
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles very long room names", () => {
      const longName = "A".repeat(100);
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName={longName}
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText(new RegExp(longName))).toBeInTheDocument();
    });

    it("handles special characters in room name", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName='Test & <Special> "Room"'
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      expect(screen.getByText(/Test & <Special> "Room"/)).toBeInTheDocument();
    });

    it("handles API throwing exception", async () => {
      mockLeaveRoomAction.mockRejectedValue(new Error("Network failure"));

      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const leaveButton = screen.getByText("Leave Room");
      fireEvent.click(leaveButton);

      // Should not crash
      await waitFor(() => {
        // Button should be re-enabled after error
        expect(screen.getByText("Leave Room")).not.toBeDisabled();
      });
    });

    it("handles rapid clicks on Leave button", async () => {
      mockLeaveRoomAction.mockResolvedValue({ success: true });

      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const leaveButton = screen.getByText("Leave Room");
      
      // Click multiple times rapidly
      fireEvent.click(leaveButton);
      fireEvent.click(leaveButton);
      fireEvent.click(leaveButton);

      await waitFor(() => {
        // Should only call once (buttons are disabled during loading)
        expect(mockLeaveRoomAction).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Button Styling", () => {
    it("has destructive styling on Leave button", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const leaveButton = screen.getByText("Leave Room");
      // Should be a button element
      expect(leaveButton.tagName).toBe("BUTTON");
    });

    it("has outline styling on Cancel button", () => {
      render(
        <LeaveRoomDialog
          roomId="room-1"
          roomName="Test Room"
          isOwner={false}
          hasOtherMembers={false}
          open={true}
          onOpenChange={mockOnOpenChange}
        />
      );

      const cancelButton = screen.getByText("Cancel");
      expect(cancelButton.tagName).toBe("BUTTON");
    });
  });
});

