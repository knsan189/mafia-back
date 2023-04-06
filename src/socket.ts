import { instrument } from "@socket.io/admin-ui";
import { Server } from "socket.io";
import { jobList, timers } from "./config/const.config.js";

const io = new Server({
  cors: {
    origin: "*",
  },
});

instrument(io, { auth: false, mode: "development" });

function shuffle<T>(array: T[]) {
  return array.sort(() => Math.random() - 0.5);
}

function createRoomName() {
  return Math.floor(Math.random() * 1000 + new Date().getTime()).toString();
}

const UserMap = new Map<string, User>();
const RoomMap = new Map<string, Room>();
const GameMap = new Map<string, Game>();

// function setMap<T>(target: T, map: Map<string, T>) {
//   map.set()
// }

io.on("connection", (socket) => {
  console.log("----신규 유저 접속----");
  console.log("1. 유저 소켓 아이디 :", socket.id);
  const tempRoom = `${createRoomName()}_temp`;
  console.log("2. 임시 방 번호 :", tempRoom);
  const createUser = { socketId: socket.id, imgIdx: 0, currentRoomName: tempRoom };
  console.log("3. 유저 정보 생성", createUser);
  UserMap.set(socket.id, createUser);
  socket.join(tempRoom);

  /** 접속 종료시 */
  socket.on("disconnect", () => {
    const user = UserMap.get(socket.id);
    if (!user) return;
    socket.leave(user.currentRoomName);
    UserMap.delete(socket.id);

    const room = RoomMap.get(user.currentRoomName);
    if (!room) return;
    const newRoom = {
      ...room,
      userList: room.userList.filter((roomUser) => user.socketId !== roomUser.id),
    };
    io.to(room.roomName).emit("userListSync", newRoom.userList);
    RoomMap.set(room.roomName, newRoom);

    const serverMessage: Message = {
      type: "userNotice",
      sender: "server",
      text: `${user.nickname}님이 방을 나가셨습니다.`,
    };
    io.to(room.roomName).emit("serverMessage", serverMessage);

    const game = GameMap.get(user.currentRoomName);
    if (!game) return;
    const newGame: Game = {
      ...game,
      userList: game.userList.filter((player) => player.socketId !== user.socketId),
      voteList: game.voteList.filter((player) => player !== user.socketId),
    };
    GameMap.set(room.roomName, newGame);
    io.to(room.roomName).emit("gameSync");
  });

  socket.on("saveUserInfoRequest", (nickname: string, imgIdx: number) => {
    const prevUser = UserMap.get(socket.id);
    console.log(socket.id, prevUser);
    if (!prevUser) return;
    const newUser = { ...prevUser, nickname, imgIdx };
    console.log(newUser);
    UserMap.set(socket.id, newUser);
    io.to(newUser.currentRoomName).emit("saveUserInfoResponse", newUser);
  });

  socket.on("createRoomRequest", () => {
    const user = UserMap.get(socket.id);
    if (!user || !user.nickname) return;
    const newRoomName = createRoomName();
    console.log("방 생성", newRoomName);
    RoomMap.set(newRoomName, { userList: [], roomName: newRoomName, status: "idle" });
    io.to(user.currentRoomName).emit("createRoomResponse", newRoomName);
  });

  socket.on("joinRoomRequest", (roomName: string) => {
    const user = UserMap.get(socket.id);
    const room = RoomMap.get(roomName);
    if (!user || !room) return;
    socket.leave(user.currentRoomName);
    socket.join(roomName);

    const newUser = { ...user, currentRoomName: roomName };
    UserMap.set(socket.id, newUser);

    const newRoom = {
      ...room,
      userList: [...room.userList, { id: newUser.socketId, isReady: false }],
    };
    RoomMap.set(roomName, newRoom);

    socket.emit("userListSync", newRoom.userList);

    const serverMessage: Message = {
      type: "userNotice",
      sender: "Server",
      text: `${newUser.nickname}님이 입장하셨습니다.`,
    };

    socket.emit("serverMessage", serverMessage);
  });

  socket.on("gameReadyRequest", (isReady: boolean) => {
    const user = UserMap.get(socket.id);
    if (!user) throw new Error();
    const room = RoomMap.get(user.currentRoomName);
    if (!room) throw new Error();
    const newRoom: Room = {
      ...room,
      userList: room.userList.map((roomUser) =>
        roomUser.id !== socket.id ? roomUser : { ...roomUser, isReady },
      ),
    };

    RoomMap.set(room.roomName, newRoom);
    io.to(room.roomName).emit("gameReadySync", newRoom.userList);
  });

  socket.on("gameStartRequest", () => {
    const user = UserMap.get(socket.id);
    const room = RoomMap.get(user?.currentRoomName || "");
    if (!user || !room) return;

    const serverMessage: Message = {
      type: "gameNotice",
      sender: "Server",
      text: `게임이 시작되었습니다.`,
    };

    let timerIndex = 0;
    let { ms } = timers[timerIndex];
    const timer = setInterval(() => {
      if (ms <= 0) {
        timerIndex += 1;
        ms = timers[timerIndex].ms;
      }
      socket.emit("timerSync", ms);
      ms -= 1000;
    }, 1000);

    const newJobList = shuffle(jobList);

    const playerList: Player[] = room.userList.map((roomUser, index) => ({
      socketId: roomUser.id,
      job: newJobList[index],
      status: "alive",
    }));

    const newGame: Game = {
      timer,
      roomName: user.currentRoomName,
      userList: playerList,
      voteList: [],
      ...timers[timerIndex],
    };

    GameMap.set(user.currentRoomName, newGame);
    socket.emit("serverMessage", serverMessage);
  });

  // // DM 수신 후 전송 (보낸 user, 받는 user both)
  // socket.on("sendDM", (data) => {
  //   io.to(`${data.to_id}`).to(`${data.from_id}`).emit("getDM", {
  //     from_id: data.from_id,
  //     to_id: data.to_id,
  //     msg: data.msg,
  //   });
  // });

  // // 게임 시작 전,
  // // 방장 빼고 전원 ready 누르면 방장 gamestart 버튼 disabled=false
  // // gamestart 버튼 클릭
  // // 게임 시작 : setIsGame(true)
  // socket.on("gameReady", (data) => {
  //   const roomID = userToRoom[data.from_id];
  //   const readyCnt = roomToUser[roomID]?.length - 1; // 방장 빼고 전부 ready

  //   finalVoteList[roomID] = {};
  //   peopleVotedList[roomID] = {};
  //   userJobList[roomID] = {};

  //   checkReady[roomID] === readyCnt - 1
  //     ? io.to(roomToUser[roomID][0]).emit("readyComplete")
  //     : checkReady[roomID] > 0
  //     ? (checkReady[roomID] += 1)
  //     : ((checkReady[roomID] = 1),
  //       io.to(roomID).emit("gameNotice", {
  //         dayNight: false,
  //         msg: "Player들이 Ready 중 입니다.",
  //         killed: false,
  //       }));
  //   console.log("readyOrNot: ", checkReady[roomID], readyCnt);
  // });

  // socket.on("finalVote", ({ from_id, agree }) => {
  //   const roomID = userToRoom[from_id];
  //   finalVoteList[roomID] ||= {};
  //   finalVoteList[roomID][from_id] = agree;
  //   let agreeCount = 0;
  //   let disagreeCount = 0;

  //   Object.keys(finalVoteList[roomID]).forEach((key) => {
  //     if (finalVoteList[roomID][key]) {
  //       agreeCount += 1;
  //     } else {
  //       disagreeCount += 1;
  //     }
  //   });

  //   io.to(roomID).emit("gameNotice", {
  //     msg: `찬성 : ${agreeCount}표, 반대 : ${disagreeCount}표`,
  //   });
  // });

  // const checkGameEnd = (id) => {
  //   const target = userJobList[id];

  //   console.log(target);

  //   let mafiaCount = 0;
  //   let citizenCount = 0;

  //   target.forEach((user) => {
  //     if (user.status === "alive") {
  //       if (user.job === "mafia") {
  //         mafiaCount += 1;
  //       } else {
  //         citizenCount += 1;
  //       }
  //     }
  //   });

  //   if (mafiaCount === 0) {
  //     io.to(id).emit("gameNotice", {
  //       msg: "마피아가 죽었으므로, 시민이 승리했습니다",
  //     });
  //     return true;
  //   }

  //   if (mafiaCount >= citizenCount) {
  //     io.to(id).emit("gameNotice", {
  //       msg: "마피아가 승리했습니다",
  //     });
  //     return true;
  //   }
  //   return false;
  // };

  // const clearGameData = (id) => {
  //   io.to(id).emit("gameNotice", {
  //     msg: "게임 종료",
  //   });
  //   io.to(id).emit("gameEnd", true);

  //   console.log(`방 ${id} 게임 끝`);
  //   delete roomTimer[id];
  //   delete checkReady[id];
  //   delete mafiaVoteList[id];
  //   delete peopleVotedList[id];
  //   delete finalVoteList[id];
  // };

  // const getKilledUser = (id) => {
  //   if (!peopleVotedList[id]) {
  //     return undefined;
  //   }

  //   const votedCountList = Object.keys(peopleVotedList[id])
  //     .map((user) => ({
  //       id: user,
  //       count: peopleVotedList[id][user].length,
  //     }))
  //     .sort((a, b) => b.count - a.count);

  //   if (!votedCountList[1]) {
  //     return votedCountList[0]?.id;
  //   }

  //   if (votedCountList[0].count === votedCountList[1].count) {
  //     return undefined;
  //   }
  //   return votedCountList[0].id;
  // };

  // const setTimer = (id, index) => {
  //   roomTimer[id] = { ...timerList[index] };
  // };

  // const startTimer = (id) => {
  //   console.log(`타이머 시작. 방 번호 ${id}`);
  //   let targetIndex = 0;
  //   let isNoticeSended = false;

  //   const interval = setInterval(() => {
  //     if (!roomTimer[id]) {
  //       isNoticeSended = false;
  //       setTimer(id, 0);
  //     }

  //     if (roomTimer[id].ms <= 0) {
  //       isNoticeSended = false;
  //       targetIndex += 1;
  //       if (targetIndex > timerList.length - 1) {
  //         targetIndex = 0;
  //       }
  //       setTimer(id, targetIndex);
  //     }

  //     if (roomToUser[id].length < 2) {
  //       clearGameData(id);
  //       clearInterval(interval);
  //       return;
  //     }

  //     if (!isNoticeSended) {
  //       isNoticeSended = true;

  //       switch (roomTimer[id].type) {
  //         case "dayDiscussion": {
  //           io.to(id).emit("gameNotice", {
  //             dayNight: roomTimer[id].type,
  //             msg: roomTimer[id].noticeMessage,
  //             killed: mafiaVoteList[id],
  //           });

  //           const userIndex = userJobList[id].findIndex(
  //             (user) => user.userId === mafiaVoteList[id],
  //           );

  //           if (userIndex >= 0) {
  //             userJobList[id][userIndex].status = "dead";
  //           }

  //           mafiaVoteList[id] = undefined;

  //           if (checkGameEnd(id)) {
  //             clearGameData(id);
  //             clearInterval(interval);
  //             targetIndex = 0;
  //             return;
  //           }
  //           break;
  //         }
  //         case "dayFinal": {
  //           io.to(id).emit("votedResult", { id: getKilledUser(id) });
  //           io.to(id).emit("gameNotice", {
  //             dayNight: roomTimer[id].type,
  //             msg: roomTimer[id].noticeMessage,
  //           });
  //           break;
  //         }
  //         case "dayFinalVote": {
  //           io.to(id).emit("gameNotice", {
  //             dayNight: roomTimer[id].type,
  //             msg: `${getKilledUser(id)} ${roomTimer[id].noticeMessage}`,
  //           });
  //           break;
  //         }
  //         case "night": {
  //           let agreeCount = 0;
  //           let disagreeCount = 0;

  //           Object.keys(finalVoteList[id]).forEach((key) => {
  //             if (finalVoteList[id][key]) {
  //               agreeCount += 1;
  //             } else {
  //               disagreeCount += 1;
  //             }
  //           });

  //           const killedUser = agreeCount > disagreeCount && getKilledUser(id);

  //           io.to(id).emit("gameNotice", {
  //             dayNight: roomTimer[id].type,
  //             msg: roomTimer[id].noticeMessage,
  //             killed: killedUser,
  //           });

  //           const userIndex = userJobList[id].findIndex((user) => user.userId === killedUser);

  //           if (userIndex >= 0) {
  //             userJobList[id][userIndex].status = "dead";
  //           }

  //           finalVoteList[id] = {};
  //           peopleVotedList[id] = {};

  //           if (checkGameEnd(id)) {
  //             clearGameData(id);
  //             clearInterval(interval);
  //             targetIndex = 0;
  //             return;
  //           }
  //           break;
  //         }
  //         default: {
  //           io.to(id).emit("gameNotice", {
  //             dayNight: roomTimer[id].type,
  //             msg: roomTimer[id].noticeMessage,
  //           });
  //           break;
  //         }
  //       }
  //     }

  //     roomTimer[id].ms -= 1000;
  //     io.to(id).emit("timerChange", roomTimer[id]);
  //   }, 1000);
  // };

  // // ------------------------------------------------------[1] 게임 시작
  // // 방장이 gameStart 누름
  // socket.on("gameStart", ({ from_id, userList }) => {
  //   const roomID = userToRoom[from_id];

  //   io.to(roomID).emit("gameStart", { jobList });

  //   const userJob = [];
  //   userList.forEach((user, index) => {
  //     if (user) {
  //       userJob.push({ userId: user, job: jobList[index], status: "alive" });
  //     }
  //   });
  //   userJobList[roomID] = userJob;

  //   startTimer(roomID);
  //   checkReady[roomID] = {};
  // });

  // // ------------------------------------------------------[2] 밤
  // // 밤 - mafia가 고름
  // socket.on("mafiaVoted", ({ from_id, killed_id }) => {
  //   const roomID = userToRoom[from_id];
  //   console.log("mafiaPick", killed_id);
  //   io.to(roomID).emit("mafiaPick", killed_id);
  //   mafiaVoteList[roomID] = killed_id;
  // });

  // // ------------------------------------------------------[3] 낮
  // // 낮 - 죽일 사람 투표
  // socket.on("peopleVoted", (data) => {
  //   const roomID = userToRoom[data.from_id];
  //   const killedid = data.killed_id;

  //   Object.keys(peopleVotedList[roomID]).forEach((key) => {
  //     peopleVotedList[roomID][key] = peopleVotedList[roomID][key].filter(
  //       (userId) => userId !== data.from_id,
  //     );
  //   });

  //   if (peopleVotedList[roomID][killedid]) {
  //     peopleVotedList[roomID][killedid].push(data.from_id);
  //   } else {
  //     peopleVotedList[roomID] = {
  //       ...peopleVotedList[roomID],
  //       [killedid]: [data.from_id],
  //     };
  //   }

  //   let votedMessage = "";

  //   Object.keys(peopleVotedList[roomID]).forEach((user) => {
  //     if (peopleVotedList[roomID][user].length) {
  //       votedMessage += `[ ${user} ] : ${peopleVotedList[roomID][user].length} 표 `;
  //     }
  //   });

  //   io.to(roomID).emit("gameNotice", { msg: votedMessage });
  // });

  // // ------------------------------------------------------[4] 게임 종료
  // // 게임 종료
  // socket.on("gameEnd", (data) => {
  //   const roomID = userToRoom[data.from_id];
  //   delete checkReady[roomID];
  //   delete mafiaVoteList[roomID];
  //   delete peopleVotedList[roomID];
  //   delete finalVoteList[roomID];
  // });

  // socket.on("disconnect", () => {
  //   const roomID = userToRoom[socket.id];
  //   const myEmail = socketToEmail[socket.id];
  //   const myName = emailToSocket[myEmail]?.userName;
  //   emailToSocket[myEmail] ? (emailToSocket[myEmail].userID = "") : false;
  //   delete socketToEmail[socket.id];
  //   console.log("emailToSocket: ", emailToSocket);
  //   console.log("socketToEmail: ", socketToEmail);
  //   checkReady[roomID] -= 1;

  //   roomToUser[roomID]?.length > 1
  //     ? (roomToUser[roomID] = roomToUser[roomID].filter((e) => e !== socket.id))
  //     : delete roomToUser[socket.id];

  //   io.to(roomID).emit("notice", {
  //     msg: `${socket.id}님이 방을 나갔습니다.`,
  //     roomToUser: roomToUser[roomID] || false,
  //     socketToEmail,
  //     emailToSocket,
  //   });

  //   console.log(`User Disconnected : ${socket.id}(${myName})`);
  //   // console.log('check:', userToRoom[socket.id]?.slice(0, -2));
  //   socket.leave(roomID);
  //   delete userToRoom[socket.id];
  // });
});

export default io;
