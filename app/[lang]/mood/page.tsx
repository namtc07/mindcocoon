import { MoodView } from "@/components/modules/mood/mood-view";
import { PageTransition } from "@/components/shell/page-transition";

export default function MoodPage() {
  return (
    <PageTransition>
      <MoodView />
    </PageTransition>
  );
}
