import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express from "express";

import { appRouter } from "../root";
import { createContext } from "../trpc";
import { authRouter } from "./routes/auth";
import { notificationRouter } from "./routes/notification";
import { postRouter } from "./routes/post";

// Create Express app
const app = express();

// Add tRPC middleware if you want to support both
app.use("/trpc", createExpressMiddleware({ router: appRouter, createContext }));

// HTTP routes reusing tRPC logic
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/notifications", notificationRouter);

export { app };
