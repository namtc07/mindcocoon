import { VaultView } from "@/components/modules/vault/vault-view";
import { PageTransition } from "@/components/shell/page-transition";

export default function VaultPage() {
  return (
    <PageTransition>
      <VaultView />
    </PageTransition>
  );
}
