"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cacheRoomAndUser } from "@/utils";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import './bg.css';

export default function Index() {
  const supabase = createClient();
  const router = useRouter();

  const [roomCode, setRoomCode] = useState("");

  const createRoom = async () => {
    const { data } = await supabase.functions.invoke("createRoom");
    const { room, uuid } = JSON.parse(data);
    cacheRoomAndUser(room, uuid);
    router.push(`/chat/${room}`);
  };

  return (
    <div className="bg flex-1 w-full flex flex-col gap-20 items-center justify-center">
      <h1 className="title">Only Now</h1>
      <ul className="circles">
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>        
      </ul>
      
      <div className="flex flex-col gap-2">
        <Input
          placeholder="Room code"
          autoFocus
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
        {roomCode ? (
          <Button
            onClick={() => {
              console.log("join room");
            }}
          >
            Join room
          </Button>
        ) : (
          <>
            <Button onClick={createRoom}>Create a room</Button>
            <Button>Join a random room</Button>
          </>
        )}
      </div>

    </div>
    
  );
}
