import { TodayView } from "@/components/modules/today/today-view";
import { PageTransition } from "@/components/shell/page-transition";

export default function TodayPage() {
  return (
    <PageTransition>
      <TodayView />
    </PageTransition>
  );
}
