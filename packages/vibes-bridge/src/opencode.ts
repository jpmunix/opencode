import { Layer, ManagedRuntime } from "effect";
import { OpenCode } from "@opencode-ai/sdk-next";
import { VibesConfig, VibesClient } from "./types";
import { createCompatClient } from "./client-compat";

export async function createOpencode(options: { config: VibesConfig }): Promise<{
  client: VibesClient;
  close: () => Promise<void>;
}> {
  // Translate VibesConfig to Layers here 
  const configLayer = Layer.empty;

  // Initialize the ManagedRuntime to maintain Scope for the entire application
  const runtime = ManagedRuntime.make(Layer.mergeAll(configLayer, OpenCode.layer));

  // Request the OpenCode service which was constructed by the layer
  const sdkClient = await runtime.runPromise(OpenCode.Service);

  // Wrap it with compat
  const client = createCompatClient(sdkClient);

  return {
    client,
    close: async () => {
      await runtime.dispose();
    }
  };
}
