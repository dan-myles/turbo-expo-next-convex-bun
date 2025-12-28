import { ConvexQueryClient } from "@convex-dev/react-query"
import {
  MutationCache,
  notifyManager,
  QueryClient,
} from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { ConvexReactClient } from "convex/react"

import { env } from "./env"
import { routeTree } from "./routeTree.gen"

export const getRouter = () => {
  if (typeof document !== "undefined") {
    notifyManager.setScheduler(window.requestAnimationFrame)
  }

  const convex = new ConvexReactClient(env.VITE_PUBLIC_CONVEX_URL, {
    unsavedChangesWarning: false,
  })
  const convexQueryClient = new ConvexQueryClient(convex)
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
    mutationCache: new MutationCache({
      onError: (_error) => {
        // toast(error.message, { className: "bg-red-500 text-white" })
      },
    }),
  })
  convexQueryClient.connect(queryClient)

  const router = createRouter({
    routeTree,
    defaultPreload: "intent",
  })

  return router
}
