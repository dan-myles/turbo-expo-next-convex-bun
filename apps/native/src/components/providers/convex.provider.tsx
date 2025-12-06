import { ConvexReactClient, ConvexProvider as CVXProvider } from "convex/react"

import { env } from "#native/env"

const convex = new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, {
  unsavedChangesWarning: false,
})

export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return <CVXProvider client={convex}>{children}</CVXProvider>
}
