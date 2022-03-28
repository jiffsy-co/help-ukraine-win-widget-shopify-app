import Shopify from "@shopify/shopify-api";

export const getThemes = async () => {
  userLoggedInFetch
  const client = new Shopify.Clients.Rest(
    "your-development-store.myshopify.com",
    accessToken
  );
  return client.get({
    path: "themes",
  });
};
