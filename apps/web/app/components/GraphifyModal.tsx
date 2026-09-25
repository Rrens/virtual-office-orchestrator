'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  department?: string;
  agentRole?: string;
  agentName?: string;
  filePath?: string;
  properties: Record<string, any>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    routesCount: number;
    tablesCount: number;
    componentsCount: number;
    functionsCount: number;
    docsCount: number;
    tokenSavingsPercent: number;
  };
  clusters: Array<{ name: string; nodeCount: number }>;
}

interface HierarchyData {
  chiefOrchestrator: { role: string; name: string; title: string };
  projectGoal: string;
  departments: Array<{
    department: string;
    subOrchestrator: { role: string; name: string; title: string };
    directive: string;
    totalTasks: number;
    completedTasks: number;
    tasks: any[];
  }>;
}

const TYPE_COLORS: Record<string, string> = {
  project: '#3b82f6',
  milestone: '#8b5cf6',
  department: '#ec4899',
  agent: '#10b981',
  artifact: '#f59e0b',
  api_route: '#d97706',
  database_table: '#059669',
  component: '#0284c7',
  function: '#6366f1',
  doc: '#84cc16',
};

export function GraphifyModal({
  projectId,
  onClose,
}: {
  projectId: string;
  onClose: () => void;
}) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [hierarchy, setHierarchy] = useState<HierarchyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [activeTab, setActiveTab] = useState<'graph' | 'hierarchy'>('graph');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [gRes, hRes] = await Promise.all([
          apiFetch<GraphData>(`/api/projects/${projectId}/graph`),
          apiFetch<HierarchyData>(`/api/projects/${projectId}/hierarchy`),
        ]);
        setGraphData(gRes);
        setHierarchy(hRes);
      } catch (err) {
        console.error('Failed to load Graphify data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  const filteredNodes = (graphData?.nodes || []).filter((node) => {
    const matchesSearch =
      !searchQuery ||
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (node.agentRole && node.agentRole.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'all') return true;
    if (filterType === 'leads') return ['project', 'milestone', 'department', 'agent'].includes(node.type);
    if (filterType === 'api') return node.type === 'api_route';
    if (filterType === 'db') return node.type === 'database_table' || node.type === 'database_column';
    if (filterType === 'ui') return node.type === 'component';
    if (filterType === 'files') return node.type === 'artifact' || node.type === 'doc';
    return true;
  });

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredEdges = (graphData?.edges || []).filter(
    (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '92vw',
          maxWidth: 1200,
          height: '88vh',
          backgroundColor: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f9fafb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              📊
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
                  Graphify Knowledge Graph & Sub-Orchestrator Explorer
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 99,
                    background: '#dbeafe',
                    color: '#1e40af',
                  }}
                >
                  ⚡ Context Savings: ~71.5%
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280' }}>
                Interaktiv Knowledge Graph & Struktur Hierarki Chief + Sub-Orchestrator per tim.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* View switcher */}
            <div style={{ display: 'flex', background: '#e5e7eb', borderRadius: 8, padding: 3 }}>
              <button
                onClick={() => setActiveTab('graph')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'graph' ? '#fff' : 'transparent',
                  color: activeTab === 'graph' ? '#111827' : '#6b7280',
                  boxShadow: activeTab === 'graph' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Knowledge Graph
              </button>
              <button
                onClick={() => setActiveTab('hierarchy')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: activeTab === 'hierarchy' ? '#fff' : 'transparent',
                  color: activeTab === 'hierarchy' ? '#111827' : '#6b7280',
                  boxShadow: activeTab === 'hierarchy' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                Hierarki Tim (Sub-Orchestrator)
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1px solid #d1d5db',
                background: '#fff',
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4b5563',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
            Memuat Knowledge Graph & Hierarki Tim...
          </div>
        ) : activeTab === 'graph' ? (
          /* Knowledge Graph View */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Toolbar */}
            <div
              style={{
                padding: '12px 24px',
                borderBottom: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                background: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: `Semua (${graphData?.stats.totalNodes ?? 0})` },
                  { key: 'leads', label: 'Lead & Milestones' },
                  { key: 'api', label: `API Routes (${graphData?.stats.routesCount ?? 0})` },
                  { key: 'db', label: `DB Tables (${graphData?.stats.tablesCount ?? 0})` },
                  { key: 'ui', label: `UI Components (${graphData?.stats.componentsCount ?? 0})` },
                  { key: 'files', label: `Files (${graphData?.stats.docsCount ?? 0})` },
                ].map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => setFilterType(chip.key)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 99,
                      border: '1px solid',
                      borderColor: filterType === chip.key ? '#3b82f6' : '#e5e7eb',
                      background: filterType === chip.key ? '#eff6ff' : '#fff',
                      color: filterType === chip.key ? '#1d4ed8' : '#4b5563',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Cari node, endpoint, component, agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 12,
                  width: 260,
                }}
              />
            </div>

            {/* Main Graph + Inspector Body */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              {/* SVG Visual Canvas */}
              <div
                style={{
                  flex: 1,
                  position: 'relative',
                  background: '#f8fafc',
                  overflow: 'auto',
                  padding: 24,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 16,
                  alignContent: 'flex-start',
                }}
              >
                {filteredNodes.length === 0 ? (
                  <div style={{ margin: 'auto', color: '#94a3b8', fontSize: 13 }}>
                    Tidak ada node yang sesuai dengan filter/pencarian.
                  </div>
                ) : (
                  filteredNodes.map((node) => {
                    const isSelected = selectedNode?.id === node.id;
                    const color = TYPE_COLORS[node.type] || '#64748b';

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        style={{
                          minWidth: 160,
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: isSelected ? '#eff6ff' : '#ffffff',
                          border: `2px solid ${isSelected ? '#3b82f6' : '#e2e8f0'}`,
                          boxShadow: isSelected
                            ? '0 4px 12px rgba(59, 130, 246, 0.2)'
                            : '0 1px 3px rgba(0, 0, 0, 0.05)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: 4,
                              background: `${color}15`,
                              color: color,
                            }}
                          >
                            {node.type}
                          </span>
                          {node.department && (
                            <span style={{ fontSize: 9, color: '#64748b', fontWeight: 600 }}>
                              {node.department}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', wordBreak: 'break-word' }}>
                          {node.label}
                        </div>

                        {node.filePath && (
                          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, fontFamily: 'monospace' }}>
                            {node.filePath}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Node Inspector Sidebar */}
              {selectedNode && (
                <aside
                  style={{
                    width: 320,
                    borderLeft: '1px solid #e2e8f0',
                    background: '#ffffff',
                    padding: 20,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                      Node Inspector
                    </h3>
                    <button
                      onClick={() => setSelectedNode(null)}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      ✕
                    </button>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                      {selectedNode.type}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                      {selectedNode.label}
                    </div>
                  </div>

                  {selectedNode.filePath && (
                    <div>
                      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>File Path:</div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#2563eb', background: '#eff6ff', padding: '4px 8px', borderRadius: 4, marginTop: 4 }}>
                        {selectedNode.filePath}
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>Properties & Specs:</div>
                    <pre
                      style={{
                        margin: 0,
                        padding: 10,
                        background: '#f8fafc',
                        borderRadius: 8,
                        fontSize: 11,
                        fontFamily: 'monospace',
                        color: '#334155',
                        whiteSpace: 'pre-wrap',
                        overflowX: 'auto',
                      }}
                    >
                      {JSON.stringify(selectedNode.properties, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>Relevansi Graph:</div>
                    <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.4 }}>
                      Node ini tersambung ke Graphify query memory. Saat agent membutuhkan info seputar entity ini, Graphify menginjeksi sub-graph potongan ini tanpa perlu membaca seluruh kode base.
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </div>
        ) : (
          /* Hierarchical Lead View */
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f8fafc' }}>
            {/* CEO Banner */}
            <div
              style={{
                background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                borderRadius: 12,
                padding: 20,
                color: '#fff',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#818cf8' }}>
                  Chief Orchestrator (CEO)
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
                  {hierarchy?.chiefOrchestrator.name || 'Budi'} · Executive Orchestrator
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#c7d2fe' }}>
                  Goal Proyek: &quot;{hierarchy?.projectGoal}&quot;
                </p>
              </div>
              <div
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '8px 16px',
                  borderRadius: 8,
                  textAlign: 'right',
                }}
              >
                <div style={{ fontSize: 11, color: '#a5b4fc' }}>Total Divisi / Teams</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{hierarchy?.departments.length || 0} Divisi</div>
              </div>
            </div>

            {/* Department Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
              {hierarchy?.departments.map((dept) => (
                <div
                  key={dept.department}
                  style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    padding: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  {/* Lead Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: '#eff6ff',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 14,
                        }}
                      >
                        {dept.subOrchestrator.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                          {dept.subOrchestrator.name} · {dept.subOrchestrator.title}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', textTransform: 'capitalize' }}>
                          Sub-Orchestrator Tim {dept.department}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: dept.completedTasks === dept.totalTasks ? '#dcfce7' : '#fef3c7',
                        color: dept.completedTasks === dept.totalTasks ? '#166534' : '#92400e',
                      }}
                    >
                      {dept.completedTasks}/{dept.totalTasks} Selesai
                    </span>
                  </div>

                  {/* Directive */}
                  <div style={{ background: '#f8fafc', padding: 10, borderRadius: 8, fontSize: 12, color: '#334155', fontStyle: 'italic' }}>
                    &quot;{dept.directive}&quot;
                  </div>

                  {/* Tasks List */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                      Task Terdistribusi:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {dept.tasks.map((t: any) => (
                        <div
                          key={t.id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #f1f5f9',
                            background: '#fafafa',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: 12,
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{t.title}</div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>Assigned: {t.agentRole}</div>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 700, color: t.status === 'COMPLETED' || t.status === 'APPROVED' ? '#16a34a' : '#d97706' }}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
