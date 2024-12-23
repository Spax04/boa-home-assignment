import dotenv from "dotenv";
import { shopifyApp } from "@shopify/shopify-app-express";
import { LATEST_API_VERSION, LogSeverity } from "@shopify/shopify-api";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-10";
import { MySQLSessionStorage } from "@shopify/shopify-app-session-storage-mysql";
import { verifyAppProxySignature } from "./middleware/auth.js";

dotenv.config();

export default shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    logger: {
      level: LogSeverity.Error,
    },
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage: new MySQLSessionStorage(process.env.DATABASE_URL || ""),
  scopes: [
    'read_products',
    'write_products',
    'read_customers',
    'write_customers'
  ],
  appProxy: {
    path: "/api/app_proxy", 
  },
});
