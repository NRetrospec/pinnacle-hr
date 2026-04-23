/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as documents from "../documents.js";
import type * as employees from "../employees.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_clerk from "../lib/clerk.js";
import type * as lib_geofence from "../lib/geofence.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_validation from "../lib/validation.js";
import type * as locations from "../locations.js";
import type * as maintenance from "../maintenance.js";
import type * as timeEntries from "../timeEntries.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  documents: typeof documents;
  employees: typeof employees;
  "lib/auth": typeof lib_auth;
  "lib/clerk": typeof lib_clerk;
  "lib/geofence": typeof lib_geofence;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/validation": typeof lib_validation;
  locations: typeof locations;
  maintenance: typeof maintenance;
  timeEntries: typeof timeEntries;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
