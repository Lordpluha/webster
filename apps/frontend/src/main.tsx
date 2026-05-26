import React from "react";
import ReactDOM from "react-dom/client";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { ApolloLink } from "@apollo/client/link";
import { ErrorLink } from "@apollo/client/link/error";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { Observable } from "@apollo/client/utilities";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./styles.css";
import { useToastStore } from "./shared/stores/toast.store";
import { useAuthStore } from "./shared/stores/auth.store";

const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL || "http://localhost:4000/graphql";

let pendingRefresh: Promise<boolean> | null = null;

async function refreshToken() {
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = (async () => {
    try {
      const response = await fetch(graphqlUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          query: "mutation RefreshToken { refreshToken { message } }",
        }),
      });

      const payload = await response.json();
      return response.ok && !payload.errors?.length;
    } catch {
      return false;
    }
  })().finally(() => {
    pendingRefresh = null;
  });

  return pendingRefresh;
}

let lastErrorToastAt = 0;
const ERROR_TOAST_THROTTLE_MS = 2500;

function pushErrorToast(title: string, message?: string) {
  const now = Date.now();
  if (now - lastErrorToastAt < ERROR_TOAST_THROTTLE_MS) {
    return;
  }
  lastErrorToastAt = now;
  useToastStore.getState().pushToast({
    title,
    message,
    tone: "error",
  });
}

const errorLink = new ErrorLink(({ error, operation, forward }) => {
  const isGraphQLError = CombinedGraphQLErrors.is(error);

  if (!isGraphQLError) {
    pushErrorToast("Server error", error.message);
    return;
  }

  const hasAuthError = error.errors.some((err) => {
    if (err.extensions?.code === "UNAUTHENTICATED") return true;
    const orig = err.extensions?.originalError as Record<string, unknown> | undefined;
    if (orig?.statusCode === 401) return true;
    return false;
  });

  if (!hasAuthError) {
    pushErrorToast("Request failed", error.errors[0]?.message);
    return;
  }

  return new Observable((observer) => {
    let subscription: { unsubscribe(): void } | null = null;

    refreshToken()
      .then((didRefresh) => {
        if (!didRefresh) {
          useAuthStore.getState().setUser(null);
          observer.complete();
          return;
        }

        subscription = forward(operation).subscribe({
          next: (result) => observer.next(result),
          error: (err) => observer.error(err),
          complete: () => observer.complete(),
        });
      })
      .catch(() => {
        useAuthStore.getState().setUser(null);
        observer.complete();
      });

    return () => subscription?.unsubscribe();
  });
});

const apolloClient = new ApolloClient({
  link: ApolloLink.from([
    errorLink,
    new HttpLink({
      uri: graphqlUrl,
      credentials: "include",
    }),
  ]),
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ApolloProvider>
  </React.StrictMode>,
);
