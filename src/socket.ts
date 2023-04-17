import { DefaultEventsMap } from "socket.io/dist/typed-events.js";
import { instrument } from "@socket.io/admin-ui";
import { Server } from "socket.io";
import User from "./class/user.js";
import Room from "./class/room.js";
import Game from "./class/game.js";
import { ServerToClientEvents } from "./@types/socket.js";
import { MessageType, sendMessage } from "./utils/messsage.js";
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
      user?.disconnect(socket);
    });

    /** 사용자 정보 변경 */
    socket.on("saveUserInfoRequest", (nickname: string, imgIdx: number) => {
      const user = new User({ id: socket.id, nickname, imgIdx });
      socket.emit("saveUserInfoResponse", user);
    });

    /** 방 만들기 요청 */
    socket.on("createRoomRequest", () => {
      const user = UserMap.get(socket.id);
      if (!user) throw new Error("유저가 존재하지 않습니다.");
      const newRoom = new Room();
      socket.emit("createRoomResponse", newRoom.roomName);
    });

    /** 방 입장 요청 */
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
      let type: MessageType = "userChat";
      const user = UserMap.get(socket.id);
      if (!user) return;
      const game = GameMap.get(user.currentRoomName);

      if (game?.currentStatus === "night") {
        type = "mafiaChat";
      }

      sendMessage(user.currentRoomName, { type, text, sender: user.nickname });
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

    socket.on("status", () => {
      socket.emit("status", {
        user: [...UserMap.entries()],
        room: [...RoomMap.entries()],
        game: [...GameMap.entries()],
      });
    });
  } catch (error: any) {
    socket.emit("error", error.message);
    MaifaLog(error);
  }
});

export default io;
