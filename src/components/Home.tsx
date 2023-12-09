import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Home = () => {
  const [roomCode, setRoomCode] = useState<string>("");

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div className="w-64 gap-2 flex flex-col  ">
        <Input
          className="w-full"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          type="text"
          placeholder="Enter a room code"
        />
        {roomCode ? (
          <Button className="w-full">Enter room</Button>
        ) : (
          <>
            <Button className="w-full">Create a new room</Button>
            <Button className="w-full">Enter a random room</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
