import { ConvexQueryClient } from "@convex-dev/react-query"
import {
  MutationCache,
  notifyManager,
  QueryClient,
} from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query"
import { ConvexProvider, ConvexReactClient } from "convex/react"

import { toast } from "@acme/ui/components/sonner"

import { DefaultCatchBoundary } from "#web/components/default-catch-boundary"
import { NotFound } from "#web/components/not-found"
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
      onError: (error) => {
        toast.error(error.message, { className: "bg-red-500 text-white" })
      },
    }),
  })
  convexQueryClient.connect(queryClient)

  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    context: { queryClient, convexClient: convex, convexQueryClient },

    // NOTE:
    // This is the default Wrap function that is used by TanStack Router.
    // Here we can add our proviers that we want to be available in all routes.
    Wrap: ({ children }) => (
      <ConvexProvider client={convexQueryClient.convexClient}>
        {children}
      </ConvexProvider>
    ),
  })

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
