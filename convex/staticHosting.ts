import { exposeDeploymentQuery } from "@convex-dev/static-hosting";
import { components } from "./_generated/api";

// Live-reload query for <UpdateBanner /> from @convex-dev/static-hosting/react.
export const { getCurrentDeployment } = exposeDeploymentQuery(
  components.staticHosting,
);
