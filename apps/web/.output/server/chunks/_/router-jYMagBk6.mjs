import { jsx, jsxs } from "react/jsx-runtime";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { notifyManager, QueryClient, MutationCache } from "@tanstack/react-query";
import { createRouter, createRootRouteWithContext, useRouter, useMatch, rootRouteId, ErrorComponent, Link, createFileRoute, lazyRouteComponent, HeadContent, Scripts } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { toast } from "sonner";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
function DefaultCatchBoundary({ error }) {
  const router = useRouter();
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId
  });
  console.error(error);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "flex min-w-0 flex-1 flex-col items-center justify-center gap-6\n        p-4",
      children: [
        /* @__PURE__ */ jsx(ErrorComponent, { error }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                router.invalidate();
              },
              className: `rounded-sm bg-gray-600 px-2 py-1 font-extrabold text-white
            uppercase dark:bg-gray-700`,
              children: "Try Again"
            }
          ),
          isRoot ? /* @__PURE__ */ jsx(
            Link,
            {
              to: "/",
              className: `rounded-sm bg-gray-600 px-2 py-1 font-extrabold
              text-white uppercase dark:bg-gray-700`,
              children: "Home"
            }
          ) : /* @__PURE__ */ jsx(
            Link,
            {
              to: "/",
              className: `rounded-sm bg-gray-600 px-2 py-1 font-extrabold
              text-white uppercase dark:bg-gray-700`,
              onClick: (e) => {
                e.preventDefault();
                window.history.back();
              },
              children: "Go Back"
            }
          )
        ] })
      ]
    }
  );
}
function NotFound({ children }) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-2", children: [
    /* @__PURE__ */ jsx("div", { className: "text-gray-600 dark:text-gray-400", children: children ?? /* @__PURE__ */ jsx("p", { children: "The page you are looking for does not exist." }) }),
    /* @__PURE__ */ jsxs("p", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => window.history.back(),
          className: "rounded-sm bg-emerald-500 px-2 py-1 text-sm font-black\n            text-white uppercase",
          children: "Go back"
        }
      ),
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/",
          className: "rounded-sm bg-cyan-600 px-2 py-1 text-sm font-black\n            text-white uppercase",
          children: "Start Over"
        }
      )
    ] })
  ] });
}
const env = createEnv({
  clientPrefix: "VITE_",
  emptyStringAsUndefined: true,
  runtimeEnv: {
    VITE_PUBLIC_CONVEX_URL: "https://confident-raccoon-685.convex.cloud"
  },
  client: {
    VITE_PUBLIC_CONVEX_URL: z.string()
  }
});
const appCss = "/assets/globals-DUAa1HZW.css";
const Route$1 = createRootRouteWithContext()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        title: "TanStack Start Starter"
      }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  shellComponent: RootDocument
});
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter = () => import("./index-DMnKsxtW.mjs");
const Route = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const IndexRoute = Route.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$1
});
const rootRouteChildren = {
  IndexRoute
};
const routeTree = Route$1._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  if (typeof document !== "undefined") {
    notifyManager.setScheduler(window.requestAnimationFrame);
  }
  const convex = new ConvexReactClient(env.VITE_PUBLIC_CONVEX_URL, {
    unsavedChangesWarning: false
  });
  const convexQueryClient = new ConvexQueryClient(convex);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn()
      }
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error(error.message, { className: "bg-red-500 text-white" });
      }
    })
  });
  convexQueryClient.connect(queryClient);
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => /* @__PURE__ */ jsx(NotFound, {}),
    context: { queryClient, convexClient: convex, convexQueryClient },
    // NOTE:
    // This is the default Wrap function that is used by TanStack Router.
    // Here we can add our proviers that we want to be available in all routes.
    Wrap: ({ children }) => /* @__PURE__ */ jsx(ConvexProvider, { client: convexQueryClient.convexClient, children })
  });
  setupRouterSsrQueryIntegration({
    router,
    queryClient
  });
  return router;
};
export {
  getRouter
};
