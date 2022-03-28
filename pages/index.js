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
} from "@shopify/polaris";
import { gql } from "apollo-boost";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "react-apollo";
import Preview from "../components/Preview";

const WIDGET_JS_SRC = "https://helpukrainewinwidget.org/cdn/widget.js";

const widgetTypes = [
  { label: "One", value: "one" },
  { label: "Two", value: "two" },
  { label: "Three", value: "three" },
  { label: "Four", value: "four" },
];

const widgetPositions = [
  { label: "Top Left", value: "top-left" },
  { label: "Top Right", value: "top-right" },
  { label: "Bottom Left", value: "bottom-left" },
  { label: "Bottom Right", value: "bottom-right" },
];

export default function Index() {
  const [widgetOptions, setWidgetOptions] = useState({
    type: widgetTypes[0].value,
    position: widgetPositions[0].value,
    collapsedByDefault: false,
  });
  const { data, loading, error, refetch, networkStatus } = useQuery(
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

  const { data: domainsData } = useQuery(gql`
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

  const publishedScriptTag = useMemo(() => {
    if (!data) {
      return null;
    }
    return data?.scriptTags?.edges.find(({ node }) =>
      node.src.startsWith(WIDGET_JS_SRC)
    )?.node;
  }, [data?.scriptTags]);

  const publishedWidgetOptions = useMemo(() => {
    if (publishedScriptTag) {
      const params = parseUrl(publishedScriptTag.src);
      const type = params.type || widgetTypes[0].value;
      const position = params.position || widgetTypes[0].position;
      const collapsedByDefault =
        params.collapsed === undefined
          ? widgetTypes[0].collapsed
          : params.collapsed === "true";
      return { type, position, collapsedByDefault };
    }
    return null;
  }, [publishedScriptTag]);

  useEffect(() => {
    if (publishedWidgetOptions) {
      setWidgetOptions(publishedWidgetOptions);
    }
  }, [publishedWidgetOptions]);

  const finalSrc = `${WIDGET_JS_SRC}?type=${encodeURIComponent(
    widgetOptions.type
  )}&position=${encodeURIComponent(widgetOptions.position)}&collapsed=${
    widgetOptions.collapsedByDefault
  }`;

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

  const dirty = publishedWidgetOptions
    ? publishedWidgetOptions.type !== widgetOptions.type ||
      publishedWidgetOptions.position !== widgetOptions.position ||
      publishedWidgetOptions.collapsedByDefault !==
        widgetOptions.collapsedByDefault
    : true;

  const initialLoading = loading && !data;
  const secondaryFooterActions = [];
  if (publishedWidgetOptions && dirty) {
    secondaryFooterActions.push({
      content: "Cancel",
      onAction: () => {
        setWidgetOptions({
          type: publishedWidgetOptions.type,
          position: publishedWidgetOptions.position,
          collapsedByDefault: publishedWidgetOptions.collapsedByDefault,
        });
      },
    });
  }
  if (publishedScriptTag) {
    secondaryFooterActions.push({
      destructive: true,
      loading: deleteScriptLoading,
      content: "Unpublish",
      onAction: () => {
        deleteScript();
      },
    });
  }

  return (
    <Page>
      <Stack vertical>
        <pre>{JSON.stringify(domainsData, null, 2)}</pre>
        {!publishedWidgetOptions && !loading && (
          <Banner title="Widget is not published yet" status="info">
            <List type="bullet">
              <List.Item>Choose a widget type</List.Item>
              <List.Item>{"Choose widget's position on the page"}</List.Item>
              <List.Item>Publish</List.Item>
            </List>
          </Banner>
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
              loading: addScriptLoading || updateScriptLoading,
            }}
            secondaryFooterActions={secondaryFooterActions}
          >
            <Card.Section fullWidth subdued>
              <div style={{ width: "100%", height: "100%", overflow: "auto" }}>
                <Preview
                  type={widgetOptions.type}
                  position={widgetOptions.position}
                  collapsedByDefault={widgetOptions.collapsedByDefault}
                />
              </div>
            </Card.Section>
            <Card.Section>
              <FormLayout>
                <FormLayout.Group>
                  <Select
                    label="Type"
                    options={widgetTypes}
                    value={widgetOptions.type}
                    onChange={(selected, id) => {
                      setWidgetOptions((opts) => ({ ...opts, type: selected }));
                    }}
                  />
                  <Select
                    label="Position on page"
                    options={widgetPositions}
                    value={widgetOptions.position}
                    onChange={(selected, id) => {
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
                    checked={widgetOptions.collapsedByDefault}
                    onChange={(newChecked) => {
                      setWidgetOptions((opts) => ({
                        ...opts,
                        collapsedByDefault: newChecked,
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
  );
}

/**
 *
 * @param {string} url
 * @returns
 */
function parseUrl(url) {
  const [, qs] = url.split("?");
  return qs
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
    : {};
}
