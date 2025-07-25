"use client";

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { assist } from "@sanity/assist";
import { markdownSchema } from "sanity-plugin-markdown";
import { imageGen } from "sanity-plugin-image-gen";

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import { apiVersion, dataset, projectId } from "./sanity/env";
import { schema } from "./sanity/schema";
import { resolve } from "./sanity/presentation/resolve";
import { structure } from "./sanity/structure";
import { codeInput } from "@sanity/code-input";
import { generateBlogPostAction } from "./sanity/schemas/actions/generate-blog-post-action";

// Define the actions that should be available for singleton documents
const singletonActions = new Set([
  "publish",
  "discardChanges",
  "restore",
  "unpublish",
]);

// Define the singleton document types
const singletonTypes = new Set(["settings"]);

export default defineConfig({
  basePath: "/studio",
  title: "Schema UI",
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schema' folder
  schema: {
    types: schema.types,
    // Filter out singleton types from the global "New document" menu options
    templates: (templates) =>
      templates.filter(({ schemaType }) => !singletonTypes.has(schemaType)),
  },
  document: {
    // For singleton types, filter out actions that are not explicitly included
    // in the `singletonActions` list defined above
    actions: (input, context) => {
      if (singletonTypes.has(context.schemaType)) {
        return input.filter(({ action }) => action && singletonActions.has(action));
      }
      
      // Add custom blog post generation action for post documents
      if (context.schemaType === "post") {
        return [...input, generateBlogPostAction];
      }
      
      return input;
    },
  },
  plugins: [
    structureTool({ structure }),
    presentationTool({
      previewUrl: {
        draftMode: {
          enable: "/api/draft-mode/enable",
        },
      },
      resolve,
    }),
    // Vision is a tool that lets you query your content with GROQ in the studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({ defaultApiVersion: apiVersion }),
    codeInput(),
    assist(),
    markdownSchema(),
    imageGen({
      apiEndpoint: "http://localhost:3000/api/generate-image",
    }),
  ],
});
