import localFont from "next/font/local";

export const fontSans = localFont({
  src: [
    {
      path: "./Inter-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./Inter-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  fallback: ["system-ui", "arial"],
});

// Urbanist 替换为本地 Cal Sans（几何无衬线，风格接近）
export const fontUrban = localFont({
  src: "./CalSans-SemiBold.woff2",
  variable: "--font-urban",
  fallback: ["system-ui", "arial"],
});

export const fontHeading = localFont({
  src: "./CalSans-SemiBold.woff2",
  variable: "--font-heading",
  fallback: ["system-ui", "arial"],
});

export const fontGeist = localFont({
  src: "./GeistVF.woff2",
  variable: "--font-geist",
  fallback: ["system-ui", "arial"],
});
