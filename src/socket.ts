import { DefaultEventsMap } from "socket.io/dist/typed-events.js";
import { instrument } from "@socket.io/admin-ui";
import { Server } from "socket.io";
import User from "./class/user.js";
import Room from "./class/room.js";
import Game from "./class/game.js";
import { ServerToClientEvents } from "./@types/socket.js";
import { sendMessage } from "./utils/messsage.js";
import MaifaLog from "./utils/log.js";

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
  try {
    /** 사용자 접속 종료 */
    socket.on("disconnect", () => {
      const user = UserMap.get(socket.id);
      if (user) {
        const room = RoomMap.get(user.currentRoomName);
        if (room && user.nickname) {
          const game = GameMap.get(room.roomName);
          if (game) {
            game.removePlayer(user.id);
          }
          room.removeUser(user.id, user.nickname);
        }
        user.disconnect(socket);
      }
    });

    /** 사용자 정보 변경 */
    socket.on("saveUserInfoRequest", (nickname: string, imgIdx: number) => {
      const user = new User({ id: socket.id, nickname, imgIdx });
      socket.to(socket.id).emit("saveUserInfoResponse", user);
    });

    socket.on("createRoomRequest", () => {
      const user = UserMap.get(socket.id);
      if (!user) return;
      const newRoom = new Room();
      io.to(user.currentRoomName).emit("createRoomResponse", newRoom.roomName);
    });

    socket.on("joinRoomRequest", (roomName: string) => {
      const user = UserMap.get(socket.id);
      const room = RoomMap.get(roomName);
      if (!user || !room) return;
      user.joinRoom(socket, roomName);
      room.addUser(user.id, user.nickname);
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
      sendMessage(user.currentRoomName, { type: "userChat", text, sender: user.nickname });
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
  } catch (error: any) {
    socket.emit("error", error.message);
    MaifaLog(error);
  }
});

export default io;
