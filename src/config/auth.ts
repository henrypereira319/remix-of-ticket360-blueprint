const googleOAuthClientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID?.trim() ?? "";
const googleOAuthEnabledFlag = import.meta.env.VITE_GOOGLE_OAUTH_ENABLED?.trim().toLowerCase() ?? "";
const googleOAuthEnabledByConfig =
  googleOAuthEnabledFlag === "true" || (googleOAuthEnabledFlag !== "false" && Boolean(googleOAuthClientId));

export const googleOAuthConfig = {
  enabled: googleOAuthEnabledByConfig,
  clientId: googleOAuthClientId,
};

export const googleOAuthIsReady = googleOAuthConfig.enabled && Boolean(googleOAuthConfig.clientId);

export const googleOAuthEnvSlots = [
  "VITE_GOOGLE_OAUTH_ENABLED",
  "VITE_GOOGLE_OAUTH_CLIENT_ID",
];
