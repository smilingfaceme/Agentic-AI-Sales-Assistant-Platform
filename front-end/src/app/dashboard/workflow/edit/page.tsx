"use client";
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import WorkflowEditor from '@/components/Dashboard/Workflow/WorkflowEditor';

function WorkflowEditorWrapper() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflow_id');
  
  return <WorkflowEditor workflow_Id={workflowId} />;
}

export default function EditWorkflowPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <WorkflowEditorWrapper />
    </Suspense>
  );
}

