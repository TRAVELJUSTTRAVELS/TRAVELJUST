import express from "express";
import serverless from "serverless-http";
import { createApiRouter } from "../../src/server/apiRouter";

const app = express();

app.use(express.json());

// Mount the API router
// Supports both /.netlify/functions/api/* and /api/* routed paths
app.use("/api", createApiRouter());
app.use("/.netlify/functions/api", createApiRouter());
app.use("/", createApiRouter());

export const handler = serverless(app);
