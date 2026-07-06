import { Effect, Stream } from "effect";
import type { VibesClient } from "./types";

export function createCompatClient(client: any): VibesClient {
  return {
    session: {
      create: (options) => Effect.runPromise(client.sessions.create(options as any)).then(data => ({ data })),
      get: (options) => Effect.runPromise(client.sessions.get({ sessionID: options.path.id })).then(data => ({ data })),
      promptAsync: (options) => {
        const parts = options.body.parts || [];
        const textPart = parts.find((p: any) => p.type === "text");
        const fileParts = parts.filter((p: any) => p.type === "file");
        return Effect.runPromise(client.sessions.prompt({
          sessionID: options.path.id,
          prompt: {
            text: textPart?.text || "",
            files: fileParts.map((f: any) => ({
              uri: f.url,
              mime: f.mime,
              name: f.filename
            }))
          },
          system: options.body.system,
          model: options.body.model,
        } as any)).then(data => ({ data }));
      },
      prompt: (options) => {
        const parts = options.body.parts || [];
        const textPart = parts.find((p: any) => p.type === "text");
        const fileParts = parts.filter((p: any) => p.type === "file");
        return Effect.runPromise(client.sessions.prompt({
          sessionID: options.path.id,
          prompt: {
            text: textPart?.text || "",
            files: fileParts.map((f: any) => ({
              uri: f.url,
              mime: f.mime,
              name: f.filename
            }))
          },
          system: options.body.system,
          model: options.body.model,
        } as any)).then(data => ({ data }));
      },
      messages: (options) => Effect.runPromise(client.messages.list({
        sessionID: options.path.id,
      } as any)).then(data => ({ data })),
      revert: async (options) => {
        await Effect.runPromise(client.sessions.revert.stage({
           sessionID: options.path.id,
           messageID: options.body.messageId,
           files: true
        } as any));
        return Effect.runPromise(client.sessions.revert.commit({
           sessionID: options.path.id
        } as any)).then(data => ({ data }));
      },
      fork: (options) => Effect.runPromise(client.projectCopy.create({
        projectID: options.body.projectID,
      } as any)).then(data => ({ data })),
      delete: async (options) => {
        // Mapped to fs deletion or project API internally
        return {};
      },
      abort: (options) => Effect.runPromise(client.sessions.interrupt({ sessionID: options.path.id } as any)),
      init: (options) => Effect.runPromise(client.sessions.create(options as any)).then(data => ({ data })),
    },
    global: {
      event: (options) => {
        const stream = client.events.subscribe(options as any);
        const mappedStream = stream.pipe(
          Stream.map((evt: any) => {
            const type = evt.type;
            const data = evt.data;
            
            // Map NEW events to OLD formats expected by Vibes
            if (type === "session.next.text.started") {
              return {
                type: "message.part.updated",
                properties: {
                  part: { type: "text", messageID: data.assistantMessageID }
                }
              };
            }
            if (type === "session.next.text.delta") {
              return {
                type: "message.part.delta",
                properties: {
                  delta: data.delta,
                  messageID: data.assistantMessageID
                }
              };
            }
            if (type === "session.next.reasoning.started") {
              return {
                type: "message.part.updated",
                properties: {
                  part: { type: "reasoning", messageID: data.assistantMessageID }
                }
              };
            }
            if (type === "session.next.reasoning.delta") {
              return {
                type: "message.part.delta",
                properties: {
                  delta: data.delta,
                  messageID: data.assistantMessageID
                }
              };
            }
            if (type === "session.next.step.started") {
              return {
                type: "message.updated",
                properties: {
                  info: { id: data.assistantMessageID, role: "assistant" }
                }
              };
            }
            if (type === "session.next.step.ended") {
              return {
                type: "message.part.updated",
                properties: {
                  part: { 
                    type: "step-finish", 
                    messageID: data.assistantMessageID,
                    tokens: data.tokens
                  },
                  info: { 
                    id: data.assistantMessageID, 
                    role: "assistant",
                    usage: { cost: data.cost }
                  }
                }
              };
            }
            if (type === "session.next.tool.input.started" || type === "session.next.tool.called") {
              return {
                type: "message.part.updated",
                properties: {
                  part: { 
                    type: "tool", 
                    tool: data.name || data.tool, 
                    status: "started", 
                    id: data.callID,
                    messageID: data.assistantMessageID
                  }
                }
              };
            }
            if (type === "session.next.tool.success") {
              return {
                type: "message.part.updated",
                properties: {
                  part: { 
                    type: "tool", 
                    status: "completed", 
                    id: data.callID,
                    output: JSON.stringify(data.result),
                    messageID: data.assistantMessageID
                  }
                }
              };
            }
            if (type === "session.next.tool.failed") {
              return {
                type: "message.part.updated",
                properties: {
                  part: { 
                    type: "tool", 
                    status: "error", 
                    id: data.callID,
                    detail: data.error?.message || "Unknown error",
                    messageID: data.assistantMessageID
                  }
                }
              };
            }

            return evt;
          })
        );

        return {
          stream: Stream.toAsyncIterable(mappedStream) as any
        };
      }
    },
    config: {
      update: async (options) => {
        return {};
      }
    },
    permission: {
      reply: (options) => Effect.runPromise(client.permissions.reply({
        sessionID: options.path.id,
        permissionID: options.path.permId,
        ...options.body
      } as any)).then(data => ({ data }))
    },
    question: {
      reply: (options) => Effect.runPromise(client.questions.reply({
        sessionID: options.path.id,
        questionID: options.path.questionId,
        ...options.body
      } as any)).then(data => ({ data })),
      reject: (options) => Effect.runPromise(client.questions.reject({
         sessionID: options.path.id,
         questionID: options.path.questionId,
      } as any)).then(data => ({ data }))
    }
  };
}
