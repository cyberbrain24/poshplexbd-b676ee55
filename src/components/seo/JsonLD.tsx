import { Helmet } from "react-helmet-async";

interface JsonLDProps {
  data: object | object[];
}

/**
 * Component to inject JSON-LD structured data into the page head
 * Supports single schema or multiple schemas
 */
const JsonLD = ({ data }: JsonLDProps) => {
  const schemas = Array.isArray(data) ? data : [data];

  return (
    <Helmet>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 0),
          }}
        />
      ))}
    </Helmet>
  );
};

export default JsonLD;
