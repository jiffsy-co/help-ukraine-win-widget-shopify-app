import { Banner, Spinner, Toast } from "@shopify/polaris";
import { useRef, useCallback, useState } from "react";
import useSWR from "swr";
import { useFetch } from "../context/fetch";

export default function Dashbaord() {
  const [{ setupLoading, error: errorMessage }, setState] = useState<{
    setupLoading: boolean;
    error?: string;
  }>({ setupLoading: false });
  const [active, setActive] = useState(false);
  const toggleActive = useCallback(() => setActive((active) => !active), []);
  const toastMarkup =
    errorMessage && active ? (
      <Toast content={errorMessage} error onDismiss={toggleActive} />
    ) : null;

  const fetch = useFetch();
  const fetcher = useCallback<(url: string) => Promise<{ sharedLink: string }>>(
    (url: string) => fetch(url).then((res) => res.json()),
    []
  );
  const fetcherPost = useCallback<
    (url: string) => Promise<{ sharedLink: string }>
  >(
    (url: string) => fetch(url, { method: "post" }).then((res) => res.json()),
    []
  );
  const { data, error, mutate } = useSWR<{ sharedLink: string }>(
    "/analytics",
    fetcher
  );
  const isLoading = !data && !error;
  const ref = useRef<HTMLIFrameElement | null>(null);
  if (isLoading) {
    return (
      <div
        style={{
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
  if (data?.sharedLink) {
    return (
      <iframe
        ref={ref}
        plausible-embed="true"
        src={`${data.sharedLink}&embed=true&theme=light&background=%23f6f6f7`}
        scrolling="yes"
        frameBorder="0"
        loading="lazy"
        style={{
          width: 1,
          minWidth: "100%",
          height: 2500,
        }}
      ></iframe>
    );
  }
  return (
    <>
      <Banner
        title="Dashboard is not ready yet"
        status="warning"
        action={{
          content: "Create",
          loading: setupLoading,
          onAction: () => {
            setState({
              setupLoading: true,
            });
            fetcherPost("/setup-analytics")
              .then((data) => {
                mutate(data);
              })
              .catch((error) => {
                const message = error.message || "Unknown error";
                setState({
                  setupLoading: false,
                  error: message,
                });
              })
              .finally(() => {
                setState({
                  setupLoading: false,
                });
              });
          },
        }}
      />
      {toastMarkup}
    </>
  );
}
