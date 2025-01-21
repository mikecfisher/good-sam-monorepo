import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";

import { CreatePostSchema } from "@acme/db/schema";

import { postRouter } from "../router/post";
import { createTRPCContext } from "../trpc";

export const config = {
  runtime: "nodejs",
  regions: ["iad1"], // US East (N. Virginia)
};

const idSchema = z.object({ id: z.string() });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, query, body } = req;

  const ctx = await createTRPCContext({
    headers: req.headers,
    session: null,
  });

  try {
    switch (method) {
      case "GET": {
        if (query.id) {
          // GET /api/posts?id=123
          const { id } = idSchema.parse({ id: query.id });
          const result = await postRouter.byId.call({
            ctx,
            input: { id },
            path: "post.byId",
            type: "query",
          });
          return res.json(result);
        }
        // GET /api/posts
        const result = await postRouter.all.call({
          ctx,
          input: undefined,
          path: "post.all",
          type: "query",
        });
        return res.json(result);
      }

      case "POST": {
        // POST /api/posts
        const input = CreatePostSchema.parse(body);
        const result = await postRouter.create.call({
          ctx,
          input,
          path: "post.create",
          type: "mutation",
        });
        return res.status(201).json(result);
      }

      case "DELETE": {
        // DELETE /api/posts?id=123
        const { id } = idSchema.parse({ id: query.id });
        const result = await postRouter.delete.call({
          ctx,
          input: id,
          path: "post.delete",
          type: "mutation",
        });
        return res.json(result);
      }

      default:
        res.setHeader("Allow", ["GET", "POST", "DELETE"]);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error("API Error:", error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: "Invalid input", details: error.errors });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
