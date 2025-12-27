import { notifyManager } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"

import { routeTree } from "./routeTree.gen"

export const getRouter = () => {
  if (typeof document !== "undefined") {
    notifyManager.setScheduler(window.requestAnimationFrame)
  }

  const router = createRouter({
    routeTree,
    defaultPreload: "intent",
  })

  return router
}
