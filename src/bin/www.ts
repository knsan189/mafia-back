#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Module dependencies.
 */

import Debug from "debug";
import * as http from "http";
import process from "process";
import io from "../socket.js";
import app from "../app.js";

const debug = Debug("mafiaBack");
process.title = "mafiaBack";

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || "6000");
app.set("port", port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: any) {
  const p = parseInt(val, 10);

  if (Number.isNaN(p)) {
    // named pipe
    return val;
  }

  if (p >= 0) {
    // port number
    return p;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr?.port}`;
  debug(`Listening on ${bind}`);
}

io.attach(server);
server.listen(port, "0.0.0.0");
console.log(`running on http://localhost:${port}`);
server.on("error", onError);
server.on("listening", onListening);
