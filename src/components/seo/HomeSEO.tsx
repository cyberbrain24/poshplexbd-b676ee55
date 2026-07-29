import { Helmet } from "react-helmet-async";

const TITLE = "Poshplex — Be Posh With Poshplex";
const DESCRIPTION =
  "Shop Poshplex streetwear — curated tees, joggers and more, delivered across Bangladesh.";
const URL = "https://poshplexbd.com/";

const HomeSEO = () => (
  <Helmet>
    <title>{TITLE}</title>
    <meta name="description" content={DESCRIPTION} />
    <link rel="canonical" href={URL} />
    <meta property="og:title" content={TITLE} />
    <meta property="og:description" content={DESCRIPTION} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={URL} />
    <meta name="twitter:card" content="summary_large_image" />
  </Helmet>
);

export default HomeSEO;
