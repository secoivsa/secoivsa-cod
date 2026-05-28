import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Loads the current organization's branding (commercial name, colors, logo)
 * and applies it as CSS variables on document root so the entire NEXUS OS
 * shell reflects per-tenant identity (white-label).
 */
export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;

  const { data } = useQuery({
    queryKey: ["org-branding", orgId],
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id,name,commercial_name,logo_url,primary_color,accent_color,current_plan_code,subscription_status")
        .eq("id", orgId!)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    const root = document.documentElement;
    if (data.primary_color) root.style.setProperty("--brand-primary", data.primary_color);
    if (data.accent_color) root.style.setProperty("--brand-accent", data.accent_color);
    if (data.commercial_name || data.name) {
      document.title = `${data.commercial_name ?? data.name} · NEXUS OS`;
    }
  }, [data]);

  return <>{children}</>;
}

export function useOrgBranding() {
  const { profile } = useAuth();
  const orgId = profile?.organization_id;
  return useQuery({
    queryKey: ["org-branding", orgId],
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId!)
        .maybeSingle();
      return data;
    },
  });
}
