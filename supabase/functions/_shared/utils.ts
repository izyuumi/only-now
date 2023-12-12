import { adminSupabase } from "./cors.ts";
import { Database } from "./supabase.ts";

export const checkRoomExists = async (room: string) => {
  const { data: roomData, error } = await adminSupabase
    .from("room")
    .select("*")
    .eq("id", room)
    .single();
  if (error) {
    throw new Error(error.message);
  }
  if (!roomData) {
    throw new Error("room not found");
  }
  return roomData;
};

export const checkRoomHasEmptySlot = (
  roomData: Database["public"]["Tables"]["room"]["Row"]
) => {
  if (!roomData.user_one) {
    return "user_one";
  }
  if (!roomData.user_two) {
    return "user_two";
  }
  throw new Error("room is full");
};
