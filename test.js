const fetch = require("node-fetch");

const analyticsUrl = process.env.PLAUSIBLE_API_HOST;

setupSite("test-jiffsy.myshopify.com").then(console.log).catch(console.error);
// createEventGoal("test-jiffsy.myshopify.com", "ChangeState")
//   .then(console.log)
//   .catch(console.error);

function createSite(domain) {
  const searchParams = new URLSearchParams();
  searchParams.append("domain", domain);
  const url = `${analyticsUrl}/api/v1/sites?${searchParams}`;

  const params = {
    body: searchParams,
    headers: {
      Authorization: `Bearer ${process.env.PLAUSIBLE_API_KEY}`,
      "Content-Type": "multipart/form-data",
    },
    method: "POST",
  };
  return fetch(url, params)
    .then((d) => d.json())
    .then((data) =>
      data.error && data.error === "domain has already been taken"
        ? { message: "already created" }
        : data
    );
}

async function createGoals(domain) {
  const changeState = await createEventGoal(domain, "ChangeState");
  console.log("> changeState", changeState);
  const outboundLink = await createEventGoal(domain, "Outbound Link: Click");
  console.log("> outboundLink", outboundLink);
  return {
    changeState,
    outboundLink,
  };
}

function createEventGoal(domain, eventName) {
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
  }).then((r) => {
    // console.log("Response", r);
    return r.json();
  });
}

function createSharedLink(domain) {
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

async function setupSite(domain) {
  const site = await createSite(domain);
  console.log("SITE", site);
  const events = await createGoals(domain);
  console.log("EVENTS", events);
  const sharedLink = await createSharedLink(domain);
  console.log("SHARED LINK", sharedLink);
  return { site, events, sharedLink };
}
