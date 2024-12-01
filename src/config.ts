export const configuration = {
  port: parseInt(process.env.PORT!, 10) || 4000,
  databaseURL:
    process.env.NODE_ENV === "development"
      ? process.env.MONGO_DEV_URL!
      : process.env.MONGO_PROD_URL!,
  firebaseAppConfig: {
    type: process.env.FIREBASE_TYPE!,
    project_id: process.env.FIREBASE_PROJECT_ID!,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID!,
    private_key: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/gm, "\n")!,
    client_email: process.env.FIREBASE_CLIENT_EMAIL!,
    client_id: process.env.FIREBASE_CLIENT_ID!,
    auth_uri: process.env.FIREBASE_AUTH_URI!,
    token_uri: process.env.FIREBASE_TOKEN_URI!,
    auth_provider_x509_cert_url:
      process.env.FIREBASE_AUTH_PROVIDER_x509_CERT_URL!,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL!,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN!,
  },
  geminiApiKey: process.env.GEMINI_API_KEY!,
};
