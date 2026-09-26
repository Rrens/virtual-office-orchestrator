'use client';

import Link from 'next/link';
import {
  useEffect,
  useState,
} from 'react';
import { apiFetch } from '../../lib/api';

interface Artifact {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  sizeBytes: number;
  content: string | null;
  path: string;
  createdAt: string;
  agentInstance: { definition: { name: string; role: string } } | null;
}

interface Props {
  taskId: string | null;
  taskTitle?: string;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ArtifactViewerModal({ taskId, taskTitle, onClose }: Props) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Artifact | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!taskId) {
      setArtifacts([]);
      setSelected(null);
      return;
    }
    setLoading(true);
    apiFetch<Artifact[]>(`/api/tasks/${taskId}/artifacts`)
      .then((data) => {
        setArtifacts(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .finally(() => setLoading(false));
  }, [taskId]);

  if (!taskId) return null;

  async function handleCopy() {
    if (!selected?.content) return;
    await navigator.clipboard.writeText(selected.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!selected?.content) return;
    const blob = new Blob([selected.content], { type: selected.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selected.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
		<div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
			<div className='w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]'>
				{/* Header */}
				<div className='flex items-center justify-between p-5 border-b border-slate-800 flex-shrink-0'>
					<div>
						<h2 className='text-white font-bold text-base'>
							Artifacts
						</h2>
						{taskTitle && (
							<p className='text-slate-400 text-xs mt-0.5 truncate'>
								{taskTitle}
							</p>
						)}
					</div>
					<button
						onClick={onClose}
						className='text-slate-400 hover:text-white transition-colors text-lg leading-none'
					>
						✕
					</button>
				</div>

				{loading ? (
					<div className='flex-1 flex items-center justify-center text-slate-500 text-sm p-8'>
						Loading artifacts...
					</div>
				) : artifacts.length === 0 ? (
					<div className='flex-1 flex items-center justify-center text-slate-500 text-sm p-8'>
						No artifacts generated yet.
					</div>
				) : (
					<div className='flex flex-1 overflow-hidden'>
						{/* Sidebar — artifact list */}
						<div className='w-56 flex-shrink-0 border-r border-slate-800 overflow-y-auto p-3 space-y-1'>
							{artifacts.map((a) => (
								<button
									key={a.id}
									onClick={() =>
										setSelected(a)
									}
									className={`w-full text-left px-2.5 py-2.5 rounded-lg transition-colors text-xs ${
										selected?.id ===
										a.id
											? 'bg-indigo-600/20 border border-indigo-500/50 text-white'
											: 'border border-transparent hover:bg-slate-800 text-slate-300'
									}`}
								>
									<p className='font-medium truncate'>
										{a.name}
									</p>
									<p className='text-slate-500 mt-0.5'>
										{formatBytes(
											a.sizeBytes,
										)}
									</p>
									{a.agentInstance && (
										<p className='text-slate-500 truncate mt-0.5'>
											{
												a.agentInstance
													.definition
													.name
											}
										</p>
									)}
								</button>
							))}
						</div>

						{/* Content area */}
						{selected && (
							<div className='flex-1 flex flex-col overflow-hidden'>
								{/* Content toolbar */}
								<div className='flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50 flex-shrink-0'>
									<div className='flex items-center gap-2'>
										<span className='text-xs text-slate-400 font-mono'>
											{selected.path}
										</span>
										<span className='text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400'>
											{
												selected.mimeType
											}
										</span>
									</div>
									<div className='flex items-center gap-2'>
										<Link
											href={`/code?file=${selected.id}`}
											target="_blank"
											rel="noopener noreferrer"
											className='text-xs px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors flex items-center gap-1 no-underline'
											title='Buka file ini di Code Editor'
										>
											<span>💻</span>
											<span>
												Buka di Code
												Editor
											</span>
										</Link>
										<button
											onClick={
												handleCopy
											}
											className='text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors'
										>
											{copied
												? '✓ Copied'
												: 'Copy'}
										</button>
										<button
											onClick={
												handleDownload
											}
											className='text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors'
										>
											Download
										</button>
									</div>
								</div>

								{/* Content */}
								<div className='flex-1 overflow-auto p-4'>
									{selected.content ? (
										<pre className='text-xs text-slate-200 font-mono whitespace-pre-wrap break-words leading-relaxed'>
											{selected.content}
										</pre>
									) : (
										<p className='text-slate-500 text-sm'>
											Content not
											available.
										</p>
									)}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
