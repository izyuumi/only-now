import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminSupabase, corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { data: roomData, error } = await adminSupabase
      .from("room")
      .select("id,online_members")
      .eq("private", "FALSE")
      .order("id", { ascending: true })
      .limit(1);
    if (error) throw new Error(error.message);
    if (!roomData || roomData.length === 0)
      return new Response("no rooms found", { status: 404 });

    const { id, online_members } = roomData[0];
    const newUuid = crypto.randomUUID();
    const { error: updateError } = await adminSupabase.from("room").update({
      online_members: [...(online_members ?? []), newUuid],
    });
    if (updateError) throw new Error(updateError.message);

    return new Response(JSON.stringify({ room: id, uuid: newUuid }), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
});
