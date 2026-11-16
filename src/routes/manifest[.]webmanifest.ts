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
            icons: [{ src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" }],
          }),
          { headers: { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600" } },
        ),
    },
  },
});
