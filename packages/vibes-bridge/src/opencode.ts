import { Layer, ManagedRuntime } from "effect";
import { OpenCode } from "@opencode-ai/sdk-next";
import { VibesConfig, VibesClient } from "./types";
import { createCompatClient } from "./client-compat";

export async function createOpencode(options: { config: VibesConfig }): Promise<{
  client: VibesClient;
  close: () => Promise<void>;
}> {
  console.log("[Vibes-Bridge] createOpencode starting...");
  // Translate VibesConfig to Layers here 
  const configLayer = Layer.empty;

  console.log("[Vibes-Bridge] Initializing ManagedRuntime...");
  // Initialize the ManagedRuntime to maintain Scope for the entire application
  const runtime = ManagedRuntime.make(Layer.mergeAll(configLayer, OpenCode.layer));

  console.log("[Vibes-Bridge] Requesting OpenCode.Service...");
  // Request the OpenCode service which was constructed by the layer
  const sdkClient = await runtime.runPromise(OpenCode.Service);
  console.log("[Vibes-Bridge] OpenCode.Service acquired.");

  // Wrap it with compat
  const client = createCompatClient(sdkClient);
  console.log("[Vibes-Bridge] Compat client created.");

  return {
    client,
    server: {
      url: "http://opencode.local",
      close: async () => {
        // In-process server shutdown is handled by the close() function below
        console.log("[Vibes-Bridge] Dummy server.close() called");
      }
    },
    close: async () => {
      await runtime.dispose();
    }
  };
}
