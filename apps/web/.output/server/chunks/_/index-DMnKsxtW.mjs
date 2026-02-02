import { jsx } from "react/jsx-runtime";
import { useQuery } from "convex/react";
import { anyApi, componentsGeneric } from "convex/server";
const api = anyApi;
componentsGeneric();
function App() {
  const data = useQuery(api.functions.task.list);
  if (!data) return /* @__PURE__ */ jsx("div", { children: "Loading..." });
  return /* @__PURE__ */ jsx("div", { className: "bg-red-200", children: data.map((d) => /* @__PURE__ */ jsx("div", { children: d._id })) });
}
export {
  App as component
};
