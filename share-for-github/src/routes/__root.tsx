import { useEffect } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        title: "Share — Trusted Sharing",
      },
      {
        name: "description",
        content:
          "Trusted Sharing — rides, deliveries, cars, food, and neighborhood gear. Rooted in Lafayette, Louisiana.",
      },
      { name: "theme-color", content: "#1f6b45" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  // Prevent browser from navigating away when a photo is dropped outside a field
  useEffect(() => {
    const block = (e: DragEvent) => {
      if (!e.dataTransfer?.types?.includes("Files")) return;
      e.preventDefault();
    };
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            className: "font-[var(--font-sans)]",
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
