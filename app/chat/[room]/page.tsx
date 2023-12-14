"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cacheRoomAndUser, getUserFromRoom } from "@/utils";
import { createClient } from "@/utils/supabase/client";
import { ChevronLeft, Share, Unlock, Lock } from "lucide-react";
import { use, useEffect, useState } from "react";
import '../../bg.css';

export default function Chat({ params }: { params: { room: string } }) {
  const supabase = createClient();
  const { toast } = useToast();

  const [myUuid, setMyUuid] = useState("");
  const [otherMessage, setOtherMessage] = useState("");
  const [message, setMessage] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  const checkCache = () => {
    const uuid = getUserFromRoom(params.room);
    if (uuid) {
      setMyUuid(uuid);
      subscribeToRoom();
    } else {
      connectToRoom();
    }
  };

  const connectToRoom = async () => {
    if (myUuid) return;
    const { data, error } = await supabase.functions.invoke("connectToRoom", {
      body: {
        room: params.room,
      },
    });
    if (error) console.error(error);
    const { uuid } = JSON.parse(data);
    setMyUuid(uuid);
    cacheRoomAndUser(params.room, uuid);
    subscribeToRoom();
  };

  const subscribeToRoom = async () => {
    if (!myUuid) return;
    const { data, error } = await supabase.functions.invoke("fetchMessage", {
      body: {
        room: params.room,
        uuid: myUuid,
      },
    });
    if (error) console.error(error);
    const { message } = JSON.parse(data);
    if (message && message !== otherMessage) {
      setOtherMessage(message);
    }
  };

  useEffect(() => {
    const numCircles = 1; // Number of circles you want
    const container = document.getElementById('circles-container');
    if (container) {
      for (let i = 1; i <= numCircles; i++) {
        console.log("making circle");
        const li: HTMLLIElement = document.createElement('li');
        li.style.left = `${Math.random() * 100}%`;
        li.style.width = `${Math.random() * 50}px`;
        li.style.height = li.style.width;
        li.style.animationDuration = `${Math.random() * 20 + 5}s`; // Adjust the range as needed
        li.style.animationDelay = `0s`; // Adjust the range as needed

        li.classList.add('circle');

        // Add event listener for animation iteration
        container.appendChild(li);
      }
    }
  }
  , [message]); // The empty dependency array ensures that this effect runs once after the initial render

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("subscribing to room");

      
      subscribeToRoom();
    }, 500);
    return () => clearInterval(interval);
  }, [myUuid]);

  useEffect(() => {
    checkCache();
  }, []);

  const sendMessage = async () => {
    if (!myUuid) return;
    const { error } = await supabase.functions.invoke("updateMessage", {
      body: {
        room: params.room,
        message,
        author: myUuid,
      },
    });
    if (error) console.error(error);
  };

  useEffect(() => {
    if (message) sendMessage();
  }, [message]);

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Room link copied",
      description: "You can now share this link with your friends",
    });
  };

  const privateRoom = () => {
    setIsPrivate(!isPrivate);
    if (isPrivate) {
      toast({
        title: "Private room",
        description: "This room is now private",
      });
    }
    else {

      toast({
        title: "Public room",
        description: "This room is now public",
      });
    }

  };

  

  return (
    <div className=" bg flex-1 w-full flex flex-col gap-20 items-center justify-center">
            <ul className="circles" id="circles-container">

     
</ul>
      <Button
        className="absolute top-4 left-4"
        variant="ghost"
        onClick={() => (window.location.href = "/")}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <Button
        className="absolute top-4 right-4"
        variant="ghost"
        onClick={copyRoomLink}
      >
        <Share aria-hidden />
      </Button>
      <Button
        className="absolute top-4 right-14"
        variant="ghost"
        onClick={privateRoom}
      >
        {isPrivate ? <Unlock aria-hidden /> : <Lock aria-hidden />}
      </Button>
      <div className="flex flex-col gap-2">
        <CustomTextarea
          who="other"
          message={otherMessage}
          setMessage={setOtherMessage}
        />
        <CustomTextarea who="me" message={message} setMessage={setMessage} />
      </div>
    </div>
  );
}

const CustomTextarea = ({
  who,
  message,
  setMessage,
}: {
  who: "me" | "other";
  message: string;
  setMessage: (message: string) => void;
}) => {
  return (
    <textarea
      cols={30}
      rows={3}
      disabled={who === "other"}
      autoFocus={who === "me"}
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      className="outline-none resize-none text-center text-xl bg-transparent"
      placeholder={who === "me" ? "Type here" : "Waiting for a message..."}
    >
      {message}
    </textarea>
  );
};
