import GoLivePage from "@/components/Dashboard/GolivePage";

interface GoLivePageProps {
  sidebarHidden?: boolean;
  onSidebarToggle?: () => void;
}


export default function DashboardGoLive({ sidebarHidden, onSidebarToggle }: GoLivePageProps) {
  return <GoLivePage sidebarHidden={sidebarHidden} onSidebarToggle={onSidebarToggle}/>;
}

