import { defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import getProduct from "./tools/get-product";
import listCategories from "./tools/list-categories";
import dbSelect from "./tools/db-select";
import dbInsert from "./tools/db-insert";
import dbUpdate from "./tools/db-update";
import dbDelete from "./tools/db-delete";
import dbRpc from "./tools/db-rpc";
import storageUploadFromUrl from "./tools/storage-upload-from-url";
import schemaDescribe from "./tools/schema-describe";

export default defineMcp({
  name: "poshplex-mcp",
  title: "POSHPLEX MCP (Full Access)",
  version: "0.2.0",
  instructions: `Full read/write access to the POSHPLEX site (Lovable Cloud / Supabase).

Reads (no api_key needed): list_products, get_product, list_categories, db_select, schema_describe.
Writes (require api_key = MCP_ADMIN_KEY): db_insert, db_update, db_delete, db_rpc, storage_upload_from_url.

Discover the schema with schema_describe before mutating unfamiliar tables. Use db_select to read anything (products, orders, customers, inventory, transactions, promotions, etc). Use db_insert/update/delete for CRUD. Use db_rpc to call business logic functions like create_order_atomic, record_order_payment_atomic, upsert_checkout_customer. Use storage_upload_from_url to import images (bucket 'product-images' for products).

Currency is Bangladeshi Taka (৳). Products use UUIDs. Prices are numeric.`,
  tools: [
    listProducts,
    getProduct,
    listCategories,
    dbSelect,
    dbInsert,
    dbUpdate,
    dbDelete,
    dbRpc,
    storageUploadFromUrl,
    schemaDescribe,
  ],
});
