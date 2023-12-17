"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cacheRoomAndUser } from "@/utils";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { initializeBackgroundAnimation } from "@/components/BackgroundAnimation";
import { GithubIcon, HelpCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";

export default function Index() {
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initializeBackgroundAnimation();
  }, []);

  /**
   * Creates a room and joins it.
   * @returns nothing
   * @sideeffect redirects to the room if the room code is valid
   * @sideeffect shows an error message if something goes wrong
   */
  const createRoom = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.functions.invoke("createRoom");
    if (error) {
      setIsLoading(false);
      toast({
        title: "Something went wrong. Please try again later.",
        description: error.message,
      });
      return;
    }
    const { room, uuid, roomCode } = JSON.parse(data);
    if (!room || !uuid) {
      setIsLoading(false);
      toast({
        title: "Something went wrong. Please try again later.",
        description: "Room or UUID not found.",
      });
      return;
    }
    cacheRoomAndUser(room, uuid);
    if (roomCode) {
      localStorage.setItem(`roomCode:${room}`, roomCode);
    }
    router.push(`/chat/${room}?host=true`);
  };

  /**
   * Finds a random room and joins it.
   * @returns nothing
   * @sideeffect redirects to the room if the room code is valid
   * @sideeffect shows an error message if the room code is invalid
   */
  const findRandomRoom = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.functions.invoke("findRandomRoom");
    if (error) {
      console.log(error);
      setIsLoading(false);
      return;
    }
    const { room, uuid } = JSON.parse(data);
    cacheRoomAndUser(room, uuid);
    router.push(`/chat/${room}`);
  };

  /**
   * Join a room from a room code.
   * Parses the room code from the URL and joins the room.
   * @returns nothing
   * @sideeffect redirects to the room if the room code is valid
   * @sideeffect shows an error message if the room code is invalid
   * @sideeffect shows an error message if something goes wrong
   */
  const joinFromCode = async () => {
    if (!roomCode) return;
    setIsLoading(true);
    const { data, error } = await supabase.functions.invoke("joinFromCode", {
      body: {
        code: roomCode.trim(),
      },
    });
    if (error) {
      setIsLoading(false);
      toast({
        title: "Something went wrong. Please try again later.",
        description: error.message,
      });
      return;
    }
    const { room, uuid } = JSON.parse(data);
    cacheRoomAndUser(room, uuid);
    router.push(`/chat/${room}`);
  };

  return (
    <div className="bg flex-1 w-full flex flex-col gap-20 items-center justify-center relative">
      <h1 className="title">OnlyNow</h1>
      <div className="absolute top-4 right-4">
        <Dialog>
          <DialogTrigger>
            <HelpCircle color="white" size={24} aria-hidden />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>What is OnlyNow?</DialogTitle>
              <DialogDescription>
                OnlyNow is a chat app that lets you chat with people in
                real-time and only in real-time.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 w-full justify-end">
              <Link href="https://github.com/izyumidev/only-now">
                <GithubIcon size={24} />
              </Link>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <ul className="box" id="box-container"></ul>
      <div className="flex flex-col gap-2 w-64 max-w-[90%]">
        <Input
          placeholder="Room code"
          autoFocus
          className="bg-gray-300 text-black"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && joinFromCode()}
          type="text"
          autoComplete="off"
        />
        {roomCode ? (
          <Button
            className="bg-violet-400 text-black"
            onClick={() => joinFromCode()}
          >
            Join room
          </Button>
        ) : (
          <>
            <Button
              onClick={createRoom}
              className="bg-sky-800 text-white hover:text-black"
            >
              Create a room
            </Button>
            <Button
              onClick={findRandomRoom}
              variant="outline"
              className="bg-green-200 text-black"
            >
              Join a random room
            </Button>
          </>
        )}
      </div>
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <div className="loader">
            <Loader2
              height={64}
              width={64}
              className="animate-spin"
              color="white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
