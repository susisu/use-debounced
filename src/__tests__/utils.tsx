import { renderHook } from "@testing-library/react";
import React from "react";

export const strictRenderHook: typeof renderHook = (render, options) => {
  const Wrapper = options?.wrapper;
  const StrictWrapper: React.FC<{ children: React.ReactElement }> = ({ children }) => (
    <React.StrictMode>{Wrapper ? <Wrapper>{children}</Wrapper> : children}</React.StrictMode>
  );
  return renderHook(render, { ...options, wrapper: StrictWrapper });
};
