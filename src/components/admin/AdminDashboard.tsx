import { useState } from 'react';
import { ProjectsUpload } from './ProjectsUpload';
import { ConsultantsUpload } from './ConsultantsUpload';
import { ProjectsList } from './ProjectsList';
import { ConsultantsList } from './ConsultantsList';
import { CreateProjectForm } from './CreateProjectForm';
import { CreateConsultantForm } from './CreateConsultantForm';
import { AssignConsultantForm } from './AssignConsultantForm';
import { AssignmentsManager } from './AssignmentsManager';
import { SupportTicketsPanel } from '../support/SupportTicketsPanel';
import { ReportsDashboard } from '../reports/ReportsDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { ReimbursementApprovalDashboard } from './ReimbursementApprovalDashboard';
import { LogOut, Upload, List, Settings, FileText, MessageSquare, PlusCircle, UserPlus, Plane, DollarSign } from 'lucide-react';

type Tab = 'upload-projects' | 'upload-consultants' | 'create-project' | 'create-consultant' | 'assign-consultant' | 'assignments' | 'projects' | 'consultants' | 'support' | 'reports' | 'reimbursements';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('assignments');
  const { signOut } = useAuth();

  const tabs = [
    { id: 'assignments' as Tab, label: 'Assignments', icon: Plane },
    { id: 'reimbursements' as Tab, label: 'Reimbursements', icon: DollarSign },
    { id: 'projects' as Tab, label: 'Projects', icon: List },
    { id: 'consultants' as Tab, label: 'Consultants', icon: List },
    { id: 'create-project' as Tab, label: 'Create Project', icon: PlusCircle },
    { id: 'create-consultant' as Tab, label: 'Create Consultant', icon: PlusCircle },
    { id: 'assign-consultant' as Tab, label: 'Assign to Project', icon: UserPlus },
    { id: 'upload-projects' as Tab, label: 'Upload Projects', icon: Upload },
    { id: 'upload-consultants' as Tab, label: 'Upload Consultants', icon: Upload },
    { id: 'support' as Tab, label: 'Support', icon: MessageSquare },
    { id: 'reports' as Tab, label: 'Reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg font-bold text-slate-900">Admin Console</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {activeTab === 'assignments' && <AssignmentsManager />}
          {activeTab === 'reimbursements' && <ReimbursementApprovalDashboard />}
          {activeTab === 'projects' && <ProjectsList />}
          {activeTab === 'consultants' && <ConsultantsList />}
          {activeTab === 'create-project' && <CreateProjectForm />}
          {activeTab === 'create-consultant' && <CreateConsultantForm />}
          {activeTab === 'assign-consultant' && <AssignConsultantForm />}
          {activeTab === 'upload-projects' && <ProjectsUpload />}
          {activeTab === 'upload-consultants' && <ConsultantsUpload />}
          {activeTab === 'support' && <SupportTicketsPanel />}
          {activeTab === 'reports' && <ReportsDashboard />}
        </div>
      </main>
    </div>
  );
}
