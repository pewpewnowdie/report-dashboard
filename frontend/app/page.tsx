import { DashboardLayout } from "@/components/dashboard-layout";
import { mockProjects } from "@/lib/mock-data";

export default function Home() {
  return <DashboardLayout projects={mockProjects} />;
}
