// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/eslint", "@nuxt/ui"],

  devtools: {
    enabled: true,
  },
  ssr: false,
  css: ["@livekit/components-styles", "~/assets/css/main.css"],

  routeRules: {
    "/": { prerender: true },
  },
  
  devServer: {
    host: "0.0.0.0", // للوصول من الشبكة المحلية
    port: 3000,
  },
  runtimeConfig: {
    public: {
      livekitUrl:
        process.env.LIVEKIT_URL || "wwss://test-project-s1z07f4y.livekit.cloud",
    },
    livekitApiKey: process.env.LIVEKIT_API_KEY,
    livekitApiSecret: process.env.LIVEKIT_API_SECRET,
  },

  compatibilityDate: "2025-01-15",

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },
});
