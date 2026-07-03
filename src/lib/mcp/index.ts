import { defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import getProduct from "./tools/get-product";
import listCategories from "./tools/list-categories";

export default defineMcp({
  name: "poshplex-mcp",
  title: "POSHPLEX MCP",
  version: "0.1.0",
  instructions:
    "Read-only access to the POSHPLEX product catalog. Use `list_categories` to discover categories, `list_products` to browse (optionally filtering by category slug), and `get_product` to fetch full details for a single product by UUID.",
  tools: [listProducts, getProduct, listCategories],
});
