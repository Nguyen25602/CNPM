const io = require("socket.io")(8900, {
    cors: {
        origin: "http://localhost:3000",
    },
});

let users = [];

const addUser = (userId, socketId) => {//Nếu chưa có thì push vào
    !users.some((user) => user.userId === userId) &&
        users.push({ userId, socketId });
};

const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId);//Lọc ID
};

const getUser = (userId) => {
    return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
    //Kết nối thành công
    console.log("a user connected."+socket.id);
    //lấy userID and socketId from user
    socket.on("addUser", (userId) => {
        addUser(userId, socket.id);
        io.emit("getUsers", users);
    });
    //Gửi tin nhắn cho nhau
    socket.on("sendMessage", ({ senderId, receiverId, text }) => {
        const user = getUser(receiverId);
        io.to(user.socketId).emit("getMessage", {
            senderId,
            text,
        });
    });
    //Ngắt kết nối khi disconnect
    socket.on("disconnect", () => {
        console.log("a user disconnected!"+socket.id);
        removeUser(socket.id);
        io.emit("getUsers", users);
    });

})