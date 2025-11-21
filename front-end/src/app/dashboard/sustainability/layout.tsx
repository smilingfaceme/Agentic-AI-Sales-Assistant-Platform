import SustainabilityPage from '@/components/Dashboard/Sustainability/SustainabilityPage';

export default function SustainabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SustainabilityPage>{children}</SustainabilityPage>
  );
}

