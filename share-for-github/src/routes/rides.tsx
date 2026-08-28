import { createFileRoute, Outlet } from "@tanstack/react-router";

/** Parent layout so /rides is a real path (index + /rides/$id, /post, /quote…). */
export const Route = createFileRoute("/rides")({
  component: RidesLayout,
});

function RidesLayout() {
  return <Outlet />;
}
