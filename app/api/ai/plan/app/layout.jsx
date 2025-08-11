export const metadata = {
  title: "Globtrek — AI Planner",
  description: "Plan trips with AI itineraries and rough costs."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
