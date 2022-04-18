import {
  Page,
  Heading,
  Stack,
  Spinner,
  Tabs,
  Link,
  MediaCard,
  VideoThumbnail,
  Button,
  List,
} from "@shopify/polaris";
import { useCallback, useState } from "react";
import useSWR from "swr";

import Dashbaord from "../components/Dashboard";
import { useFetch } from "../context/fetch";

const TABS = [
  {
    id: "widget",
    content: "Widget",
  },
  { id: "analytics", content: "Analytics Dashboard" },
];

export default function Index() {
  const [selectedTab, setSelectedTab] = useState<0 | 1>(0);
  const handleTabChange = useCallback(
    (selectedTabIndex) => setSelectedTab(selectedTabIndex),
    []
  );

  return (
    <Tabs tabs={TABS} selected={selectedTab} onSelect={handleTabChange}>
      {selectedTab === 0 && (
        <Page fullWidth>
          <Guide />
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

function Guide() {
  const fetch = useFetch();
  const fetcher = useCallback<
    (url: string) => Promise<{ theme: any; editorUrl: string }>
  >((url: string) => fetch(url).then((res) => res.json()), [fetch]);

  const { data, error, mutate } = useSWR<{ theme: any; editorUrl: string }>(
    "/api/store/themes/main",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      revalidateOnMount: true,
    }
  );

  if (!data) {
    return (
      <div
        style={{
          height: 300,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner size="large" />
      </div>
    );
  }
  return (
    <Stack vertical>
      <Heading>Instructions</Heading>
      <Stack vertical>
        <List type="number">
          <List.Item>Click the button “Open Theme Editor.”</List.Item>
          <List.Item>
            After opening the theme setting page, you will see Widget settings.
          </List.Item>
          <List.Item>
            To enable or disable the widget, you can use the toggle switcher
            near the app name.
          </List.Item>
          <List.Item>
            Here you can choose a visual variant of the widget, position, and
            initial state.
          </List.Item>
          <List.Item>
            Don’t forget to click the Save button in the top right corner to
            save theme settings after everything is ready.
          </List.Item>
        </List>
        <p>
          Thank you for your support! <span className="emoji">🇺🇦</span> Stand
          With Ukraine!
        </p>
        <Button primary url={data.editorUrl} external>
          Open Theme Editor
        </Button>
      </Stack>

      {/* <Heading>Video instruction</Heading>

      <iframe
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        width="788.54"
        height="443"
        src="https://www.youtube.com/embed/Q-Iw6ocVymM?autoplay=0&fs=1&iv_load_policy=3&showinfo=0&rel=0&cc_load_policy=0&start=0&end=0"
      ></iframe> */}
    </Stack>
  );
}
