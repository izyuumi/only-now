"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cacheRoomAndUser } from "@/utils";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import "./bg.css";

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

	const findRandomRoom = async () => {
		const { data, error } = await supabase.functions.invoke("findRandomRoom");
		if (error) {
			console.log(error);
			return;
		}
		const { room, uuid } = JSON.parse(data);
		cacheRoomAndUser(room, uuid);
		router.push(`/chat/${room}`);
	};

	useEffect(() => {
		const numCircles = 15; // Number of circles you want
		const container = document.getElementById("circles-container");
		if (container) {
			for (let i = 1; i <= numCircles; i++) {
				console.log("making circle");
				const li: HTMLLIElement = document.createElement("li");
				li.style.left = `${Math.random() * 100}%`;
				li.style.width = `${Math.random() * 150}px`;
				li.style.height = li.style.width;
				li.style.animationDuration = `${Math.random() * 20 + 5}s`; // Adjust the range as needed
				li.style.animationDelay = `${Math.random() * 3}s`; // Adjust the range as needed

				li.classList.add("circle");
				li.addEventListener("animationend", makeAnotherCircle);

				// Add event listener for animation iteration
				container.appendChild(li);
			}
		}
	}, []); // The empty dependency array ensures that this effect runs once after the initial render

	const makeAnotherCircle = (e: AnimationEvent) => {
		const numCircles = 1; // Number of circles you want
		const container = document.getElementById("circles-container");
		if (container) {
			for (let i = 1; i <= numCircles; i++) {
				console.log("making circle");
				const li: HTMLLIElement = document.createElement("li");
				li.style.left = `${Math.random() * 100}%`;
				li.style.width = `${Math.random() * 150}px`;
				li.style.height = li.style.width;
				li.style.animationDuration = `${Math.random() * 20 + 5}s`; // Adjust the range as needed
				li.style.animationDelay = `1s`; // Adjust the range as needed

				li.classList.add("circle");
				li.addEventListener("animationend", makeAnotherCircle);

				// Add event listener for animation iteration
				container.appendChild(li);
			}
		}
	};

	const updateCircleStyles = (circle: HTMLLIElement) => {
		console.log("updating circle styles");
		circle.style.left = `${Math.random() * 100}%`;
		circle.style.width = `${Math.random() * 150}px`;
		circle.style.height = circle.style.width;
		circle.style.animationDuration = `${Math.random() * 20 + 5}s`;
		circle.style.animationDelay = `1s`;
	};

	return (
		<div className="bg flex-1 w-full flex flex-col gap-20 items-center justify-center">
			<h1 className="title">Only Now</h1>
			<ul className="circles" id="circles-container"></ul>
			<div className="flex flex-col gap-2">
				<Input
					placeholder="Room code"
					autoFocus
					className="bg-gray-300"
					value={roomCode}
					onChange={(e) => setRoomCode(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							console.log("join room");
						}
					}}
				/>
				{roomCode
					? (
						<Button
							className="bg-violet-400"
							onClick={() => {
								console.log("join room");
							}}
						>
							Join room
						</Button>
					)
					: (
						<>
							<Button onClick={createRoom} className="bg-sky-800">
								Create a room
							</Button>
							<Button
								onClick={findRandomRoom}
								variant="outline"
								className="bg-green-200"
							>
								Join a random room
							</Button>
						</>
					)}
			</div>
		</div>
	);
}
