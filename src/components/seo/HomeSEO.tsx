import SEO from "./SEO";
import JsonLD from "./JsonLD";
import {
  SITE_CONFIG,
  generateOrganizationSchema,
  generateWebsiteSchema,
} from "@/utils/seo-helpers";

/**
 * SEO component specifically for the homepage
 * Includes Organization and WebSite schemas for rich results
 */
const HomeSEO = () => {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();

  return (
    <>
      <SEO
        title="Be Posh With Poshplex"
        description="Discover Poshplex - Be Posh With Poshplex. Shop our curated streetwear collection designed for style-conscious individuals."
        url="/"
        type="website"
      />
      <JsonLD data={[organizationSchema, websiteSchema]} />
    </>
  );
};

export default HomeSEO;
