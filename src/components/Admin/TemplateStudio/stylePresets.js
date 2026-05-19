export const STYLE_PRESETS = [
  {
    id: "editorial",
    label: "Editorial",
    description: "Airy reading layout with strong typography and soft neutrals.",
    styles: {
      backgroundColor: "#fffaf5",
      textColor: "#1f2937",
      accentColor: "#9a3412",
      paddingY: "72px",
      gap: "24px",
      radius: "28px",
      maxWidth: "1100px",
      headlineSize: "2.2rem",
      bodySize: "1rem",
    },
  },
  {
    id: "spotlight",
    label: "Spotlight",
    description: "Sharper hero treatment for CTAs and feature-led sections.",
    styles: {
      backgroundColor: "#ecfeff",
      textColor: "#082f49",
      accentColor: "#0f766e",
      paddingY: "88px",
      gap: "20px",
      radius: "32px",
      maxWidth: "1200px",
      headlineSize: "2.4rem",
      bodySize: "1.05rem",
    },
  },
  {
    id: "contrast",
    label: "Contrast",
    description: "Bold dark presentation closer to premium marketing sections.",
    styles: {
      backgroundColor: "#0f172a",
      textColor: "#f8fafc",
      accentColor: "#f59e0b",
      paddingY: "80px",
      gap: "18px",
      radius: "30px",
      maxWidth: "1160px",
      headlineSize: "2.3rem",
      bodySize: "1rem",
    },
  },
];

export function findStylePreset(presetId) {
  return STYLE_PRESETS.find((preset) => preset.id === presetId) || null;
}
