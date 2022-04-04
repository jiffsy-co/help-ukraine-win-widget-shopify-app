import ApolloClient from "apollo-boost";
import React from "react";
import { ApolloProvider } from "react-apollo";
import { AppProps, AppContext } from "next/app";
import { AppProvider } from "@shopify/polaris";
import { Provider, useAppBridge } from "@shopify/app-bridge-react";
import "@shopify/polaris/dist/styles.css";
import translations from "@shopify/polaris/locales/en.json";

import { userLoggedInFetch } from "../api/auth";
import { FetchProvider } from "../context/fetch";

function MyProvider(props: { Component: React.JSXElementConstructor<any> }) {
  const app = useAppBridge();
  const fetch = userLoggedInFetch(app);
  const client = new ApolloClient({
    fetch,
    fetchOptions: {
      credentials: "include",
    },
  });

  const Component = props.Component;

  return (
    <FetchProvider fetch={fetch}>
      <ApolloProvider client={client}>
        <Component {...props} />
      </ApolloProvider>
    </FetchProvider>
  );
}

function MyApp(props: AppProps<{ host: string }> & { host: string }) {
  const { Component, pageProps, host } = props;
  return (
    <AppProvider i18n={translations}>
      <Provider
        config={{
          apiKey: process.env.API_KEY || "",
          host,
          forceRedirect: true,
        }}
      >
        <MyProvider Component={Component} {...pageProps} />
      </Provider>
    </AppProvider>
  );
}

MyApp.getInitialProps = async ({ ctx }: AppContext) => {
  return {
    host: ctx.query.host,
  };
};

export default MyApp;
