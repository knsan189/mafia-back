/* eslint-disable no-underscore-dangle */
import { fileURLToPath } from "url";
import cors from "cors";
import log4js from "log4js";
import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import IndexRouter from "./src/routes/index.js";

const isDev = `${process.env.NODE_ENV}`.trim() === "development";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

log4js.configure(path.join(__dirname, isDev ? "log4js.json" : "../log4js.json"));
app.set("views", path.join(__dirname, "src/views"));
app.set("view engine", "pug");
app.use(logger(isDev ? "dev" : "common"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, isDev ? "public" : "../public")));
// app.use("*", IndexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

export default app;
