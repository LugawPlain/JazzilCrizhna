import localFont from "next/font/local";

export const bulgariaDreams = localFont({
  src: "../../../public/fonts/bulgaria_dreams/Bulgaria Dreams Regular.ttf",
  display: "swap",
  variable: "--font-bulgaria-dreams",
  weight: "400", // Assuming 'Regular' maps to weight 400
  style: "normal",
});
