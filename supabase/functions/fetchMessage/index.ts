import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  adminSupabase,
  checkAuthorIsInRoom,
  corsHeaders,
} from "../_shared/cors.ts";
import { checkRoomExists, checkRoomHasEmptySlot } from "../_shared/utils.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { room, uuid } = await req.json();
    console.log({ room, uuid });
    // check room is non-empty strings
    if (!room || !uuid) {
      return new Response("room and uuid are required", {
        status: 400,
      });
    }
    const roomData = await checkRoomExists(room);
    const user_index = checkAuthorIsInRoom(roomData, uuid);

    return new Response(
      JSON.stringify({
        message:
          user_index === "user_one"
            ? roomData.user_two_message
            : roomData.user_one_message,
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
});
