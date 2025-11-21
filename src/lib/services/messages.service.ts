import type { SupabaseClient } from "@supabase/supabase-js";
import type { Message, DbMessage } from "@/lib/types";
import { dbMessageToMessage, dbUserToUser } from "@/lib/types";

export class MessagesService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Fetches messages for a room, ordered by creation time.
   * @param roomId - The room's ID
   * @param limit - Maximum number of messages to fetch (default 50)
   * @returns Array of messages with user profile data
   */
  async getMessages(roomId: string, limit = 50): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from("messages")
      .select(
        `
        *,
        profiles:user_id (
          id,
          display_name,
          avatar_url,
          created_at
        )
      `
      )
      .eq("room_id", roomId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch messages: ${error.message}`);
    }

    if (!data || data.length === 0) return [];

    return data
      .map((msg: any) => ({
        ...dbMessageToMessage(msg as DbMessage),
        user: dbUserToUser(msg.profiles),
      }))
      .reverse(); // Oldest first for display
  }

  /**
   * Sends a new message to a room.
   * @param roomId - The room's ID
   * @param userId - The sender's user ID
   * @param content - The message content
   * @returns The created message with user profile data
   */
  async sendMessage(
    roomId: string,
    userId: string,
    content: string
  ): Promise<Message> {
    if (!content.trim() || content.length > 2000) {
      throw new Error("Message must be between 1 and 2000 characters");
    }

    const { data, error } = await this.supabase
      .from("messages")
      .insert({
        room_id: roomId,
        user_id: userId,
        content: content.trim(),
      })
      .select(
        `
        *,
        profiles:user_id (
          id,
          display_name,
          avatar_url,
          created_at
        )
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }

    return {
      ...dbMessageToMessage(data as DbMessage),
      user: dbUserToUser(data.profiles),
    };
  }

  /**
   * Edits an existing message.
   * @param messageId - The message's ID
   * @param content - The new message content
   */
  async editMessage(messageId: string, content: string): Promise<void> {
    if (!content.trim() || content.length > 2000) {
      throw new Error("Message must be between 1 and 2000 characters");
    }

    const { error } = await this.supabase
      .from("messages")
      .update({
        content: content.trim(),
        edited_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) {
      throw new Error(`Failed to edit message: ${error.message}`);
    }
  }

  /**
   * Soft-deletes a message by setting deleted_at timestamp.
   * @param messageId - The message's ID
   */
  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await this.supabase
      .from("messages")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", messageId);

    if (error) {
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  /**
   * Subscribes to real-time message updates for a room.
   * @param roomId - The room's ID
   * @param onInsert - Callback for new messages
   * @param onUpdate - Callback for edited messages
   * @param onDelete - Callback for deleted messages
   * @returns Unsubscribe function
   */
  subscribeToMessages(
    roomId: string,
    onInsert: (message: Message) => void,
    onUpdate: (message: Message) => void,
    onDelete: (messageId: string) => void
  ): () => void {
    const channel = this.supabase
      .channel(`room:${roomId}:messages`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data } = await this.supabase
            .from("messages")
            .select(
              `
              *,
              profiles:user_id (
                id,
                display_name,
                avatar_url,
                created_at
              )
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            onInsert({
              ...dbMessageToMessage(data as DbMessage),
              user: dbUserToUser(data.profiles),
            });
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { data } = await this.supabase
            .from("messages")
            .select(
              `
              *,
              profiles:user_id (
                id,
                display_name,
                avatar_url,
                created_at
              )
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            if (data.deleted_at) {
              onDelete(data.id);
            } else {
              onUpdate({
                ...dbMessageToMessage(data as DbMessage),
                user: dbUserToUser(data.profiles),
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(channel);
    };
  }
}

