/** @type {import("tailwindcss").Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#080B0F",
        panel: "#11161D",
        gold: "#F0C85A",
        muted: "#8B949E"
      },
      boxShadow: {
        gold: "0 0 0 1px rgba(240,200,90,.24), 0 18px 70px rgba(0,0,0,.35)"
      }
    }
  },
  plugins: []
};
