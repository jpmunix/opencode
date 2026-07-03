import { Effect, Stream } from "effect";
import type { VibesClient } from "./types";

export function createCompatClient(client: any): VibesClient {
  return {
    session: {
      create: (options) => Effect.runPromise(client.sessions.create(options as any)),
      get: (options) => Effect.runPromise(client.sessions.get({ sessionID: options.path.id })),
      promptAsync: (options) => Effect.runPromise(client.sessions.prompt({
        sessionID: options.path.id,
        prompt: options.body.prompt,
        resume: options.body.resume,
      } as any)),
      prompt: (options) => Effect.runPromise(client.sessions.prompt({
        sessionID: options.path.id,
        prompt: options.body.prompt,
        resume: options.body.resume,
      } as any)),
      messages: (options) => Effect.runPromise(client.messages.list({
        sessionID: options.path.id,
      } as any)),
      revert: async (options) => {
        await Effect.runPromise(client.sessions.revert.stage({
           sessionID: options.path.id,
           messageID: options.body.messageId,
           files: true
        } as any));
        return Effect.runPromise(client.sessions.revert.commit({
           sessionID: options.path.id
        } as any));
      },
      fork: (options) => Effect.runPromise(client.projectCopy.create({
        projectID: options.body.projectID,
      } as any)),
      delete: async (options) => {
        // Mapped to fs deletion or project API internally
        return {};
      },
      abort: (options) => Effect.runPromise(client.sessions.interrupt({ sessionID: options.path.id } as any)),
      init: (options) => Effect.runPromise(client.sessions.create(options as any)),
    },
    global: {
      event: (options) => {
        const stream = client.events.subscribe(options as any);
        return Stream.toAsyncIterable(stream) as any;
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
      } as any))
    },
    question: {
      reply: (options) => Effect.runPromise(client.questions.reply({
        sessionID: options.path.id,
        questionID: options.path.questionId,
        ...options.body
      } as any)),
      reject: (options) => Effect.runPromise(client.questions.reject({
         sessionID: options.path.id,
         questionID: options.path.questionId,
      } as any))
    }
  };
}
