"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cacheRoomAndUser, getUserFromRoom, removeUserFromRoom } from "@/utils";
import { createClient } from "@/utils/supabase/client";
import { ChevronLeft, Lock, Share, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { generateCircle } from "../../../components/ui/circles-utility";
import { z } from "zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export default function Chat({
  params,
}: Readonly<{ params: { room: string } }>) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();

  const channel = supabase.channel(`room:${params.room}`);
  const [myUuid, setMyUuid] = useState("");
  const [isPrivateRoom, setIsPrivateRoom] = useState(true);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [myMessage, setMyMessage] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState("");

  /**
   * Checks if the room is cached.
   * If the room is cached, it subscribes to the room.
   * If the room is not cached, it connects to the room.
   * @returns nothing
   * @sideeffect sets `myUuid`
   * @sideeffect runs `subscribeToRoom`
   * @sideeffect runs `connectToRoom`
   */
  const checkCache = () => {
    const uuid = getUserFromRoom(params.room);
    if (uuid) {
      setMyUuid(uuid);
      subscribeToRoom();
    } else {
      connectToRoom();
    }
  };

  /**
   * Checks if the user is the host of the room.
   * @returns nothing
   * @sideeffect sets `isHost`
   * @sideeffect removes URL params
   */
  const checkIsHost = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("host") === "true") {
      setIsHost(true);
      urlParams.delete("host");
      window.history.replaceState({}, "", `${window.location.pathname}`);
    }
  };

  /**
   * Checks local storage for a room code associated with the room.
   * @returns nothing
   * @sideeffect sets `roomCode`
   */
  const checkForRoomCode = async () =>
    setRoomCode(localStorage.getItem(`roomCode:${params.room}`) ?? "");

  /**
   * Connects to the room from the room code in the URL.
   * @returns nothing
   * @sideeffect shows an error message if something goes wrong
   * @sideeffect sets `myUuid`
   * @sideeffect runs `cacheRoomAndUser`
   * @sideeffect runs `sendJoinMessage`
   * @sideeffect runs `subscribeToRoom`
   */
  const connectToRoom = async () => {
    if (myUuid) return;
    const { data, error } = await supabase.functions.invoke("connectToRoom", {
      body: {
        room: params.room,
      },
    });
    if (error) {
      toast({
        title: "Something went wrong. Please try again later.",
        description: error.message,
      });
      console.error(error);
      return;
    }
    const { uuid } = JSON.parse(data);
    setMyUuid(uuid);
    cacheRoomAndUser(params.room, uuid);
    sendJoinMessage();
    subscribeToRoom();
  };

  /**
   * Sends a join message to the channel associated with the room.
   * @returns nothing
   * @sideeffect other users will receive broadcasted message
   */
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

  /**
   * Subscribes to the channel associated with the room.
   * @returns nothing
   * @sideeffect shows a toast
   */
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
            className: "bg-green-800",
          });
        }
      });
  };

  useEffect(() => {
    checkCache();
    checkIsHost();
    checkForRoomCode();
  }, []);

  /**
   * Sends a message to the channel associated with the room.
   * @returns nothing
   * @sideeffect updates `myMessage` to only last 2 lines of the message
   */
  const sendMessage = async () => {
    if (!myUuid) return;
    const lastLine = myMessage.split("\n").slice(-3).join("\n");
    setMyMessage(lastLine);
    const newMessage: Message = {
      user_id: myUuid,
      message: lastLine,
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
    if (myMessage) {
      sendMessage();
      generateCircle();
    }
  }, [myMessage]);

  /**
   * Copies the room link to the clipboard.
   * @returns nothing
   * @sideeffect shows a toast
   * @sideeffect copies the room link to the clipboard
   */
  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Room link copied",
      description: "You can now share this link with your friends",
    });
  };

  /**
   * Copies the room code to the clipboard.
   * @returns nothing
   * @sideeffect shows a toast
   * @sideeffect copies the room code to the clipboard
   */
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({
      title: "Room code copied",
      description: "You can now share this code with your friends",
    });
  };

  /**
   * Toggles the room between private and public.
   * If the room is private, it makes it public.
   * If the room is public, it makes it private.
   * @returns nothing
   * @sideeffect shows a toast
   * @sideeffect sets the isPrivateRoom state
   * @sideeffect updates the room in the database
   */
  const togglePrivateRoom = async () => {
    const { data, error } = await supabase.functions.invoke("setVisibility", {
      body: {
        room: params.room,
        uuid: myUuid,
        isPrivate: !isPrivateRoom,
      },
    });
    console.log(data);
    if (error) {
      toast({
        title: "Something went wrong. Please try again later.",
        description: error.message,
      });
      return;
    }
    if (!isPrivateRoom) {
      toast({
        title: "Private room",
        description: "This room is now private. New random users cannot join.",
      });
      setIsPrivateRoom(true);
      return;
    }
    toast({
      title: "Public room",
      description: "This room is now public. Random users can join.",
    });
    setIsPrivateRoom(false);
  };

  const disconnectFromRoom = async (ev?: BeforeUnloadEvent) => {
    if (!myUuid) return;
    if (ev) {
      ev.preventDefault();
      ev.returnValue = "";
    }
    removeUserFromRoom(params.room);
    channel.unsubscribe();
    await supabase.functions.invoke("disconnectFromRoom", {
      body: {
        room: params.room,
        uuid: myUuid,
      },
    });
  };

  useEffect(() => {
    window.addEventListener("beforeunload", disconnectFromRoom);
    window.addEventListener("unload", disconnectFromRoom);
    return () => {
      window.removeEventListener("beforeunload", disconnectFromRoom);
      window.removeEventListener("unload", disconnectFromRoom);
    };
  });

  return (
    <div className=" bg flex-1 w-full flex flex-col gap-20 items-center justify-center">
      <ul className="box" id="box-container"></ul>
      <Button
        className="absolute top-4 left-4 white-button"
        variant="link"
        onClick={() => {
          disconnectFromRoom();
          router.push("/");
        }}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <div className="flex flex-row absolute top-4 right-4">
        {isHost && (
          <Button
            className=" white-button"
            variant="link"
            onClick={togglePrivateRoom}
          >
            {isPrivateRoom ? <Lock aria-hidden /> : <Unlock aria-hidden />}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button className="white-button" variant="link">
              <Share aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <Button
                className="white-button w-full"
                variant="outline"
                onClick={copyRoomLink}
              >
                Copy room link
              </Button>
            </DropdownMenuItem>
            {roomCode !== "" && (
              <DropdownMenuItem>
                <Button
                  className="white-button w-full"
                  variant="outline"
                  onClick={copyRoomCode}
                >
                  Copy room code ({roomCode})
                </Button>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex flex-col gap-2">
        {Object.entries(users)
          .filter(([user_id]) => user_id !== myUuid)
          .map(([user_id, user]) => (
            <CustomTextarea
              key={user_id}
              who="other"
              message={user.message}
              user_index={user_id.split("-")[0]}
            />
          ))}
        <CustomTextarea
          who="me"
          user_index={myUuid.split("-")[0]}
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
}

type TextareaProps = (MeTextareaProps | OtherTextareaProps) & {
  message: string;
  user_index: string;
};

const CustomTextarea = (props: TextareaProps) => {
  const { who, message, user_index } = props;

  const isMe = who === "me";

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let textarea = textareaRef.current;
    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
    }
  }, [message]);

  return (
    <div className="relative border-gray-200 border-solid border-2 rounded-md group">
      <label className="text-center text-xl absolute bottom-1 right-2 text-gray-400 opacity-0 group-hover:opacity-100">
        {`${isMe ? "You" : "User"} ${user_index}`}
      </label>
      <textarea
        cols={30}
        rows={3}
        disabled={!isMe}
        autoFocus={isMe}
        value={message}
        onChange={(e) => isMe && props.setMessage(e.target.value)}
        className="outline-none resize-none text-center text-xl bg-transparent text-slate-200"
        placeholder={isMe ? "Type here" : "Waiting for a message..."}
        defaultValue={""}
      />
    </div>
  );
};
