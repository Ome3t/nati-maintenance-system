"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";

/* Sonner can't see next-themes on its own, so we sync them here.
   This restores the dark toast styling from the design guidelines. */
function ThemedToaster() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      theme={resolvedTheme === "light" ? "light" : "dark"}
      richColors
      position="bottom-right"
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <ThemedToaster />
      </ThemeProvider>
    </SessionProvider>
  );
}