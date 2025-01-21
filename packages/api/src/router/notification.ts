import type { TRPCRouterRecord } from "@trpc/server";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure } from "../trpc";

const requiredEnvs = {
  AWS_REGION: process.env.AWS_REGION,
  AWS_SQS_NOTIFICATION_QUEUE_URL: process.env.AWS_SQS_NOTIFICATION_QUEUE_URL,
} as const;

Object.entries(requiredEnvs).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const sqsClient: SQSClient = new SQSClient({
  region: requiredEnvs.AWS_REGION,
});

const NotificationTypeEnum = z.enum([
  "COMMENT_REPLY",
  "POST_MENTION",
  "DIRECT_MESSAGE",
  "SYSTEM_ALERT",
]);

const NotificationPayloadSchema = z.object({
  type: NotificationTypeEnum,
  userId: z.string(),
  title: z.string(),
  body: z.string(),
  metadata: z.record(z.unknown()).optional(),
  priority: z.enum(["high", "normal", "low"]).default("normal"),
});

interface NotificationResponse {
  success: boolean;
  messageId: string | null;
  timestamp?: string;
  error?: string;
}

export const notificationRouter = {
  enqueue: protectedProcedure
    .input(NotificationPayloadSchema)
    .mutation(async ({ input, ctx }): Promise<NotificationResponse> => {
      const messageBody = {
        ...input,
        timestamp: new Date().toISOString(),
        senderUserId: ctx.session.user.id,
      };

      const command = new SendMessageCommand({
        QueueUrl: requiredEnvs.AWS_SQS_NOTIFICATION_QUEUE_URL,
        MessageBody: JSON.stringify(messageBody),
        MessageAttributes: {
          NotificationType: {
            DataType: "String",
            StringValue: input.type,
          },
          Priority: {
            DataType: "String",
            StringValue: input.priority,
          },
        },
      });

      try {
        const response = await sqsClient.send(command);
        if (!response.MessageId) {
          throw new Error("SQS did not return a MessageId");
        }
        return {
          success: true,
          messageId: response.MessageId,
          timestamp: messageBody.timestamp,
        };
      } catch (error) {
        console.error("Failed to enqueue notification:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to enqueue notification",
        });
      }
    }),

  batchEnqueue: protectedProcedure
    .input(z.array(NotificationPayloadSchema).max(10))
    .mutation(async ({ input, ctx }) => {
      const results = await Promise.allSettled(
        input.map(async (notification) => {
          const messageBody = {
            ...notification,
            timestamp: new Date().toISOString(),
            senderUserId: ctx.session.user.id,
          };

          const command = new SendMessageCommand({
            QueueUrl: requiredEnvs.AWS_SQS_NOTIFICATION_QUEUE_URL,
            MessageBody: JSON.stringify(messageBody),
            MessageAttributes: {
              NotificationType: {
                DataType: "String",
                StringValue: notification.type,
              },
              Priority: {
                DataType: "String",
                StringValue: notification.priority,
              },
            },
          });

          const response = await sqsClient.send(command);
          return response;
        }),
      );

      return {
        success: true,
        results: results.map((result) => ({
          status: result.status,
          messageId:
            result.status === "fulfilled"
              ? (result.value.MessageId ?? null)
              : null,
          error:
            result.status === "rejected" && result.reason instanceof Error
              ? result.reason.message
              : null,
        })),
      };
    }),
} satisfies TRPCRouterRecord;
