import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminSupabase, corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { code } = await req.json();
    if (!code) return new Response("no code provided", { status: 400 });
    const { data: roomData, error } = await adminSupabase
      .from("room")
      .select("id")
      .eq("room_code", code)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    if (!roomData) return new Response("no rooms found", { status: 404 });

    const { id } = roomData;
    const newUuid = crypto.randomUUID();
    return new Response(JSON.stringify({ room: id, uuid: newUuid }), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
});
