import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  adminSupabase,
  checkAuthorIsInRoom,
} from "../_shared/cors.ts";
import { Database } from "../_shared/supabase.ts";
import { checkRoomExists } from "../_shared/utils.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { room, message, author } = await req.json();
    // check room, message, and author are all non-empty strings
    if (!room || !message || !author) {
      return new Response("room, message, and author are required", {
        status: 400,
      });
    }
    const roomData = await checkRoomExists(room);
    const user_index = checkAuthorIsInRoom(roomData, author);
    const { error } = await adminSupabase.from("room").upsert({
      id: room,
      [`${user_index}_message`]: message,
    });
    if (error) {
      throw new Error(error.message);
    }
    return new Response("ok", { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
});
