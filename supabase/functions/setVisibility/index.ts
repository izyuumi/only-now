import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminSupabase, corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { room, uuid, isPrivate } = await req.json();
    if (!room || !uuid || isPrivate === undefined) {
      return new Response("room, uuid, and isPrivate are required", {
        status: 400,
      });
    }

    const { data, error } = await adminSupabase
      .from("room")
      .update({
        private: isPrivate,
      })
      .eq("creator", uuid)
      .eq("id", room)
      .select()
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return new Response("room not found", { status: 404 });
    }

    return new Response(JSON.stringify({ room, isPrivate: data.private }), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
});
