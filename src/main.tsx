import { createRoot } from "react-dom/client";
import "./index.css";
import { isSupabaseEnvConfigured } from "@/integrations/supabase/env";
import { SupabaseEnvMissingScreen } from "@/components/SupabaseEnvMissingScreen";

const THEME_KEY = "contabiliza-ui-theme";
const LEGACY_THEME_KEY = "metacash-ui-theme";
try {
  if (!localStorage.getItem(THEME_KEY) && localStorage.getItem(LEGACY_THEME_KEY)) {
    localStorage.setItem(THEME_KEY, localStorage.getItem(LEGACY_THEME_KEY)!);
  }
} catch {
  /* ignore private mode */
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML =
    '<p style="font-family:system-ui;padding:2rem">Elemento #root não encontrado.</p>';
} else if (!isSupabaseEnvConfigured()) {
  createRoot(rootEl).render(<SupabaseEnvMissingScreen />);
} else {
  void import("./bootstrap").then((m) => m.mountApp(rootEl));
}
