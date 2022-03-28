import ApolloClient from "apollo-boost";
import React from "react";
import { ApolloProvider } from "react-apollo";
import App from "next/app";
import { AppProvider } from "@shopify/polaris";
import { Provider, useAppBridge } from "@shopify/app-bridge-react";
import "@shopify/polaris/dist/styles.css";
import translations from "@shopify/polaris/locales/en.json";

import { userLoggedInFetch } from "../api/auth";
import { FetchProvider } from "../context/fetch";

function MyProvider(props) {
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

class MyApp extends App {
  render() {
    const { Component, pageProps, host } = this.props;
    return (
      <AppProvider i18n={translations}>
        <Provider
          config={{
            apiKey: API_KEY,
            host: host,
            forceRedirect: true,
          }}
        >
          <MyProvider Component={Component} {...pageProps} />
        </Provider>
        {/* <script
          defer
          data-domain="89d5-176-98-30-187.ngrok.io"
          src="http://localhost:8000/js/plausible.js"
        ></script> */}
        {/* <Script>
          {`if(!sessionStorage.getItem("_swa")&&document.referrer.indexOf(location.protocol+"//"+location.host)!==
          0)
          {fetch(
            "https://counter.dev/track?" +
              new URLSearchParams({
                referrer: document.referrer,
                screen: screen.width + "x" + screen.height,
                user: "dmitriysidor3nk0@gmail.com",
                utcoffset: "2",
              })
          )}
          ;sessionStorage.setItem("_swa","1");`}
        </Script> */}
      </AppProvider>
    );
  }
}

MyApp.getInitialProps = async ({ ctx }) => {
  return {
    host: ctx.query.host,
  };
};

export default MyApp;
