import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import { receiveWebhook } from "@shopify/koa-shopify-webhooks";
import Shopify, { ApiVersion, SessionInterface } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import {
  createGdprWebhook,
  createStore,
  disableStore,
  enableStore,
  getStore,
  updateStore,
} from "./api/db";
import { setupSite } from "./api/analytics";
import { Store } from "@prisma/client";

dotenv.config();
const port = parseInt(process.env.PORT || "", 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();

// console.log("ENVS >> ", JSON.stringify(process.env, null, 2));
Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY || "",
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET || "",
  SCOPES: (process.env.SCOPES || "").split(","),
  HOST_NAME: (process.env.HOST || "").replace(/https:\/\/|\/$/g, ""),
  API_VERSION: ApiVersion.October20,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
// const ACTIVE_SHOPIFY_SHOPS: Record<string, any> = {};

Shopify.Webhooks.Registry.addHandler("APP_UNINSTALLED", {
  path: "/webhooks",
  webhookHandler: async (topic, shop, body) => {
    // delete ACTIVE_SHOPIFY_SHOPS[shop];
    await disableStore(shop);
  },
});

app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope, onlineAccessInfo } = ctx.state
          .shopify as SessionInterface;
        const host = ctx.query.host;
        ctx.set(
          "Content-Security-Policy",
          `frame-ancestors ${
            shop ? "https://" + shop : "*.myshopify.com"
          } https://admin.shopify.com`
        );
        const store =
          (await getStore(shop)) ||
          (await createStore(
            {
              shop,
              enabled: true,
              scope: scope || "",
            },
            onlineAccessInfo?.associated_user && {
              accountOwner: onlineAccessInfo.associated_user.account_owner,
              collaborator: onlineAccessInfo.associated_user.collaborator,
              email: onlineAccessInfo.associated_user.email,
              emailVerified: onlineAccessInfo.associated_user.email_verified,
              firstName: onlineAccessInfo.associated_user.first_name,
              lastName: onlineAccessInfo.associated_user.last_name,
              locale: onlineAccessInfo.associated_user.locale,
            }
          ));
        if (!store.enabled) {
          await enableStore(shop);
        }
        try {
          await setupDashboard(store);
        } catch (error) {
          console.error("> Setup Site FAILED:\n", error);
        }
        // ACTIVE_SHOPIFY_SHOPS[shop] = scope;

        const responses = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken: accessToken || "",
          path: "/webhooks",
          topic: "APP_UNINSTALLED",
        });
        console.log(JSON.stringify(ctx.state.shopify, null, 2));
        console.log(JSON.stringify(responses, null, 2));

        if (!responses["APP_UNINSTALLED"].success) {
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${responses.result}`
          );
        }

        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}&host=${host}`);
      },
    })
  );

  const handleRequest = async (
    ctx: Koa.ParameterizedContext<any, Router.IRouterParamContext<any, {}>>
  ) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };

  router.post("/webhooks", async (ctx) => {
    try {
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });

  router.post(
    "/graphql",
    verifyRequest({ returnHeader: true }),
    async (ctx, next) => {
      await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
    }
  );

  router.get(
    "/analytics",
    verifyRequest({ returnHeader: true }),
    async (ctx) => {
      console.log("GET /analytics", ctx);
      const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
      const shop = session.shop;
      console.log("> shop", shop);
      const store = await getStore(shop);
      console.log("> store", store);
      if (!store || !store.enabled) {
        ctx.redirect(`/auth?shop=${shop}`);
      } else {
        ctx.body = {
          sharedLink: store.analyticsDashboardUrl,
        };
      }
    }
  );
  router.post(
    "/setup-analytics",
    verifyRequest({ returnHeader: true }),
    async (ctx) => {
      console.log("GET /analytics", ctx);
      const session = await Shopify.Utils.loadCurrentSession(ctx.req, ctx.res);
      const shop = session.shop;
      console.log("> shop", shop);
      const store = await getStore(shop);
      console.log("> store", store);
      if (!store || !store.enabled) {
        ctx.redirect(`/auth?shop=${shop}`);
      } else {
        const updateStore = await setupDashboard(store);
        ctx.body = {
          sharedLink: updateStore.analyticsDashboardUrl,
        };
      }
    }
  );

  const webhook = receiveWebhook({
    secret: process.env.SHOPIFY_API_SECRET || "",
  });

  router.post("/webhook/gdpr/customers/data_request", webhook, async (ctx) => {
    const data = getWebhookConfig(ctx);
    console.log("webhook/gdpr/customers/data_request", data, ctx.request);
    const response = await createGdprWebhook(
      data.shop_domain,
      data.topic,
      data.payload
    );
    console.log("DB webhook/gdpr/customers/data_request", response);
  });

  router.post("/webhook/gdpr/customers/redact", webhook, async (ctx) => {
    const data = getWebhookConfig(ctx);
    console.log("webhook/gdpr/customers/redact", data, ctx.request);
    const response = await createGdprWebhook(
      data.shop_domain,
      data.topic,
      data.payload
    );
    console.log("DB webhook/gdpr/customers/redact", response);
  });

  router.post("/webhook/gdpr/shop/redact", webhook, async (ctx) => {
    const data = getWebhookConfig(ctx);
    console.log("webhook/gdpr/shop/redact", data, ctx.request);
    const response = await createGdprWebhook(
      data.shop_domain,
      data.topic,
      data.payload
    );
    console.log("DB webhook/gdpr/shop/redact", response);
  });

  function getWebhookConfig(ctx: any) {
    const shop_domain = ctx.state.webhook.domain;
    const topic = ctx.state.webhook.topic;
    const payload = ctx.state.webhook.payload;
    return { shop_domain, topic, payload };
  }

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", async (ctx) => {
    const shop = ctx.query.shop as string;
    const store = await getStore(shop);
    ctx.set(
      "Content-Security-Policy",
      `frame-ancestors ${
        shop ? "https://" + shop : "*.myshopify.com"
      } https://admin.shopify.com`
    );

    // This shop hasn't been seen yet, go through OAuth to create a session
    if (!store || !store.enabled) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });

  server.use(router.allowedMethods());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});

async function setupDashboard(store: Store) {
  console.log("setupDashboard", store);
  const setupResponse = await setupSite(store.shop);
  console.log("Setup Site RESPONSE:\n", JSON.stringify(setupResponse, null, 2));
  let needToSave = false;
  if (setupResponse.site !== store.analyticsAccountCreated) {
    store.analyticsAccountCreated = setupResponse.site;
    needToSave = true;
  }
  if (
    setupResponse.sharedLink &&
    "url" in setupResponse.sharedLink &&
    store.analyticsDashboardUrl !== setupResponse.sharedLink.url
  ) {
    store.analyticsDashboardUrl = setupResponse.sharedLink.url;
    needToSave = true;
  }
  const changeState = "domain" in setupResponse.events.changeState;
  const outboundLink = "domain" in setupResponse.events.changeState;
  if (
    changeState !== store.changeStateEventGoalAdded ||
    outboundLink !== store.outboundLinkEventGoalAdded
  ) {
    store.changeStateEventGoalAdded = changeState;
    store.outboundLinkEventGoalAdded = outboundLink;
    needToSave = true;
  }
  if (needToSave) {
    console.log("Saving changes", store);
    return await updateStore(store.shop, {
      analyticsAccountCreated: store.analyticsAccountCreated,
      analyticsDashboardUrl: store.analyticsDashboardUrl,
      changeStateEventGoalAdded: store.changeStateEventGoalAdded,
      outboundLinkEventGoalAdded: store.outboundLinkEventGoalAdded,
    });
  }
  return store;
}
