import {
  Page,
  Select,
  FormLayout,
  Card,
  Banner,
  List,
  Stack,
  Spinner,
  Checkbox,
  SelectOption,
  Tabs,
  Layout,
} from "@shopify/polaris";
import { gql } from "apollo-boost";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "react-apollo";
import Dashbaord from "../components/Dashboard";
import Preview from "../components/Preview";
import {
  IWidgetOptions,
  widgetTypes,
  widgetPositions,
  WIDGET_JS_SRC,
  widgetLayouts,
} from "../types";

export default function Index() {
  const router = useRouter();
  const shop = router.query.shop as string | undefined;
  const [widgetOptions, setWidgetOptions] = useState<IWidgetOptions>({
    type: widgetTypes[0].value,
    position: widgetPositions[0].value,
    layout: "main",
    domain: shop || "",
  });
  const { data, loading, error, refetch, networkStatus } = useQuery<{
    scriptTags: {
      edges: {
        node: {
          id: string;
          src: string;
        };
      }[];
    };
  }>(
    gql`
      query Scripts {
        scriptTags(first: 10) {
          edges {
            node {
              cache
              id
              src
              displayScope
            }
          }
        }
      }
    `,
    {
      notifyOnNetworkStatusChange: true,
    }
  );

  const { data: domainsData } = useQuery<{
    shop: { domains: { host: string }[] };
  }>(gql`
    query Domains {
      shop {
        name
        domains {
          host
          url
          sslEnabled
        }
      }
    }
  `);

  const myShopifyDomain = domainsData?.shop.domains.find((d) =>
    /\.myshopify\.com$/.test(d.host)
  );

  useEffect(() => {
    if (myShopifyDomain?.host) {
      setWidgetOptions((opts) => ({ ...opts, domain: myShopifyDomain.host }));
    }
  }, [myShopifyDomain?.host]);

  const publishedScriptTag = useMemo(() => {
    return (
      data?.scriptTags?.edges.find(({ node }) =>
        node.src.startsWith(WIDGET_JS_SRC)
      )?.node || null
    );
  }, [data?.scriptTags]);

  const publishedWidgetOptions = useMemo<IWidgetOptions | null>(() => {
    if (publishedScriptTag) {
      const params = parseUrl<Partial<IWidgetOptions>>(publishedScriptTag.src);
      const type = params.type || widgetTypes[0].value;
      const position = params.position || widgetPositions[0].value;
      const layout =
        params.layout &&
        widgetLayouts.map((a) => a.value).includes(params.layout)
          ? params.layout
          : "main";
      const domain = params.domain || (router.query.shop as string) || "";
      return {
        type,
        position,
        layout,
        domain,
      };
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publishedScriptTag]);

  useEffect(() => {
    if (publishedWidgetOptions) {
      setWidgetOptions(publishedWidgetOptions);
    }
  }, [publishedWidgetOptions]);

  const finalSrc = `${WIDGET_JS_SRC}?type=${encodeURIComponent(
    widgetOptions.type
  )}&position=${encodeURIComponent(
    widgetOptions.position
  )}&layout=${encodeURIComponent(
    widgetOptions.layout
  )}&domain=${encodeURIComponent(widgetOptions.domain)}`;

  const [
    addScript,
    { loading: addScriptLoading, data: addScriptData, error: addScriptError },
  ] = useMutation(
    gql`
      mutation CreateScript($src: URL!) {
        scriptTagCreate(input: { src: $src, displayScope: ALL, cache: true }) {
          scriptTag {
            id
            cache
            displayScope
            src
          }
        }
      }
    `,
    {
      variables: { src: finalSrc },
      refetchQueries: ["Scripts"],
    }
  );
  const [
    updateScript,
    {
      loading: updateScriptLoading,
      data: updateScriptData,
      error: updateScriptError,
    },
  ] = useMutation(
    gql`
      mutation UpdateScript($id: ID!, $src: URL!) {
        scriptTagUpdate(
          id: $id
          input: { src: $src, displayScope: ALL, cache: true }
        ) {
          scriptTag {
            id
            cache
            displayScope
            src
          }
        }
      }
    `,
    {
      variables: { src: finalSrc, id: publishedScriptTag?.id },
      refetchQueries: ["Scripts"],
    }
  );
  const [
    deleteScript,
    {
      data: deleteScriptData,
      loading: deleteScriptLoading,
      error: deleteScriptError,
    },
  ] = useMutation(
    gql`
      mutation DeleteScript($id: ID!) {
        scriptTagDelete(id: $id) {
          deletedScriptTagId
        }
      }
    `,
    {
      refetchQueries: ["Scripts"],
      variables: { id: publishedScriptTag?.id },
    }
  );

  const [selectedTab, setSelectedTab] = useState<0 | 1>(0);

  const handleTabChange = useCallback(
    (selectedTabIndex) => setSelectedTab(selectedTabIndex),
    []
  );
  const tabs = [
    {
      id: "widget",
      content: "Widget",
    },
    { id: "dashboard", content: "Analytics Dashboard" },
  ];

  const dirty = publishedWidgetOptions
    ? publishedWidgetOptions.type !== widgetOptions.type ||
      publishedWidgetOptions.position !== widgetOptions.position ||
      publishedWidgetOptions.layout !== widgetOptions.layout
    : true;

  const initialLoading = loading && !data;
  const secondaryFooterActions = [];

  if (publishedWidgetOptions && dirty) {
    secondaryFooterActions.push({
      content: "Discard changes",
      onAction: () => {
        setWidgetOptions({
          type: publishedWidgetOptions.type,
          position: publishedWidgetOptions.position,
          layout: publishedWidgetOptions.layout,
          domain: publishedWidgetOptions.domain,
        });
      },
    });
  }
  if (publishedScriptTag) {
    secondaryFooterActions.push({
      destructive: true,
      loading: deleteScriptLoading || loading,
      content: "Unpublish",
      onAction: () => {
        deleteScript();
      },
    });
  }

  const showBanner = !publishedWidgetOptions && !loading;
  return (
    <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
      {selectedTab === 0 && (
        <Page>
          <Stack vertical>
            {showBanner && (
              <Banner title="Widget is not published yet" status="info" />
            )}
            {initialLoading && (
              <Stack alignment="center" distribution="center">
                <Spinner size="large" />
              </Stack>
            )}
            {!initialLoading && (
              <Card
                title="Customise Widget"
                sectioned={false}
                primaryFooterAction={{
                  content: publishedWidgetOptions ? "Update" : "Publish",
                  disabled: !dirty,
                  onAction: () => {
                    publishedWidgetOptions ? updateScript() : addScript();
                  },
                  loading: addScriptLoading || updateScriptLoading || loading,
                }}
                secondaryFooterActions={secondaryFooterActions}
              >
                <Card.Section fullWidth subdued>
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      overflow: "auto",
                    }}
                  >
                    <Preview
                      type={widgetOptions.type}
                      position={widgetOptions.position}
                      layout={widgetOptions.layout}
                      domain={widgetOptions.domain}
                    />
                  </div>
                </Card.Section>
                <Card.Section>
                  <FormLayout>
                    <FormLayout.Group>
                      <Select
                        label="Type"
                        options={(widgetTypes as any) as SelectOption[]}
                        value={widgetOptions.type}
                        onChange={(selected: IWidgetOptions["type"], id) => {
                          setWidgetOptions((opts) => ({
                            ...opts,
                            type: selected,
                          }));
                        }}
                      />
                      <Select
                        label="Position on page"
                        options={(widgetPositions as any) as SelectOption[]}
                        value={widgetOptions.position}
                        onChange={(
                          selected: IWidgetOptions["position"],
                          id
                        ) => {
                          setWidgetOptions((opts) => ({
                            ...opts,
                            position: selected,
                          }));
                        }}
                      />
                    </FormLayout.Group>
                    <FormLayout.Group>
                      <Checkbox
                        label="Collapsed by default"
                        checked={widgetOptions.layout === "collapsed"}
                        onChange={(newChecked) => {
                          setWidgetOptions((opts) => ({
                            ...opts,
                            layout: newChecked ? "collapsed" : "main",
                          }));
                        }}
                      ></Checkbox>
                    </FormLayout.Group>
                  </FormLayout>
                </Card.Section>
              </Card>
            )}
          </Stack>
        </Page>
      )}
      {selectedTab === 1 && (
        <Page fullWidth>
          <Dashbaord />
        </Page>
      )}
    </Tabs>
  );
}

/**
 *
 * @param {string} url
 * @returns
 */
function parseUrl<T>(url: string): T {
  const [, qs] = url.split("?");
  return (qs
    ? qs
        .split("&")
        .map((parts) => parts.split("="))
        .reduce(
          (acc, [k, v]) => ({
            ...acc,
            [decodeURIComponent(k)]: decodeURIComponent(v),
          }),
          {}
        )
    : {}) as T;
}
