import { useRouter } from "next/router";
import Script from "next/script";

const types = ["one", "two", "three", "four"];
const positions = ["bottom-left", "bottom-right", "top-left", "top-right"];

export const getStaticPaths = async () => {
  return {
    fallback: "blocking",
    paths: types.flatMap((type) =>
      positions.map((position) => ({
        params: {
          type,
          position,
        },
      }))
    ),
  };
};

export const getStaticProps = async ({ params }) => {
  return {
    props: {},
  };
};

const Sandbox = () => {
  const router = useRouter();
  const params = router.query;
  return (
    <>
      <style jsx global>
        {`
          html,
          body {
            height: 100%;
          }
          body {
            zoom: 0.7;
          }
          .huww-widget.huww-widget-top-right {
            top: 1.6rem !important;
            right: 1rem !important;
          }
          .huww-widget.huww-widget-top-left {
            top: 1.6rem !important;
            left: 1rem !important;
          }
          .huww-widget.huww-widget-bottom-right {
            bottom: 1rem !important;
            right: 1rem !important;
          }
          .huww-widget.huww-widget-bottom-left {
            bottom: 1rem !important;
            left: 1rem !important;
          }
        `}
      </style>
      <h1>Preview</h1>
      <Script
        id="help-ukraine-win"
        async
        src="https://helpukrainewinwidget.org/cdn/widget.js"
        data-type={params.type}
        data-position={params.position}
      />
    </>
  );
};

export default Sandbox;
