import { Banner, Spinner, Toast } from "@shopify/polaris";
import { useRef, useCallback, useState } from "react";
import useSWR from "swr";
import { useFetch } from "../context/fetch";

export default function Dashbaord() {
  const [{ setupLoading, error: errorMessage }, setState] = useState<{
    setupLoading: boolean;
    error?: string;
  }>({ setupLoading: false });
  const [showSpinner, setShowSpinner] = useState(true);
  const [active, setActive] = useState(false);
  const toggleActive = useCallback(() => setActive((active) => !active), []);
  const toastMarkup =
    errorMessage && active ? (
      <Toast content={errorMessage} error onDismiss={toggleActive} />
    ) : null;

  const fetch = useFetch();
  const fetcher = useCallback<(url: string) => Promise<{ sharedLink: string }>>(
    (url: string) => fetch(url).then((res) => res.json()),
    [fetch]
  );
  const fetcherPost = useCallback<
    (url: string) => Promise<{ sharedLink: string }>
  >((url: string) => fetch(url, { method: "post" }).then((res) => res.json()), [
    fetch,
  ]);
  const { data, error, mutate } = useSWR<{ sharedLink: string }>(
    "/analytics",
    fetcher
  );
  const isLoading = !data;
  const ref = useRef<HTMLIFrameElement | null>(null);
  if (isLoading) {
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
  if (data?.sharedLink) {
    return (
      <div style={{ position: "relative" }}>
        {showSpinner && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: 300,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <Spinner size="large" />
          </div>
        )}
        <iframe
          onLoad={() => {
            setShowSpinner(false);
          }}
          onError={() => {
            setShowSpinner(false);
          }}
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
            zIndex: 2,
          }}
        ></iframe>
      </div>
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
