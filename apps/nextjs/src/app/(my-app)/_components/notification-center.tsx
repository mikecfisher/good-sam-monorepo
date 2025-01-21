"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import { api } from "~/trpc/react";

const NotificationForm = z.object({
  userId: z.string().min(1, "User ID is required"),
  title: z.string().min(1, "Title is required").max(100),
  body: z.string().min(1, "Message is required").max(500),
  priority: z.enum(["high", "normal", "low"]),
});

interface NotificationError {
  data?: {
    code: string;
    httpStatus?: number;
    path?: string;
  };
  message: string;
}

export function NotificationCenter() {
  const { data: session } = useSession();
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [recipients, setRecipients] = useState<string[]>([]);

  const form = useForm({
    schema: NotificationForm,
    defaultValues: {
      userId: "",
      title: "",
      body: "",
      priority: "normal" as const,
    },
  });

  const sendNotification = api.notification.enqueue.useMutation({
    onSuccess: () => {
      toast.success("Notification sent successfully!");
      form.reset();
    },
    onError: (err: NotificationError) => {
      toast.error(
        err.data?.code === "UNAUTHORIZED"
          ? "You must be logged in to send notifications"
          : "Failed to send notification",
      );
    },
  });

  const batchSendNotification = api.notification.batchEnqueue.useMutation({
    onSuccess: () => {
      toast.success("Notifications sent successfully!");
      form.reset();
      setRecipients([]);
    },
    onError: (err: NotificationError) => {
      toast.error(
        err.data?.code === "UNAUTHORIZED"
          ? "You must be logged in to send notifications"
          : "Failed to send notifications",
      );
    },
  });

  if (!session) {
    return (
      <div className="rounded-lg bg-muted p-8 text-center">
        <h2 className="text-2xl font-bold">Notification Center</h2>
        <p className="mt-2 text-muted-foreground">
          Please sign in to send notifications
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl rounded-lg bg-muted p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notification Center</h2>
        <Button
          variant="outline"
          onClick={() => {
            setIsBatchMode(!isBatchMode);
            setRecipients([]);
            form.reset();
          }}
        >
          {isBatchMode ? "Single Mode" : "Batch Mode"}
        </Button>
      </div>

      <Form {...form}>
        <form
          className="flex flex-col gap-4"
          onSubmit={form.handleSubmit((data) => {
            if (isBatchMode) {
              if (recipients.length === 0) {
                toast.error("Add at least one recipient");
                return;
              }
              const notifications = recipients.map((userId) => ({
                ...data,
                userId,
                type: "SYSTEM_ALERT" as const,
              }));
              batchSendNotification.mutate(notifications);
            } else {
              sendNotification.mutate({
                ...data,
                type: "SYSTEM_ALERT",
              });
            }
          })}
        >
          {isBatchMode ? (
            <div className="space-y-2">
              <FormLabel>Recipients</FormLabel>
              <div className="flex flex-wrap gap-2">
                {recipients.map((recipient) => (
                  <div
                    key={recipient}
                    className="flex items-center gap-2 rounded bg-primary px-2 py-1 text-sm text-primary-foreground"
                  >
                    <span>{recipient}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setRecipients(recipients.filter((r) => r !== recipient))
                      }
                      className="text-xs hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add recipient ID"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const input = e.currentTarget;
                      const value = input.value.trim();
                      if (value && !recipients.includes(value)) {
                        setRecipients([...recipients, value]);
                        input.value = "";
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setRecipients([])}
                >
                  Clear All
                </Button>
              </div>
            </div>
          ) : (
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient ID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter user ID" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Notification title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter your message"
                    className="h-32 resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="mt-4"
            disabled={
              sendNotification.isLoading || batchSendNotification.isLoading
            }
          >
            {sendNotification.isLoading || batchSendNotification.isLoading
              ? "Sending..."
              : "Send Notification"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
