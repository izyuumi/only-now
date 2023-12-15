import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { adminSupabase, corsHeaders } from "../_shared/cors.ts";
import { checkRoomExists, deleteRoom } from "../_shared/utils.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { room } = await req.json();
    if (!room) {
      return new Response("room is required", {
        status: 400,
      });
    }

    const roomData = await checkRoomExists(room);
    if (!roomData.online_members) {
      await deleteRoom(room);
      throw new Error("room has no online members");
    }

    const newUuid = crypto.randomUUID();
    const { error } = await adminSupabase.from("room").upsert({
      id: room,
      online_members: [...roomData.online_members, newUuid],
    });
    if (error) {
      throw new Error(error.message);
    }

    return new Response(
      JSON.stringify({
        uuid: newUuid,
      }),
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
});
