"use client";

import React, { createContext, useContext } from "react";
import { Tenant } from "@/lib/types";

interface TenantContextValue {
  tenant: Tenant | null;
}

const TenantContext = createContext<TenantContextValue>({ tenant: null });

export function TenantProvider({
  tenant,
  children,
}: {
  tenant: Tenant | null;
  children: React.ReactNode;
}) {
  return (
    <TenantContext.Provider value={{ tenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
