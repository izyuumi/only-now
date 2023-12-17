import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { nanoid } from "https://deno.land/x/nanoid/mod.ts";
import { adminSupabase, corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const newUuid = crypto.randomUUID();
    const newRoomCode = nanoid(8);
    const { data } = await adminSupabase
      .from("room")
      .insert({
        creator: newUuid,
        online_members: [newUuid],
        room_code: newRoomCode,
      })
      .select("*")
      .single();

    if (!data) {
      throw new Error("room not found");
    }

    return new Response(
      JSON.stringify({
        room: data.id,
        uuid: newUuid,
        roomCode: newRoomCode,
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
});
