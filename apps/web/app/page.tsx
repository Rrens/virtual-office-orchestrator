'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkspaceLayout } from './components/workspace/WorkspaceLayout';
import { CreateProjectForm } from './components/CreateProjectForm';
import { AgentInspectorModal } from './components/AgentInspectorModal';
import { ArtifactViewerModal } from './components/ArtifactViewerModal';
import { CustomerFeedbackModal } from './components/CustomerFeedbackModal';
import { LogViewerModal } from './components/workspace/LogViewerModal';
import { GraphifyModal } from './components/GraphifyModal';
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
    const data = await apiFetch<Project[]>('/api/projects');
    setProjects(data);
  }, []);

  const loadProject = useCallback(async (id: string) => {
    const data = await apiFetch<Project>(`/api/projects/${id}`);
    setProject(data);
  }, []);

  const loadApprovals = useCallback(async (id: string) => {
    const data = await apiFetch<Approval[]>(`/api/approvals?projectId=${id}`);
    setApprovals(data);
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  useEffect(() => {
    if (!selectedProjectId) return;
    loadProject(selectedProjectId);
    loadApprovals(selectedProjectId);
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
      {/* Project switcher floating button */}
      <div style={{
        position: 'fixed', top: 12, left: 12, zIndex: 100,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <button
          onClick={() => setShowProjectList((v) => !v)}
          style={{
            padding: '5px 12px', borderRadius: 99,
            border: '1px solid var(--line-strong)',
            background: 'var(--panel)', backdropFilter: 'blur(8px)',
            color: 'var(--text)', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', boxShadow: 'var(--shadow)',
          }}
        >
          {project ? project.name : 'Pilih Proyek'}
        </button>
        <button
          onClick={() => setShowFeedbackModal(true)}
          style={{
            padding: '5px 12px', borderRadius: 99,
            border: '1px solid var(--line)',
            background: 'var(--panel)', backdropFilter: 'blur(8px)',
            color: 'var(--muted)', fontSize: 11, cursor: 'pointer',
          }}
        >
          Feedback
        </button>
        <button
          onClick={() => setShowLogViewer(true)}
          style={{
            padding: '5px 12px', borderRadius: 99,
            border: '1px solid var(--line)',
            background: 'var(--panel)', backdropFilter: 'blur(8px)',
            color: 'var(--muted)', fontSize: 11, cursor: 'pointer',
          }}
        >
          📜 Logs
        </button>
        {selectedProjectId && (
          <button
            onClick={() => setShowGraphify(true)}
            style={{
              padding: '5px 12px', borderRadius: 99,
              border: '1px solid #c7d2fe',
              background: '#eff6ff',
              color: '#3b82f6', fontSize: 11,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            📊 Graphify
          </button>
        )}
        {selectedProjectId && (
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              padding: '5px 12px', borderRadius: 99,
              border: '1px solid var(--line)',
              background: 'var(--panel)', backdropFilter: 'blur(8px)',
              color: exporting ? 'var(--faint)' : 'var(--ok)', fontSize: 11,
              cursor: exporting ? 'default' : 'pointer',
              fontWeight: 700,
            }}
          >
            {exporting ? 'Exporting...' : '📁 Export'}
          </button>
        )}
      </div>

      {/* Project List Popover */}
      {showProjectList && (
        <div
          style={{
            position: 'fixed', top: 48, left: 12, zIndex: 200,
            background: 'var(--panel-solid)', border: '1px solid var(--line)',
            borderRadius: 12, padding: 8, minWidth: 220,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedProjectId(p.id); setShowNewProject(false); setShowProjectList(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 10px', borderRadius: 8, border: 'none',
                background: selectedProjectId === p.id ? 'var(--line)' : 'transparent',
                cursor: 'pointer', fontSize: 12, color: 'var(--text)',
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
