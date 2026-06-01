import { Button } from "@/components/ui/button";

export function SupabaseEnvMissingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <img
        src="/pwa-icons/icon-192x192.png"
        alt="Contabiliza"
        width={80}
        height={80}
        className="mb-6 rounded-2xl shadow-sm"
      />
      <h1 className="text-xl font-semibold text-foreground mb-2">
        Configuração incompleta
      </h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Defina <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> e{" "}
        <code className="text-xs bg-muted px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> no
        ambiente (por exemplo no Vercel ou em <code className="text-xs">.env.local</code>) e
        recarregue a página.
      </p>
      <Button type="button" onClick={() => window.location.reload()}>
        Tentar novamente
      </Button>
    </div>
  );
}
