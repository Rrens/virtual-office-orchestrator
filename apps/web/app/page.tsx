'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkspaceLayout } from './components/workspace/WorkspaceLayout';
import { CreateProjectForm } from './components/CreateProjectForm';
import { AgentInspectorModal } from './components/AgentInspectorModal';
import { ArtifactViewerModal } from './components/ArtifactViewerModal';
import { CustomerFeedbackModal } from './components/CustomerFeedbackModal';
import { LogViewerModal } from './components/workspace/LogViewerModal';
import { GraphifyModal } from './components/GraphifyModal';
import { SplashScreen } from './components/SplashScreen';
import { useProjectWebSocket } from '../hooks/useProjectWebSocket';
import { apiFetch } from '../lib/api';

interface Project {
  id: string;
  name: string;
  goal: string;
  status: string;
  autonomyLevel: number;
  usedTokens: number;
  workflowExecutions: Array<{ id: string; status: string; startedAt?: string | null; tasks: Task[] }>;
}

interface Task {
  id: string;
  title: string;
  description: string;
  agentRole: string;
  assignedAgentId: string | null;
  status: string;
  outputArtifacts: string[];
}

interface Approval {
  id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  agentInstance: { definition: { name: string; role: string } };
  task?: { title: string };
}

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showProjectList, setShowProjectList] = useState(false);
  const [starting, setStarting] = useState(false);
  const [inspectedAgentId, setInspectedAgentId] = useState<string | null>(null);
  const [artifactView, setArtifactView] = useState<{ taskId: string; taskTitle: string } | null>(null);
  const [showLogViewer, setShowLogViewer] = useState(false);
  const [showGraphify, setShowGraphify] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  async function handleExport() {
    if (!selectedProjectId) return;
    setExporting(true);
    try {
      const res = await fetch(`http://localhost:4000/api/projects/${selectedProjectId}/export`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const filesWritten = res.headers.get('X-Files-Written') ?? '?';
      const disposition = res.headers.get('Content-Disposition') ?? '';
      const nameMatch = disposition.match(/filename="(.+?)"/);
      const fileName = nameMatch ? nameMatch[1] : `${selectedProjectId}.zip`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`✅ Download dimulai!\nFile: ${fileName}\nTotal: ${filesWritten} file`);
    } catch (err) {
      alert(`Export gagal: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExporting(false);
    }
  }

  const { events, connected } = useProjectWebSocket(selectedProjectId);

  const loadProjects = useCallback(async () => {
    try {
      const data = await apiFetch<Project[]>('/api/projects');
      setProjects(data);
    } catch (err) {
      console.warn('Could not load projects (server may still be starting):', err);
    }
  }, []);

  const loadProject = useCallback(async (id: string) => {
    try {
      const data = await apiFetch<Project>(`/api/projects/${id}`);
      setProject(data);
    } catch (err) {
      console.warn('Could not load project:', err);
    }
  }, []);

  const loadApprovals = useCallback(async (id: string) => {
    try {
      const data = await apiFetch<Approval[]>(`/api/approvals?projectId=${id}`);
      setApprovals(data);
    } catch (err) {
      console.warn('Could not load approvals:', err);
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // URL query parameter support (?projectId=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('projectId');
    if (pid) {
      setSelectedProjectId(pid);
    }
  }, []);

  // Sync on project switch, incoming websocket event, or window focus
  useEffect(() => {
    if (!selectedProjectId) return;
    loadProject(selectedProjectId);
    loadApprovals(selectedProjectId);

    const onFocus = () => {
      loadProject(selectedProjectId);
      loadApprovals(selectedProjectId);
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [selectedProjectId, events, loadProject, loadApprovals]);

  async function handleStart() {
    if (!selectedProjectId) return;
    setStarting(true);
    try {
      await apiFetch(`/api/projects/${selectedProjectId}/start`, { method: 'POST' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start');
    } finally {
      setStarting(false);
    }
  }

  async function handlePause() {
    if (!selectedProjectId) return;
    try {
      await apiFetch(`/api/projects/${selectedProjectId}/pause`, { method: 'POST' });
      await loadProject(selectedProjectId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to pause');
    }
  }

  async function handleResume() {
    if (!selectedProjectId) return;
    try {
      await apiFetch(`/api/projects/${selectedProjectId}/resume`, { method: 'POST' });
      await loadProject(selectedProjectId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resume');
    }
  }

  async function handleCancel() {
    if (!selectedProjectId || !confirm('Batalkan workflow proyek ini?')) return;
    try {
      await apiFetch(`/api/projects/${selectedProjectId}/cancel`, { method: 'POST' });
      await loadProject(selectedProjectId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel');
    }
  }

  const tasks = project?.workflowExecutions?.[0]?.tasks ?? [];
  const approvalList = approvals.map((a) => ({
    id: a.id,
    title: a.title,
    status: a.status,
    description: a.description,
  }));

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Project List Popover */}
      {showProjectList && (
        <div
          style={{
            position: 'fixed', top: 56, left: 16, zIndex: 200,
            background: 'var(--panel-solid)', border: '1px solid var(--line-strong)',
            borderRadius: 12, padding: 8, minWidth: 240,
            boxShadow: 'var(--shadow-lg)', backdropFilter: 'blur(16px)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', padding: '4px 8px', textTransform: 'uppercase' }}>
            Daftar Proyek
          </div>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedProjectId(p.id); setShowNewProject(false); setShowProjectList(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 10px', borderRadius: 8, border: 'none',
                background: selectedProjectId === p.id ? 'rgba(129, 140, 248, 0.15)' : 'transparent',
                cursor: 'pointer', fontSize: 12, color: selectedProjectId === p.id ? '#818cf8' : 'var(--text)',
                fontWeight: selectedProjectId === p.id ? 700 : 400,
              }}
            >
              {p.name}
            </button>
          ))}
          <div style={{ borderTop: '1px solid var(--line)', margin: '4px 0' }} />
          <button
            onClick={() => { setShowNewProject(true); setShowProjectList(false); }}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '7px 10px', borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer',
              fontSize: 12, color: 'var(--pingot)', fontWeight: 700,
            }}
          >
            + Proyek Baru
          </button>
        </div>
      )}

      {/* New Project Form Overlay */}
      {showNewProject && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 150,
          background: 'rgba(43,42,40,0.45)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--panel-solid)', border: '1px solid var(--line)',
            borderRadius: 16, padding: 24, width: '100%', maxWidth: 480,
            boxShadow: 'var(--shadow-lg)',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              Proyek Baru
            </h3>
            <CreateProjectForm
              onCreated={(id) => {
                loadProjects();
                setSelectedProjectId(id);
                setShowNewProject(false);
              }}
            />
            <button
              onClick={() => setShowNewProject(false)}
              style={{
                marginTop: 10, width: '100%', padding: '8px',
                borderRadius: 8, border: '1px solid var(--line)',
                background: 'transparent', cursor: 'pointer',
                fontSize: 12, color: 'var(--muted)',
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      <WorkspaceLayout
        project={project}
        tasks={tasks}
        approvals={approvalList}
        events={events}
        connected={connected}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onCancel={handleCancel}
        starting={starting}
        onSelectAgent={setInspectedAgentId}
        onOpenGraphify={() => setShowGraphify(true)}
        onOpenProjectList={() => setShowProjectList((v) => !v)}
        onOpenFeedback={() => setShowFeedbackModal(true)}
        onOpenLogs={() => setShowLogViewer(true)}
        onExport={handleExport}
        exporting={exporting}
        onOpenArtifact={(taskId, taskTitle) => setArtifactView({ taskId, taskTitle })}
      >
        <div style={{ textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>
          Pilih atau buat proyek untuk memulai.
        </div>
      </WorkspaceLayout>

      <AgentInspectorModal agentId={inspectedAgentId} onClose={() => setInspectedAgentId(null)} />

      <ArtifactViewerModal
        taskId={artifactView?.taskId ?? null}
        taskTitle={artifactView?.taskTitle}
        onClose={() => setArtifactView(null)}
      />

      <LogViewerModal isOpen={showLogViewer} onClose={() => setShowLogViewer(false)} />

      {showGraphify && selectedProjectId && (
        <GraphifyModal
          projectId={selectedProjectId}
          onClose={() => setShowGraphify(false)}
        />
      )}

      {showFeedbackModal && selectedProjectId && (
        <CustomerFeedbackModal
          projectId={selectedProjectId}
          onClose={() => setShowFeedbackModal(false)}
          onSubmitted={() => loadProject(selectedProjectId)}
        />
      )}
    </>
  );
}
