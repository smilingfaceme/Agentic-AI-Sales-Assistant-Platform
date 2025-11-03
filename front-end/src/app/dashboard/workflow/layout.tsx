import WorkflowPage from '@/components/Dashboard/Workflow/WorkflowPage';

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkflowPage>{children}</WorkflowPage>
  );
}

