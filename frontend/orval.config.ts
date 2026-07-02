import { defineConfig } from "orval";

export default defineConfig({
  tally: {
    input: {
      target: process.env.OPENAPI_URL ?? "http://localhost:4000/documentation/json",
    },
    output: {
      mode: "tags-split",
      target: "./src/lib/api/generated",
      schemas: "./src/lib/api/models",
      client: "axios",
      clean: true,
      indexFiles: true,
      override: {
        mutator: {
          path: "./src/lib/api/axios-instance.ts",
          name: "customInstance",
        },
      },
    },
  },
});
