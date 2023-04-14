/* eslint-disable no-console */
import { DefaultEventsMap } from "socket.io/dist/typed-events.js";
import { instrument } from "@socket.io/admin-ui";
import { Server } from "socket.io";

import User from "./class/user.js";
import Room from "./class/room.js";
import Game from "./class/game.js";
import { ServerToClientEvents } from "./@types/socket.js";
import Message from "./class/messsage.js";

const io = new Server<DefaultEventsMap, ServerToClientEvents>({
  cors: {
    origin: "*",
  },
});

instrument(io, { auth: false, mode: "development" });

export const UserMap = new Map<User["id"], User>();
export const RoomMap = new Map<Room["roomName"], Room>();
export const GameMap = new Map<Game["roomName"], Game>();

io.on("connection", (socket) => {
  const newUser = new User(socket.id);
  const tempRoom = `${Math.floor(Math.random() * 1000 + new Date().getTime()).toString()}_temp`;
  newUser.joinRoom(socket, tempRoom);

  /** 사용자 접속 종료 */
  socket.on("disconnect", () => {
    /** 사용자 삭제 처리 */
    const user = UserMap.get(socket.id);
    if (!user) return;
    user.disconnect(socket);

    /** 방 나가기 처리 */
    const room = RoomMap.get(user.currentRoomName);
    if (!room) return;
    room.removeUser(user.id);

    /** 게임 나가기 처리 */
    const game = GameMap.get(user.currentRoomName);
    if (!game) return;
    game.removePlayer(user.id);
  });

  /** 사용자 정보 변경 */
  socket.on("saveUserInfoRequest", (nickname: string, imgIdx: number) => {
    const user = UserMap.get(socket.id);
    if (!user) return;
    user.editUser(nickname, imgIdx);
    io.to(user.currentRoomName).emit("saveUserInfoResponse", user);
  });

  socket.on("createRoomRequest", () => {
    const user = UserMap.get(socket.id);
    if (!user) return;
    console.log(user);
    const newRoom = new Room();
    io.to(user.currentRoomName).emit("createRoomResponse", newRoom.roomName);
  });

  socket.on("joinRoomRequest", (roomName: string) => {
    const user = UserMap.get(socket.id);
    const room = RoomMap.get(roomName);
    if (!user || !room) return;
    user.joinRoom(socket, roomName);
    room.addUser(user.id);
  });

  socket.on("gameReadyRequest", (isReady: boolean) => {
    const user = UserMap.get(socket.id);
    if (!user) return;
    const room = RoomMap.get(user.currentRoomName);
    if (!room) return;
    room.editUser(user.id, isReady);
  });

  socket.on("gameStartRequest", () => {
    const user = UserMap.get(socket.id);
    if (!user) return;
    const room = RoomMap.get(user.currentRoomName);
    if (!room) return;
    const newGame = new Game(room);
    io.to(newGame.roomName).emit("gameStartResponse", newGame.playerList);
    newGame.init();
  });

  socket.on("messageRequest", ({ text }) => {
    const user = UserMap.get(socket.id);
    if (!user) return;
    const message = new Message({ type: "userChat", text, sender: user.nickname });
    message.send(user.currentRoomName);
  });

  socket.on("mafiaTargetRequest", (targetId: string) => {
    const user = UserMap.get(socket.id);
    if (!user) return;
    const game = GameMap.get(user.currentRoomName);
    if (!game) return;
    const player = game.playerList.find((p) => p.id === socket.id);
    if (player?.job !== "mafia") return;
    game.setTargetPlayer(targetId);
  });
});

export default io;
