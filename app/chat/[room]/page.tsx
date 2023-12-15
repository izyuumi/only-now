"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cacheRoomAndUser, getUserFromRoom } from "@/utils";
import { createClient } from "@/utils/supabase/client";
import { ChevronLeft, Lock, Share, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

const MessageSchema = z.object({
  user_id: z.string(),
  message: z.string(),
});
type Message = z.infer<typeof MessageSchema>;

const UserSchema = z.object({
  user_index: z.number(),
  message: z.string(),
});
type User = z.infer<typeof UserSchema>;

const NewUserMessageSchema = z.object({
  user_id: z.string(),
  user_index: z.number(),
});
type NewUserMessage = z.infer<typeof NewUserMessageSchema>;

export default function Chat({ params }: { params: { room: string } }) {
  const supabase = createClient();
  const { toast } = useToast();

  const channel = supabase.channel(`room:${params.room}`);
  const [myUuid, setMyUuid] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [users, setUsers] = useState<Record<string, User>>({});
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
    sendJoinMessage();
    subscribeToRoom();
  };

  const sendJoinMessage = async () => {
    if (!myUuid) return;
    channel.send({
      type: "broadcast",
      event: "new_user",
      payload: {
        user_id: myUuid,
        user_index: Object.keys(users).length,
      },
    });
  };

  const subscribeToRoom = async () => {
    channel
      .on("broadcast", { event: "message" }, ({ payload }) => {
        if (MessageSchema.safeParse(payload.newMessage).success) {
          const newMes = payload.newMessage as Message;
          setUsers((prev) => ({
            ...prev,
            [newMes.user_id]: {
              message: newMes.message,
              user_index: prev[newMes.user_id]?.user_index ?? 0,
            },
          }));
        }
      })
      .on("broadcast", { event: "new_user" }, ({ payload }) => {
        if (NewUserMessageSchema.safeParse(payload).success) {
          const newUser = payload as NewUserMessage;
          setUsers((prev) => ({
            ...prev,
            [newUser.user_id]: {
              message: "",
              user_index: newUser.user_index,
            },
          }));
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          toast({
            title: "Connected to room",
            description: "You can now chat in this room",
            className: "bg-green-100",
          });
        }
      });
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
        description: "This room is now private. New random users cannot join.",
      });
    } else {
      toast({
        title: "Public room",
        description: "This room is now public. Random users can join.",
      });
    }
  };

  return (
    <div className=" bg flex-1 w-full flex flex-col gap-20 items-center justify-center">
      <ul className="circles" id="circles-container"></ul>
      <Button
        className="absolute top-4 left-4"
        variant="outline"
        onClick={() => (window.location.href = "/")}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <div className="flex flex-row absolute top-4 right-4">
        <Button variant="ghost" onClick={privateRoom}>
          {isPrivate ? <Unlock aria-hidden /> : <Lock aria-hidden />}
        </Button>
        <Button variant="outline" onClick={copyRoomLink}>
          <Share aria-hidden />
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {Object.entries(users)
          .filter(([user_id]) => user_id !== myUuid)
          .map(([user_id, user]) => (
            <CustomTextarea
              key={user_id}
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
    <div className="relative border-gray-200 border-solid border-2 rounded-md">
      <label className="text-center text-xl absolute top-0 -translate-y-1/2 left-2 text-gray-400">
        {isMe ? "You" : `User ${props.user_index}`}
      </label>
      <textarea
        cols={30}
        rows={3}
        disabled={!isMe}
        autoFocus={isMe}
        value={message}
        onChange={(e) => isMe && props.setMessage(e.target.value)}
        className="outline-none resize-none text-center text-xl bg-transparent"
        placeholder={isMe ? "Type here" : "Waiting for a message..."}
        defaultValue={""}
      />
    </div>
  );
};
