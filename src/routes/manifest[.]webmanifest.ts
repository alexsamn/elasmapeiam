import { createFileRoute } from "@tanstack/react-router";
import { APP_BACKGROUND_COLOR, APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME, APP_THEME_COLOR } from "@/config/app";

/** Manifest do PWA gerado a partir das constantes de src/config/app.ts. */
export const Route = createFileRoute("/manifest.webmanifest")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          JSON.stringify({
            name: APP_NAME,
            short_name: APP_SHORT_NAME,
            description: APP_DESCRIPTION,
            lang: "pt-BR",
            start_url: "/",
            scope: "/",
            display: "standalone",
            background_color: APP_BACKGROUND_COLOR,
            theme_color: APP_THEME_COLOR,
            icons: [
              { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
              { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
              { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
            ],
          }),
          { headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600" } },
        ),
    },
  },
});
