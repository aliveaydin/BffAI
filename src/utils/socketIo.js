const express = require('express');
const app = express();
const server = require('http').createServer(app);
const createAdapter = require("@socket.io/redis-adapter").createAdapter;

const { pubClient, subClient } = require("../../redis/index");
const path = require('path');

const isDev = process.env.NODE_ENV === 'development';
const ioobject = {
    adapter: createAdapter(pubClient, subClient),
    cors: { origin: "*" }
};
if(!isDev) ioobject.path = "/api/bff-ai/socket"

const io = require('socket.io')(server, {
    ...ioobject
});

module.exports = { io, server, app };