const http = require("http");
const dotenv = require("dotenv");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const { initWebSocketServer } = require("./src/websocket");

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});