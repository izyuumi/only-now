import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminSupabase, corsHeaders } from "../_shared/cors.ts";
import { checkRoomExists, checkRoomHasEmptySlot } from "../_shared/utils.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { room } = await req.json();
    // check room is non-empty strings
    if (!room) {
      return new Response("room is required", {
        status: 400,
      });
    }
    const roomData = await checkRoomExists(room);
    const user_index = checkRoomHasEmptySlot(roomData);

    const newUuid = crypto.randomUUID();
    const { error } = await adminSupabase.from("room").upsert({
      id: room,
      [user_index]: newUuid,
    });
    if (error) {
      throw new Error(error.message);
    }

    return new Response(
      JSON.stringify({
        uuid: newUuid,
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
});
