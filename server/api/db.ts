import { PrismaClient, Store, StoreUser } from "@prisma/client";

const prisma = new PrismaClient();

export async function createStore(
  data: Omit<Partial<Store>, "id" | "createdAt" | "updatedAt"> &
    Pick<Store, "shop" | "scope">,
  userStore?: Omit<StoreUser, "id" | "createdAt" | "updatedAt" | "storeShop">
) {
  const results = await prisma.$transaction([
    prisma.store.create({
      data,
    }),
    ...(userStore
      ? [createUserStore({ ...userStore, storeShop: data.shop })]
      : []),
  ]);
  return results[0];
}

export function updateStore(
  shop: string,
  data: Omit<Partial<Store>, "id" | "createdAt" | "updatedAt">
) {
  return prisma.store.update({
    where: { shop },
    data,
  });
}

export function createUserStore(
  data: Pick<
    StoreUser,
    | "accountOwner"
    | "collaborator"
    | "locale"
    | "email"
    | "emailVerified"
    | "firstName"
    | "lastName"
    | "storeShop"
  >
) {
  return prisma.storeUser.create({
    data,
  });
}

export function getStore(shop: string) {
  return prisma.store.findFirst({
    where: {
      shop: {
        equals: shop,
      },
    },
  });
}

export function enableStore(shop: string) {
  return prisma.store.update({
    where: { shop },
    data: { enabled: true },
  });
}

export function disableStore(shop: string) {
  return prisma.store.update({
    where: { shop },
    data: { enabled: false },
  });
}

export function createGdprWebhook(shop: string, topic: string, payload: any) {
  return prisma.gdprWebhook.create({
    data: {
      shopDomain: shop,
      topic,
      payload,
    },
  });
}
