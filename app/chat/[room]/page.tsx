"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cacheRoomAndUser, getUserFromRoom } from "@/utils";
import { createClient } from "@/utils/supabase/client";
import { ChevronLeft, Share, Unlock, Lock } from "lucide-react";
import { useEffect, useState } from "react";

interface Message {
  user_id: string;
  message: string;
}

interface User {
  user_id: string;
  user_index: number;
  message: string;
}

export default function Chat({ params }: { params: { room: string } }) {
  const supabase = createClient();
  const { toast } = useToast();

  const channel = supabase.channel(`room:${params.room}`);
  const [myUuid, setMyUuid] = useState("");
  const [otherMessage, setOtherMessage] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [myMessage, setMyMessage] = useState("");

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
    channel
      .on("broadcast", { event: "message" }, ({ payload, event }) => {
        console.log(payload);
        if (payload.newMessage) {
          const newMes = payload.newMessage as Message;
          const newMesUser = users.find(
            (user) => user.user_id == newMes.user_id
          );

          if (newMesUser) {
            newMesUser.message = newMes.message;
            setUsers((prev) => [
              ...prev.filter((user) => user.user_id !== newMes.user_id),
              newMesUser,
            ]);
          } else {
            setUsers((prev) => [
              ...prev,
              {
                user_id: newMes.user_id,
                message: newMes.message,
                user_index: 2,
              },
            ]);
          }
        }
      })
      .subscribe((status) => console.log("subscribed to room", status));
  };

  useEffect(() => {
    checkCache();
  }, []);

  const sendMessage = async () => {
    if (!myUuid) return;
    const newMessage: Message = {
      user_id: myUuid,
      message: myMessage,
    };
    channel.send({
      type: "broadcast",
      event: "message",
      payload: {
        newMessage,
      },
    });
  };

  useEffect(() => {
    if (myMessage) sendMessage();
  }, [myMessage]);

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
    } else {
      toast({
        title: "Public room",
        description: "This room is now public",
      });
    }
  };

  return (
    <div className=" bg flex-1 w-full flex flex-col gap-20 items-center justify-center">
      <ul className="circles" id="circles-container"></ul>
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
        {users.map((user) => (
          <CustomTextarea
            key={user.user_id}
            who="other"
            message={user.message}
            user_index={user.user_index}
          />
        ))}
        <CustomTextarea
          who="me"
          message={myMessage}
          setMessage={setMyMessage}
        />
      </div>
    </div>
  );
}

interface MeTextareaProps {
  who: "me";
  setMessage: (message: string) => void;
}

interface OtherTextareaProps {
  who: "other";
  user_index: number;
}

type TextareaProps = (MeTextareaProps | OtherTextareaProps) & {
  message: string;
};

const CustomTextarea = (props: TextareaProps) => {
  const { who, message } = props;

  const isMe = who === "me";

  return (
    <textarea
      cols={30}
      rows={3}
      disabled={!isMe}
      autoFocus={isMe}
      value={message}
      onChange={(e) => isMe && props.setMessage(e.target.value)}
      className="outline-none resize-none text-center text-xl bg-transparent"
      placeholder={isMe ? "Type here" : "Waiting for a message..."}
    >
      {message}
    </textarea>
  );
};
