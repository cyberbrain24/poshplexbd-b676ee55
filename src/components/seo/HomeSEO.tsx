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
        title="Premium Fashion & Jewelry"
        description="Discover Poshplex - your destination for premium fashion and elegant jewelry. Shop our curated collection of modern pieces designed for style-conscious individuals."
        url="/"
        type="website"
      />
      <JsonLD data={[organizationSchema, websiteSchema]} />
    </>
  );
};

export default HomeSEO;
