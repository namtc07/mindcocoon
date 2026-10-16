import { SettingsView } from "@/components/modules/settings/settings-view";
import { PageTransition } from "@/components/shell/page-transition";

export default function SettingsPage() {
  return (
    <PageTransition>
      <SettingsView />
    </PageTransition>
  );
}
