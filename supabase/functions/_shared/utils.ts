import { adminSupabase } from "./cors.ts";

export const checkRoomExists = async (room: string) => {
  const { data: roomData, error } = await adminSupabase
    .from("room")
    .select("*")
    .eq("id", room)
    .single();
  if (error) throw new Error(error.message);
  if (!roomData) throw new Error("room not found");

  return roomData;
};

export const deleteRoom = async (room: string) => {
  const { error } = await adminSupabase.from("room").delete().eq("id", room);
  if (error) console.error(error);
};
