import fetch from "node-fetch";

const analyticsUrl = process.env.PLAUSIBLE_API_HOST;

export function createSite(domain) {
  const url = `${analyticsUrl}/api/v1/sites`;
  const body = new FormData();
  body.append("domain", domain);

  return fetch(url, {
    body,
    headers: {
      Authorization: `Bearer ${process.env.PLAUSIBLE_API_KEY}`,
      "Content-Type": "multipart/form-data",
    },
    method: "POST",
  });
}

export async function createGoals(domain) {
  const changeState = await createEventGoal(doamin, "ChangeState");
  const outboundLink = await createEventGoal(doamin, "Outbound Link: Click");
  return {
    changeState,
    outboundLink,
  };
}

export function createEventGoal(domain, eventName) {
  const url = `${analyticsUrl}/api/v1/sites/goals`;
  const body = new FormData();
  body.append("site-id", domain);
  body.append("goal_type", "event");
  body.append("event_name", eventName);

  return fetch(url, {
    body,
    headers: {
      Authorization: `Bearer ${process.env.PLAUSIBLE_API_KEY}`,
      "Content-Type": "multipart/form-data",
    },
    method: "POST",
  }).then((r) => r.json());
}

export function createSharedLink(domain) {
  const url = `${analyticsUrl}/api/v1/sites/shared-links`;
  const body = new FormData();
  body.append("site-id", domain);
  body.append("name", "Shopify Dashboard");

  return fetch(url, {
    body,
    headers: {
      Authorization: `Bearer ${process.env.PLAUSIBLE_API_KEY}`,
      "Content-Type": "multipart/form-data",
    },
    method: "POST",
  }).then((r) => r.json());
}
