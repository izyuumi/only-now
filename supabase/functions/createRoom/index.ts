import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminSupabase, corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const newUuid = crypto.randomUUID();
    const { data } = await adminSupabase
      .from("room")
      .insert({
        user_one: newUuid,
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
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
});
