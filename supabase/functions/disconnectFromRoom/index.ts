import { adminSupabase, corsHeaders } from "../_shared/cors.ts";
import { deleteRoom } from "../_shared/utils.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { room, uuid } = await req.json();
    if (!room || !uuid) {
      return new Response("missing room or uuid", { status: 400 });
    }
    const { data: roomData, error } = await adminSupabase
      .from("room")
      .select("id,online_members")
      .eq("id", room)
      .single();
    if (error) throw new Error(error.message);
    if (!roomData) return new Response("room not found", { status: 404 });
    const { online_members } = roomData;
    if (!online_members) {
      await deleteRoom(room);
      return new Response("no online members", { status: 404 });
    }
    if (!online_members.includes(uuid)) {
      return new Response("uuid not found", { status: 404 });
    }
    if (online_members.length === 1) {
      await deleteRoom(room);
      return new Response("ok", { headers: corsHeaders });
    }
    const newOnlineMembers = online_members.filter(
      (member: string) => member !== uuid,
    );
    const { error: updateError } = await adminSupabase
      .from("room")
      .update({ online_members: newOnlineMembers })
      .eq("id", room);
    if (updateError) throw new Error(updateError.message);
    return new Response("ok", { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
});
