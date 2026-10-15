import type { Config } from "tailwindcss";

// =============================================================================
// Design tokens — "instrument panel" logistik.
// Palet & tipografi dipilih spesifik untuk subject matter (rantai pasok +
// emisi karbon), BUKAN default SaaS (biru-ungu/gradient) atau preset generik.
// =============================================================================
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Latar — "kertas dingin", bukan putih murni atau cream hangat
        bg: "#F6F7F6",
        surface: "#FFFFFF",
        "surface-sunken": "#EEF1EF",

        // Tinta utama — navy chart-navigasi, dipakai sidebar & teks berat
        ink: {
          DEFAULT: "#13233B",
          muted: "#5B6B75",
          faint: "#8D9AA3",
        },

        // Garis pembatas tipis (instrument panel, bukan shadow)
        hairline: "#DDE3E0",

        // Teal — warna data/brand utama: garis rute, grafik primer, link aktif
        teal: {
          DEFAULT: "#0F7A72",
          soft: "#E3F1EE",
          strong: "#0B5C56",
        },

        // Amber karbon — skala intensitas emisi (bukan warna "warning" generik)
        carbon: {
          DEFAULT: "#C65D3B",
          soft: "#FBEAE2",
          strong: "#9C4529",
        },

        // Hijau — status baik / emisi rendah / tepat waktu
        positive: {
          DEFAULT: "#2F9E64",
          soft: "#E7F5ED",
        },

        // Merah — alert / keterlambatan / kegagalan
        critical: {
          DEFAULT: "#B3261E",
          soft: "#FCEAE9",
        },
      },
      fontFamily: {
        // Display: karakter presisi-teknis untuk judul & metrik besar
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        // Body/UI: sangat legible pada densitas data tinggi
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        // Data: ID pengiriman, koordinat, berat, CO2e — angka tabular sungguhan
        mono: ["var(--font-ibm-plex-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "metric-lg": ["2.75rem", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
        "metric-md": ["1.75rem", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },
      boxShadow: {
        // Elevasi HANYA untuk layer mengambang (popover, modal, dropdown) —
        // bukan dekorasi default di setiap kartu.
        popover: "0 8px 24px -4px rgba(19, 35, 59, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
