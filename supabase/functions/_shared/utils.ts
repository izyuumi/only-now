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
    console.log("user_one");
    return "user_one";
  }
  if (!roomData.user_two) {
    console.log("user_two");
    return "user_two";
  }
  if(!roomData.user_three) {
    console.log("user_three");
    return "user_three";
  }
  if(!roomData.user_four) {
    console.log("user_four");
    return "user_four";
  }
  if(!roomData.user_five) {
    console.log("user_five");
    return "user_five";
  }
  throw new Error("room is full");
};
