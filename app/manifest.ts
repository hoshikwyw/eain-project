import type { MetadataRoute } from "next";

/** Lets phones add Eain to the home screen with the right name, icon and colours. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eain",
    short_name: "Eain",
    description: "Digital gifts that feel like home.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fff8f4",
    theme_color: "#db3358",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
