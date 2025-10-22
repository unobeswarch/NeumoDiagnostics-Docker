"use client"

import type React from "react";

interface GraphQLProviderProps {
  children: React.ReactNode;
}

// Por ahora, un provider simple que no interfiere con la aplicación
// El cliente Apollo se usará directamente en los servicios
export function GraphQLProvider({ children }: GraphQLProviderProps) {
  return <>{children}</>;
}
