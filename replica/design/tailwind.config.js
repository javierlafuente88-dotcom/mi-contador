/** Mapeo de tokens a Tailwind / Nativewind.
 *  Los componentes usan `bg-surface text-muted`, nunca un hex suelto.
 *  Fuente de verdad: replica/design/tokens.json
 */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#ffffff",
        surface: "#f1f3ef",
        border: "#d9ded6",
        "border-input": "#6b7468",
        text: "#0f2440",
        muted: "#4d5a66",
        accent: "#24557f",
        "on-accent": "#ffffff",
        danger: "#a8321e",
        success: "#2f6b4f",
        warning: "#7a5b12",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        serif: ["Source Serif 4", "Georgia", "serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px", fontWeight: "500" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        dish: ["18px", { lineHeight: "26px" }],
        total: ["34px", { lineHeight: "38px", fontWeight: "600" }],
        display: ["44px", { lineHeight: "48px", fontWeight: "600" }],
      },
      spacing: {
        1: "4px", 2: "8px", 3: "12px", 4: "16px",
        5: "24px", 6: "32px", 7: "48px", 8: "64px",
      },
      borderRadius: {
        input: "4px",
        card: "8px",
        sheet: "20px",
        chip: "999px",
      },
      boxShadow: {
        sheet: "0 -8px 32px rgba(15, 36, 64, .14)",
        pop: "0 8px 24px rgba(15, 36, 64, .16)",
      },
      transitionTimingFunction: {
        ease: "cubic-bezier(.2,.8,.2,1)",
      },
      maxWidth: {
        content: "560px",
      },
    },
  },
  plugins: [],
};
