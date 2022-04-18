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
} from "@shopify/polaris";
import { useCallback, useState } from "react";
import useSWR from "swr";

import Dashbaord from "../components/Dashboard";
import { useFetch } from "../context/fetch";

const TABS = [
  {
    id: "installation",
    content: "Installation",
  },
  { id: "analytics", content: "Analytics" },
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
      <Heading>Widget customisation</Heading>
      <Stack vertical>
        <p>{"To customize widget apearance and position on scree"}</p>
        <Button primary url={data.editorUrl} external>
          Open Theme Editor
        </Button>
      </Stack>
      <Heading>Instructions</Heading>

      {/* <MediaCard
        size="small"
        title="Add Help Ukraine Widget to your theme"
        description={`It only takes 1 minute of your time. Please, see this video instruction`}
      > */}
        <iframe
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          width="788.54"
          height="443"
          src="https://www.youtube.com/embed/Q-Iw6ocVymM?autoplay=0&fs=1&iv_load_policy=3&showinfo=0&rel=0&cc_load_policy=0&start=0&end=0&origin=http://youtubeembedcode.com"
        >
          <div>
            <small>
              <a href="https://youtubeembedcode.com/nl/">
                youtubeembedcode.com/nl/
              </a>
            </small>
          </div>
          <div>
            <small>
              <a href="https://casinoutansvensklicensbrite.se/">
                https://casinoutansvensklicensbrite.se/
              </a>
            </small>
          </div>
          <div>
            <small>
              <a href="https://youtubeembedcode.com/de/">
                youtubeembedcode.com/de/
              </a>
            </small>
          </div>
          <div>
            <small>
              <a href="https://howtoembedgooglemaps.com/">
                https://howtoembedgooglemaps.com/
              </a>
            </small>
          </div>
        </iframe>
        {/* <VideoThumbnail
          onClick={() => {}}
          videoLength={80}
          thumbnailUrl="https://burst.shopifycdn.com/photos/business-woman-smiling-in-office.jpg?width=1850"
        /> */}
      {/* </MediaCard> */}
    </Stack>
  );
}
