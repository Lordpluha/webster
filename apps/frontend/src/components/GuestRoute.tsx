import { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuthStore } from "../shared/stores/auth.store";

export function GuestRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) return null;

  if (user) {
    return <Navigate to="/projects" replace />;
  }

  return <>{children}</>;
}
