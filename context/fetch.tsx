import React, { PropsWithChildren } from "react";

export const fetchCtx = React.createContext<WindowOrWorkerGlobalScope["fetch"]>(
  ((async () => {}) as any) as WindowOrWorkerGlobalScope["fetch"]
);
export const useFetch = () => React.useContext(fetchCtx);
export function FetchProvider({
  children,
  fetch,
}: PropsWithChildren<{ fetch: WindowOrWorkerGlobalScope["fetch"] }>) {
  return <fetchCtx.Provider value={fetch}>{children}</fetchCtx.Provider>;
}
