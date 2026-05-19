import type { Page, Route } from "@playwright/test";

type GraphqlBody = {
  operationName?: string;
  query?: string;
  variables?: Record<string, unknown>;
};

function resolveOperationName(body: GraphqlBody): string | undefined {
  if (body.operationName) {
    return body.operationName;
  }
  const match = body.query?.match(/(?:query|mutation)\s+(\w+)/);
  return match?.[1];
}

export async function mockGraphql(
  page: Page,
  handlers: Record<string, (body: GraphqlBody) => unknown>,
): Promise<void> {
  await page.route("**/graphql", async (route: Route) => {
    const body = route.request().postDataJSON() as GraphqlBody;
    const op = resolveOperationName(body);

    if (op && handlers[op]) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: handlers[op](body) }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: {} }),
    });
  });
}

export const guestMeHandler = {
  GetCurrentUser: () => ({ me: null }),
};

export const authUser = {
  id: "user-e2e",
  email: "e2e@webster.test",
  firstName: "E2E",
  lastName: "User",
  isEmailVerified: true,
  isTwoFactorEnabled: false,
};
