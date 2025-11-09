import type { SupabaseClient } from "@supabase/supabase-js";
import type { Room, DbRoom, CreateRoomRequest } from "@/lib/types";
import { dbRoomToRoom } from "@/lib/types";

export class RoomsService {
  constructor(private supabase: SupabaseClient) {}
}
