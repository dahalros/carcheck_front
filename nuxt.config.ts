// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: [
    "~/assets/css/fonts.css",
    "@fortawesome/fontawesome-svg-core/styles.css",
    // "~/assets/css/admin.css",
  ],

  modules: [
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
    "@nuxtjs/tailwindcss",
  ],

  plugins: ["~/plugins/fontawesome.js", "~/plugins/eventBus.js"],

  vite: {
    optimizeDeps: {
      include: ["swiper/vue", "swiper/modules", "chart.js", "date-fns"],
    },

    build: {
      rolldownOptions: {
        checks: { pluginTimings: false },
      },
    },
  },

  runtimeConfig: {
    // Server-only. The browser talks to /api/service/* and never learns the Laravel
    // origin, so this must not move into `public`.
    backendBase:
      process.env.BASE_URL ||
      {
        prod: process.env.VITE_PROD_BASE_URL || "https://car-check.io/api",
        dev: process.env.VITE_TEST_BASE_URL || "https://dev-back.car-check.info/api",
        local: process.env.VITE_LOCAL_BASE_URL || "http://localhost/api",
      }[process.env.VITE_APP_ENV || process.env.APP_ENV || "local"] ||
      "http://localhost/api",

    // Off by default: only enable where a proxy we control (nginx, Cloudflare) sits in
    // front of Nitro and overwrites X-Forwarded-For. On means clients can spoof it.
    trustProxyHeaders: process.env.TRUST_PROXY_HEADERS === "true",

    public: {
      stripe_public_key: process.env.STRIPE_PUBLIC_KEY,
      isDev: ["dev", "develop", "local"].includes(
        process.env.VITE_APP_ENV || process.env.APP_ENV || "local",
      ),
    },
  },

  routeRules: {
    "/report": { ssr: false },
  },

  compatibilityDate: "2024-09-05",
});
