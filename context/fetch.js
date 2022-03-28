import React from "react";

export const fetchCtx = React.createContext(() => {});
export const useFetch = () => React.useContext(fetchCtx);
export function FetchProvider({ children, fetch }) {
  return <fetchCtx.Provider value={fetch}>{children}</fetchCtx.Provider>;
}
