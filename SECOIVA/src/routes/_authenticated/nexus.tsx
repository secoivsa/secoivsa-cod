import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NexusSidebar } from "@/components/nexus/NexusSidebar";
import { NexusTopbar } from "@/components/nexus/NexusTopbar";
import { BrandingProvider } from "@/components/nexus/BrandingProvider";
import { ErrorBoundary } from "@/components/nexus/ErrorBoundary";
import { useAuth } from "@/hooks/use-auth";
import { useInactivityTimeout } from "@/lib/security/session-guard";

export const Route = createFileRoute("/_authenticated/nexus")({
  component: NexusShell,
});

function NexusShell() {
  const { profile, roles } = useAuth();
  useInactivityTimeout();
  return (
    <BrandingProvider>
      <div className="min-h-screen flex bg-[#05070a] text-foreground">
        <NexusSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <NexusTopbar profile={profile} roles={roles} />
          <main className="flex-1 overflow-y-auto">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </BrandingProvider>
  );
}
