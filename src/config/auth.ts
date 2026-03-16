const googleOAuthClientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID ?? "";
const googleOAuthRedirectUri = import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI ?? "";

export const googleOAuthConfig = {
  enabled: import.meta.env.VITE_GOOGLE_OAUTH_ENABLED === "true",
  clientId: googleOAuthClientId,
  redirectUri: googleOAuthRedirectUri,
  scopes: ["openid", "email", "profile"],
};

export const googleOAuthIsReady =
  googleOAuthConfig.enabled && Boolean(googleOAuthConfig.clientId) && Boolean(googleOAuthConfig.redirectUri);

export const googleOAuthEnvSlots = [
  "VITE_GOOGLE_OAUTH_ENABLED",
  "VITE_GOOGLE_OAUTH_CLIENT_ID",
  "VITE_GOOGLE_OAUTH_REDIRECT_URI",
];
