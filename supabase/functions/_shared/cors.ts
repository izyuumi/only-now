import { createClient } from "https://esm.sh/@supabase/supabase-js@2.31.0";

import { Database } from "./supabase.ts";

export const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } =
  Deno.env.toObject();

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export const adminSupabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
    auth: {
      persistSession: false,
    },
  }
);

export const checkAuthorIsInRoom = (
  roomData: Database["public"]["Tables"]["room"]["Row"],
  author: string
): "user_one" | "user_two" => {
  if (roomData.user_one === author) {
    return "user_one";
  }
  if (roomData.user_two === author) {
    return "user_two";
  }
  throw new Error("author not in room");
};
