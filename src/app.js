const express = require("express");
const { app, server, io } = require("../src/utils/socketIo.js");

const startListeners = require("./listeners");
startListeners(io);

const errorHandler = require("./utils/errorHandler.js");
const checkIsUserLogged = require("./utils/checkIsUserLogged.js");

const isDev = process.env.NODE_ENV === 'development';
const {
  approve,
  connected,
  disconnect,
  approveList,
  messageHistory,
  agentStatus,
  prompt,
  microServiceList,
  systemServiceList,
  logsHistory,
  log,
  chatLastLog,
  coreConfig,
  projectVersion
} = require("./utils/socketHandlers");

const path = require("path");
const cors = require("cors");

app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "public")));

app.use(cors());

io.use(async (socket, next) => {
  let token = socket.handshake.auth.token;
  if (isDev) token = socket.handshake.query.token;

  let projectId = socket.handshake.auth.projectId ?? null 
  if (isDev) projectId = socket.handshake.query.projectId ?? null;

  if(!projectId){
    return next(new Error("Project id is required"));
  }
  if (!token) {
    return next(new Error("Authentication error"));
  }

  const userData = await checkIsUserLogged(token,projectId);

  if (!userData) {
    return next(new Error("User not found"));
  }

  socket.email = userData.email;
  socket.userId = userData.userId;
  socket.token = token;
  socket.projectId = projectId;

  next();
});

io.on("connection", async (socket, next) => {
  try {
    messageHistory(socket, io);
    approve(socket, io);
    approveList(socket, io);
    connected(socket, io);
    agentStatus(socket, io);
    prompt(socket, io);
    microServiceList(socket, io);
    systemServiceList(socket, io);
    logsHistory(socket, io);
    log(socket, io);
    chatLastLog(socket, io);
    projectVersion(socket, io);
    coreConfig(socket, io);
    disconnect(socket, io);
  } catch (error) {
    console.log(error);
  }
});

app.use(async (req, res, next) => {
  const token = req.headers["authorization"] || req.headers["Authorization"] || req.query.token;
  if (!token) {
    return res.status(401).send({ error: "Token is required" });
  }

  const userData = await checkIsUserLogged(token);

  if (!userData) return res.status(401).send({ error: "User is not logged" });
  req.query.token = token;
  req.query.email = userData.email;
  req.query.userId = userData.userId;
  next();
});

app.set("io", io);

const postCreateProject = require("./routes/post-createProject.js");
const postProjectManagerChat = require("./routes/post-projectManagerChat.js")(
  io
);
const softwareArchitect = require("./routes/post-softwareArchitect.js")(io);
const softwareEngineer = require("./routes/post-softwareEngineer.js")(io);
const chatHistory = require("./routes/get-allChatHistory.js")(io);
const projectStatus = require("./routes/get-projectStatus.js")(io);
const userStories = require("./routes/post-userStories.js")(io);
const useCases = require("./routes/post-useCases.js")(io);
const getFileBody = require("./routes/get-fileBody.js");
const getMdFile = require("./routes/post-mdFile.js")(io);
const serviceList = require("./routes/get-serviceList.js")(io);
const createPrd = require("./routes/post-create-prd.js")(io);
const createRepo = require("./routes/post-create-repo.js")(io);
const createPreview = require("./routes/post-create-preview.js")(io);
const getApproveList = require("./routes/get-approveList.js");
const postVersions = require("./routes/post-version.js");


app.use("/api/bff-ai",postCreateProject);
// app.use("/api/bff-ai",postProjectManagerChat); socket promt using
app.use("/api/bff-ai",softwareArchitect);
app.use("/api/bff-ai",softwareEngineer);
app.use("/api/bff-ai",chatHistory);
app.use("/api/bff-ai",projectStatus);
app.use("/api/bff-ai",userStories);
app.use("/api/bff-ai",useCases);
app.use("/api/bff-ai",getFileBody);
app.use("/api/bff-ai",getMdFile);
app.use("/api/bff-ai",serviceList);
app.use("/api/bff-ai",createPrd);
app.use("/api/bff-ai",createRepo);
app.use("/api/bff-ai",createPreview);
app.use("/api/bff-ai",getApproveList);
app.use("/api/bff-ai",postVersions);

app.use(errorHandler);

app.get("/*", function (req, res) {
  res.send("Hello this is bff ai service");
});

module.exports = server;
