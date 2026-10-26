const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
 

const rateLimitMiddleware = require("./middleware/rateLimitMiddleware");
const { notFoundMiddleware, errorMiddleware,} = require("./middleware/errorMiddleware");
const healthRoutes = require("./routes/healthRoutes");
//const authRoutes = require("./routes/authRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes= require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const adminRoutes = require("./routes/adminRoutes");
const reportRoutes = require("./routes/reportRoutes");
const opportunityRoutes = require("./routes/opportunityRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const eventRoutes = require("./routes/eventRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation"), false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  })
);

app.use(rateLimitMiddleware);
 
app.use(
  helmet({
    strictTransportSecurity: false,
  })
);

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/posts",postRoutes);
app.use("/api/",commentRoutes)
app.use("/api/connections",connectionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/teachers",teacherRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reports",reportRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/messages", messageRoutes);

//global Error handling
app.use(notFoundMiddleware);
app.use(errorMiddleware);


app.get("/", (req, res) => {
  res.json({
    message: "AU Foundation Backend is running 🚀",
  });
});

module.exports = app;