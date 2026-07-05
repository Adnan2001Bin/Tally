export const usersTag = "Users";
export const bearerAuthSecurity = [{ bearerAuth: [] }] as const;

export const usersOperationIds = {
  getMe: "getMe",
  updateMe: "updateMe",
} as const;

export const schemaRef = {
  updateProfileBody: "UpdateProfileBody",
  userDetail: "UserDetail",
  apiError: "ApiError",
} as const;

export const updateProfileBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    monthly_budget: {
      type: ["number", "null"],
      exclusiveMinimum: 0,
      maximum: 999_999_999_999.99,
    },
  },
} as const;

export const userPublicSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string" },
    phone: { type: ["string", "null"] },
    username: { type: "string" },
    profile_image: { type: ["string", "null"] },
    currency: { type: "string" },
    language: { type: "string" },
    monthly_budget: { type: ["number", "null"] },
    email_verified: { type: "boolean" },
    created_at: { type: "string", format: "date-time" },
    updated_at: { type: "string", format: "date-time" },
  },
} as const;

export const userDetailSchema = {
  type: "object",
  properties: {
    user: userPublicSchema,
  },
} as const;
