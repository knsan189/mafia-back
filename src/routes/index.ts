import { Router } from "express";

const IndexRouter = Router();

IndexRouter.get("/", (req, res) => {
  res.render("index", { title: "Mafia Game Server" });
});

export default IndexRouter;
