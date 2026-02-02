import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "convex/react"

import { api } from "@acme/backend/_generated/api"

export const Route = createFileRoute("/")({ component: App })

function App() {
  const data = useQuery(api.functions.task.list)
  if (!data) return <div>Loading...</div>

  return (
    <div className="bg-red-200">
      {data.map((d) => (
        <div>{d._id}</div>
      ))}
    </div>
  )
}
