import { SanctuaryView } from "@/components/modules/sanctuary/sanctuary-view";
import { PageTransition } from "@/components/shell/page-transition";

export default function SanctuaryPage() {
  return (
    <PageTransition>
      <SanctuaryView />
    </PageTransition>
  );
}
