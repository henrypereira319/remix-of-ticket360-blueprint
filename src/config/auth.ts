const googleOAuthClientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID ?? "";

export const googleOAuthConfig = {
  enabled: import.meta.env.VITE_GOOGLE_OAUTH_ENABLED === "true",
  clientId: googleOAuthClientId,
};

export const googleOAuthIsReady = googleOAuthConfig.enabled && Boolean(googleOAuthConfig.clientId);

export const googleOAuthEnvSlots = [
  "VITE_GOOGLE_OAUTH_ENABLED",
  "VITE_GOOGLE_OAUTH_CLIENT_ID",
];
