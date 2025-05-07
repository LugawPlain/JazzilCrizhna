import localFont from "next/font/local";

export const montserrat = localFont({
  src: "../../../public/fonts/montserrat/Montserrat-VariableFont_wght.ttf",
  display: "swap",
  variable: "--font-montserrat",
  weight: "100 900",
  style: "normal",
});
