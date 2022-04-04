import fetch, { RequestInit } from "node-fetch";

const analyticsUrl = process.env.PLAUSIBLE_API_HOST;

export function createSite(domain: string): Promise<boolean> {
  const searchParams = new URLSearchParams();
  searchParams.append("domain", domain);
  const url = `${analyticsUrl}/api/v1/sites?${searchParams}`;

  const params: RequestInit = {
    body: searchParams,
    headers: {
      Authorization: `Bearer ${process.env.PLAUSIBLE_API_KEY}`,
      "Content-Type": "multipart/form-data",
    },
    method: "POST",
  };
  return fetch(url, params)
    .then((d) => d.json())
    .then((d) => {
      if (d.error) {
        return /this domain has already been taken/i.test(d.error);
      }
      return true;
    })
    .catch((error) => {
      console.error("Cerate Site failed:", error);
      return false;
    });
}

export async function createGoals(domain: string) {
  const changeState = await createEventGoal(domain, "ChangeState");
  const outboundLink = await createEventGoal(domain, "Outbound Link: Click");
  return {
    changeState,
    outboundLink,
  };
}

export function createEventGoal(
  domain,
  eventName
): Promise<
  | {
      domain: string;
      id: string;
      goal_type: string;
      event_name: string | null;
      page_path: string | null;
    }
  | { error: string }
> {
  const searchParams = new URLSearchParams();
  searchParams.append("site_id", domain);
  searchParams.append("goal_type", "event");
  searchParams.append("event_name", eventName);
  const url = `${analyticsUrl}/api/v1/sites/goals?${searchParams}`;

  return fetch(url, {
    body: searchParams,
    headers: {
      Authorization: `Bearer ${process.env.PLAUSIBLE_API_KEY}`,
      "Content-Type": "multipart/form-data",
    },
    method: "PUT",
  }).then((r) => r.json());
}

export function createSharedLink(
  domain
): Promise<
  | {
      name: string;
      url: string;
    }
  | { error: string }
> {
  const searchParams = new URLSearchParams();
  searchParams.append("site_id", domain);
  searchParams.append("name", "Shopify Dashboard");
  const url = `${analyticsUrl}/api/v1/sites/shared-links?${searchParams}`;

  return fetch(url, {
    body: searchParams,
    headers: {
      Authorization: `Bearer ${process.env.PLAUSIBLE_API_KEY}`,
      "Content-Type": "multipart/form-data",
    },
    method: "PUT",
  }).then((r) => r.json());
}

export async function setupSite(domain: string) {
  const site = await createSite(domain);
  const events = await createGoals(domain);
  const sharedLink = await createSharedLink(domain);
  return { site, events, sharedLink };
}
