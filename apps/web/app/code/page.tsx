'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
	useEffect,
	useMemo,
	useState,
} from 'react';
import { apiFetch } from '../../lib/api';

// Dynamic import Monaco Editor to avoid SSR window issues in Next.js App Router
const Editor = dynamic(
	() =>
		import('@monaco-editor/react').then(
			(mod) => mod.default,
		),
	{
		ssr: false,
		loading: () => (
			<div className='flex-1 flex items-center justify-center bg-[#1e1e1e] text-slate-400 text-xs font-mono'>
				<div className='flex items-center gap-2'>
					<div className='w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin' />
					<span>Memuat Editor...</span>
				</div>
			</div>
		),
	},
);

interface Project {
	id: string;
	name: string;
	goal: string;
	status: string;
}

interface Artifact {
	id: string;
	name: string;
	path: string;
	type: string;
	mimeType: string;
	sizeBytes: number;
	content: string | null;
	createdAt: string;
	task?: {
		id: string;
		title: string;
		agentRole: string;
	} | null;
	agentInstance?: {
		id: string;
		definition: {
			name: string;
			role: string;
			department?: {
				name: string;
			};
			persona?: string;
		};
	} | null;
}

function getLanguageFromFilename(
	filename: string,
): string {
	const ext =
		filename
			.split('.')
			.pop()
			?.toLowerCase() || '';
	const langMap: Record<
		string,
		string
	> = {
		ts: 'typescript',
		tsx: 'typescript',
		js: 'javascript',
		jsx: 'javascript',
		json: 'json',
		py: 'python',
		sql: 'sql',
		html: 'html',
		css: 'css',
		md: 'markdown',
		markdown: 'markdown',
		sh: 'shell',
		bash: 'shell',
		dockerfile: 'dockerfile',
		yaml: 'yaml',
		yml: 'yaml',
		rs: 'rust',
		go: 'go',
	};
	return langMap[ext] || 'plaintext';
}

function getFileIcon(
	filename: string,
): string {
	const ext =
		filename
			.split('.')
			.pop()
			?.toLowerCase() || '';
	if (['ts', 'tsx'].includes(ext))
		return '🔷';
	if (['js', 'jsx'].includes(ext))
		return '🟨';
	if (ext === 'json') return '🟧';
	if (ext === 'py') return '🐍';
	if (ext === 'sql') return '🗄️';
	if (ext === 'md') return '📝';
	if (['html', 'css'].includes(ext))
		return '🌐';
	if (['sh', 'bash'].includes(ext))
		return '🐚';
	if (ext === 'dockerfile') return '🐳';
	return '📄';
}

function handleEditorWillMount(monaco: any) {
  monaco.editor.defineTheme('vscode-dark-plus', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'C586C0' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'regexp', foreground: 'D16969' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'class', foreground: '4EC9B0' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'identifier', foreground: '9CDCFE' },
      { token: 'delimiter', foreground: 'D4D4D4' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#c6c6c6',
      'editorIndentGuide.background': '#404040',
      'editorIndentGuide.activeBackground': '#707070',
      'editor.selectionBackground': '#264f78',
      'editor.lineHighlightBackground': '#282828',
      'editorGutter.background': '#1e1e1e',
      'editorGutter.modifiedLinesBackground': '#007acc',
      'editorGutter.addedLinesBackground': '#587c0c',
      'editorGutter.deletedLinesBackground': '#94151b',
    },
  });
}

export default function CodeStudioPage() {
	const [projects, setProjects] =
		useState<Project[]>([]);
	const [
		selectedProjectId,
		setSelectedProjectId,
	] = useState<string>('');
	const [artifacts, setArtifacts] =
		useState<Artifact[]>([]);
	const [loading, setLoading] =
		useState(true);
	const [
		selectedFileId,
		setSelectedFileId,
	] = useState<string | null>(null);
	const [openTabs, setOpenTabs] =
		useState<string[]>([]);
	const [
		searchFilter,
		setSearchFilter,
	] = useState('');
	const [
		showInspector,
		setShowInspector,
	] = useState(true);
	const [
		fileContentState,
		setFileContentState,
	] = useState<Record<string, string>>(
		{},
	);
	const [savingFile, setSavingFile] =
		useState(false);
	const [toastMsg, setToastMsg] =
		useState<string | null>(null);

	// New file creation modal
	const [
		showNewFileModal,
		setShowNewFileModal,
	] = useState(false);
	const [newFilePath, setNewFilePath] =
		useState('');
	const [
		newFileContent,
		setNewFileContent,
	] = useState('');

	const showToast = (msg: string) => {
		setToastMsg(msg);
		setTimeout(
			() => setToastMsg(null),
			3000,
		);
	};

	// Load Projects
	useEffect(() => {
		apiFetch<Project[]>('/api/projects')
			.then((data) => {
				setProjects(data);
				if (data.length > 0) {
					const urlParams =
						new URLSearchParams(
							window.location.search,
						);
					const paramProj =
						urlParams.get('projectId');
					if (
						paramProj &&
						data.some(
							(p) => p.id === paramProj,
						)
					) {
						setSelectedProjectId(
							paramProj,
						);
					} else {
						setSelectedProjectId(
							data[0].id,
						);
					}
				}
			})
			.catch(console.error);
	}, []);

	// Load artifacts when project changes
	useEffect(() => {
		if (!selectedProjectId) {
			setLoading(false);
			return;
		}

		setLoading(true);
		apiFetch<Artifact[]>(
			`/api/projects/${selectedProjectId}/artifacts`,
		)
			.then((data) => {
				setArtifacts(data);
				// Initialize file content state
				const contentMap: Record<
					string,
					string
				> = {};
				data.forEach((a) => {
					contentMap[a.id] =
						a.content || '';
				});
				setFileContentState(contentMap);

				// Check if query param specified a file
				const urlParams =
					new URLSearchParams(
						window.location.search,
					);
				const fileParam =
					urlParams.get('file');
				const targetFile = fileParam
					? data.find(
							(a) =>
								a.id === fileParam ||
								a.name === fileParam,
						)
					: null;

				if (targetFile) {
					setSelectedFileId(
						targetFile.id,
					);
					setOpenTabs([targetFile.id]);
				} else if (data.length > 0) {
					setSelectedFileId(data[0].id);
					setOpenTabs([data[0].id]);
				} else {
					setSelectedFileId(null);
					setOpenTabs([]);
				}
			})
			.catch(console.error)
			.finally(() => setLoading(false));
	}, [selectedProjectId]);

	const activeFile = useMemo(() => {
		return (
			artifacts.find(
				(a) => a.id === selectedFileId,
			) || null
		);
	}, [artifacts, selectedFileId]);

	const openFile = (id: string) => {
		setSelectedFileId(id);
		if (!openTabs.includes(id)) {
			setOpenTabs((prev) => [
				...prev,
				id,
			]);
		}
	};

	const closeTab = (
		id: string,
		e?: React.MouseEvent,
	) => {
		e?.stopPropagation();
		const nextTabs = openTabs.filter(
			(tabId) => tabId !== id,
		);
		setOpenTabs(nextTabs);
		if (selectedFileId === id) {
			setSelectedFileId(
				nextTabs.length > 0
					? nextTabs[
							nextTabs.length - 1
						]
					: null,
			);
		}
	};

	const handleEditorChange = (
		value: string | undefined,
	) => {
		if (
			!selectedFileId ||
			value === undefined
		)
			return;
		setFileContentState((prev) => ({
			...prev,
			[selectedFileId]: value,
		}));
	};

	const handleSaveCurrentFile =
		async () => {
			if (
				!selectedFileId ||
				!activeFile
			)
				return;
			const currentContent =
				fileContentState[
					selectedFileId
				] ??
				activeFile.content ??
				'';

			setSavingFile(true);
			try {
				await apiFetch(
					`/api/artifacts/${selectedFileId}`,
					{
						method: 'PATCH',
						body: JSON.stringify({
							content: currentContent,
						}),
					},
				);
				// Update artifacts array
				setArtifacts((prev) =>
					prev.map((a) =>
						a.id === selectedFileId
							? {
									...a,
									content:
										currentContent,
								}
							: a,
					),
				);
				showToast(
					`File "${activeFile.name}" berhasil disimpan!`,
				);
			} catch (err) {
				alert(
					`Gagal menyimpan file: ${err instanceof Error ? err.message : String(err)}`,
				);
			} finally {
				setSavingFile(false);
			}
		};

	const handleCreateNewFile = async (
		e: React.FormEvent,
	) => {
		e.preventDefault();
		if (
			!selectedProjectId ||
			!newFilePath.trim()
		)
			return;

		const path = newFilePath.trim();
		const name =
			path.split('/').pop() || path;

		try {
			const created =
				await apiFetch<Artifact>(
					`/api/projects/${selectedProjectId}/artifacts`,
					{
						method: 'POST',
						body: JSON.stringify({
							name,
							path,
							content: newFileContent,
							type: 'code',
						}),
					},
				);

			setArtifacts((prev) => [
				created,
				...prev,
			]);
			setFileContentState((prev) => ({
				...prev,
				[created.id]: newFileContent,
			}));
			setSelectedFileId(created.id);
			setOpenTabs((prev) => [
				...prev,
				created.id,
			]);
			setShowNewFileModal(false);
			setNewFilePath('');
			setNewFileContent('');
			showToast(
				`File baru "${name}" berhasil dibuat!`,
			);
		} catch (err) {
			alert(
				`Gagal membuat file: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	};

	const handleCopyCode = async () => {
		if (!selectedFileId) return;
		const content =
			fileContentState[
				selectedFileId
			] ??
			activeFile?.content ??
			'';
		await navigator.clipboard.writeText(
			content,
		);
		showToast(
			'Kode berhasil disalin ke clipboard!',
		);
	};

	const handleDownloadFile = () => {
		if (!activeFile || !selectedFileId)
			return;
		const content =
			fileContentState[
				selectedFileId
			] ??
			activeFile.content ??
			'';
		const blob = new Blob([content], {
			type:
				activeFile.mimeType ||
				'text/plain',
		});
		const url =
			URL.createObjectURL(blob);
		const a =
			document.createElement('a');
		a.href = url;
		a.download = activeFile.name;
		a.click();
		URL.revokeObjectURL(url);
	};

	// Group files by directory
	const filteredArtifacts =
		artifacts.filter((a) => {
			const q =
				searchFilter.toLowerCase();
			return (
				a.name
					.toLowerCase()
					.includes(q) ||
				a.path
					.toLowerCase()
					.includes(q) ||
				(
					a.agentInstance?.definition
						.name ?? ''
				)
					.toLowerCase()
					.includes(q)
			);
		});

	return (
		<div className='h-screen w-screen bg-[#181818] text-slate-200 flex flex-col font-sans select-text overflow-hidden'>
			{/* Toast */}
			{toastMsg && (
				<div className='fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-indigo-400 font-semibold text-xs flex items-center gap-2 animate-bounce'>
					<span>✓</span>
					<span>{toastMsg}</span>
				</div>
			)}

      {/* Top Code Editor Titlebar */}
      <header className='h-10 bg-[#1f1f1f] border-b border-[#2d2d2d] px-3 flex items-center justify-between select-none z-30'>
        <div className='flex items-center gap-3'>
          <Link
            href={selectedProjectId ? `/?projectId=${selectedProjectId}` : '/'}
            className='px-2.5 py-1 rounded bg-[#2a2a2a] hover:bg-[#333333] text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5'
          >
            <span>←</span>
            <span>Virtual Office</span>
          </Link>

					<div className='flex items-center gap-2 text-xs'>
						<span className='font-bold text-indigo-400 flex items-center gap-1.5'>
							<span>💻</span> Code
							Studio
						</span>
						<span className='text-slate-600'>
							/
						</span>

						{/* Project Selector */}
						<select
							value={selectedProjectId}
							onChange={(e) =>
								setSelectedProjectId(
									e.target.value,
								)
							}
							className='bg-[#2d2d2d] text-white border border-[#3d3d3d] rounded px-2 py-0.5 text-xs outline-none focus:border-indigo-500 cursor-pointer'
						>
							{projects.map((p) => (
								<option
									key={p.id}
									value={p.id}
								>
									{p.name} ({p.status})
								</option>
							))}
						</select>
					</div>

					{activeFile && (
						<div className='hidden md:flex items-center gap-1.5 text-xs text-slate-400'>
							<span className='text-slate-600'>
								›
							</span>
							<span className='font-mono text-slate-300'>
								{activeFile.path ||
									activeFile.name}
							</span>
						</div>
					)}
				</div>

				{/* Right Actions */}
				<div className='flex items-center gap-2'>
					{activeFile && (
						<>
							<button
								onClick={
									handleSaveCurrentFile
								}
								disabled={savingFile}
								className='px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer'
								title='Simpan perubahan ke database'
							>
								<span>💾</span>
								<span>
									{savingFile
										? 'Menyimpan...'
										: 'Simpan File'}
								</span>
							</button>

							<button
								onClick={handleCopyCode}
								className='p-1 px-2 rounded bg-[#2a2a2a] hover:bg-[#333333] text-slate-300 text-xs font-medium transition-colors cursor-pointer'
								title='Salin isi file'
							>
								📋 Copy
							</button>

							<button
								onClick={
									handleDownloadFile
								}
								className='p-1 px-2 rounded bg-[#2a2a2a] hover:bg-[#333333] text-slate-300 text-xs font-medium transition-colors cursor-pointer'
								title='Unduh file ke komputer'
							>
								📁 Download
							</button>
						</>
					)}

					<button
						onClick={() =>
							setShowInspector(
								!showInspector,
							)
						}
						className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
							showInspector
								? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
								: 'bg-[#2a2a2a] text-slate-400 hover:text-white'
						}`}
					>
						<span>🔍</span>
						<span>Detail Code</span>
					</button>

					<Link
						href='/kanban'
						className='px-2.5 py-1 rounded bg-[#2a2a2a] hover:bg-[#333333] text-indigo-300 text-xs font-semibold transition-colors flex items-center gap-1'
					>
						<span>📊</span>
						<span>Kanban</span>
					</Link>

					<Link
						href='/agents'
						className='px-2.5 py-1 rounded bg-[#2a2a2a] hover:bg-[#333333] text-indigo-300 text-xs font-semibold transition-colors flex items-center gap-1'
					>
						<span>🤖</span>
						<span>Agents</span>
					</Link>
				</div>
			</header>

			{/* Main Studio Body */}
			<div className='flex-1 flex overflow-hidden'>
				{/* Left Sidebar: File Tree Explorer */}
				<aside className='w-64 bg-[#1e1e1e] border-r border-[#2d2d2d] flex flex-col flex-shrink-0 select-none'>
					{/* Explorer Header */}
					<div className='p-2.5 border-b border-[#2d2d2d] flex items-center justify-between'>
						<span className='text-[11px] font-bold text-slate-300 tracking-wider uppercase flex items-center gap-1.5'>
							<span>📁</span> EXPLORER /
							CODEBASE
						</span>
						<button
							onClick={() =>
								setShowNewFileModal(
									true,
								)
							}
							className='px-1.5 py-0.5 rounded bg-[#2d2d2d] hover:bg-indigo-600 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer'
							title='Buat file baru'
						>
							+ File
						</button>
					</div>

					{/* Search Filter */}
					<div className='p-2 border-b border-[#2d2d2d]'>
						<input
							type='text'
							placeholder='Cari file atau path...'
							value={searchFilter}
							onChange={(e) =>
								setSearchFilter(
									e.target.value,
								)
							}
							className='w-full bg-[#181818] border border-[#2d2d2d] rounded px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500'
						/>
					</div>

					{/* File List */}
					<div className='flex-1 overflow-y-auto p-1 space-y-0.5'>
						{loading ? (
							<div className='p-4 text-center text-slate-500 text-xs animate-pulse'>
								Memuat daftar file...
							</div>
						) : filteredArtifacts.length ===
						  0 ? (
							<div className='p-4 text-center text-slate-500 text-xs'>
								{artifacts.length === 0
									? 'Belum ada file/kode yang digenerate oleh agent.'
									: 'Tidak ada file yang cocok dengan pencarian.'}
							</div>
						) : (
							filteredArtifacts.map(
								(file) => {
									const isSelected =
										selectedFileId ===
										file.id;
									const icon =
										getFileIcon(
											file.name,
										);

									return (
										<button
											key={file.id}
											onClick={() =>
												openFile(
													file.id,
												)
											}
											className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between group text-xs transition-colors cursor-pointer ${
												isSelected
													? 'bg-[#37373d] text-white font-semibold'
													: 'text-slate-400 hover:bg-[#2a2d2e] hover:text-slate-200'
											}`}
										>
											<div className='flex items-center gap-2 min-w-0 truncate'>
												<span>
													{icon}
												</span>
												<span className='truncate'>
													{file.path ||
														file.name}
												</span>
											</div>

											{file.agentInstance && (
												<span className='text-[9px] font-mono px-1 py-0.5 rounded bg-[#252526] text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity'>
													{
														file.agentInstance.definition.name.split(
															' ',
														)[0]
													}
												</span>
											)}
										</button>
									);
								},
							)
						)}
					</div>

					{/* Sidebar Footer Stats */}
					<div className='p-2 border-t border-[#2d2d2d] text-[10px] text-slate-500 flex justify-between'>
						<span>
							{artifacts.length} file
							terdaftar
						</span>
						<span>UTF-8</span>
					</div>
				</aside>

				{/* Center: Editor Area */}
				<div className='flex-1 flex flex-col min-w-0 bg-[#1e1e1e]'>
					{/* Tabs Bar */}
					<div className='h-9 bg-[#252526] border-b border-[#181818] flex items-center overflow-x-auto select-none flex-shrink-0'>
						{openTabs.map((tabId) => {
							const file =
								artifacts.find(
									(a) => a.id === tabId,
								);
							if (!file) return null;
							const isSelected =
								selectedFileId ===
								tabId;
							const icon = getFileIcon(
								file.name,
							);

							return (
								<div
									key={tabId}
									onClick={() =>
										setSelectedFileId(
											tabId,
										)
									}
									className={`h-full px-3 flex items-center gap-2 border-r border-[#181818] text-xs cursor-pointer transition-colors ${
										isSelected
											? 'bg-[#1e1e1e] text-white font-semibold border-t-2 border-t-indigo-500'
											: 'bg-[#2d2d2d] text-slate-400 hover:bg-[#323233] hover:text-slate-200'
									}`}
								>
									<span>{icon}</span>
									<span className='truncate max-w-[140px]'>
										{file.name}
									</span>
									<button
										onClick={(e) =>
											closeTab(tabId, e)
										}
										className='ml-1 text-slate-500 hover:text-white text-[10px] p-0.5 rounded hover:bg-[#3d3d3d]'
									>
										✕
									</button>
								</div>
							);
						})}
					</div>

					{/* Monaco Editor Container */}
					<div className='flex-1 relative overflow-hidden flex'>
						{activeFile ? (
							<Editor
								height='100%'
								language={getLanguageFromFilename(
									activeFile.name,
								)}
								value={
									fileContentState[
										activeFile.id
									] ??
									activeFile.content ??
									''
								}
								onChange={
									handleEditorChange
								}
								theme='vscode-dark-plus'
								beforeMount={handleEditorWillMount}
								options={{
									fontSize: 13,
									fontFamily:
										'Fira Code, Menlo, Monaco, Consolas, monospace',
									minimap: {
										enabled: true,
									},
									scrollBeyondLastLine: false,
									wordWrap: 'on',
									automaticLayout: true,
									tabSize: 2,
									lineNumbers: 'on',
									renderWhitespace:
										'selection',
								}}
							/>
						) : (
							<div className='flex-1 flex flex-col items-center justify-center text-slate-500 space-y-3 p-8 text-center'>
								<div className='w-16 h-16 rounded-2xl bg-[#252526] border border-[#2d2d2d] flex items-center justify-center text-3xl'>
									💻
								</div>
								<h3 className='text-slate-300 font-bold text-sm'>
									Tidak ada file yang
									dipilih
								</h3>
								<p className='text-xs text-slate-500 max-w-sm'>
									Pilih file dari panel
									Explorer di sebelah
									kiri untuk melihat dan
									mengedit kode yang
									dihasilkan oleh tim
									agent.
								</p>
							</div>
						)}
					</div>

					{/* Status Bar */}
					<footer className='h-6 bg-[#007acc] text-white px-3 flex items-center justify-between text-[11px] font-mono select-none flex-shrink-0'>
						<div className='flex items-center gap-4'>
							<span>
								🟢 Code Studio Active
							</span>
							{activeFile && (
								<span>
									Lang:{' '}
									{getLanguageFromFilename(
										activeFile.name,
									).toUpperCase()}
								</span>
							)}
						</div>

						<div className='flex items-center gap-4'>
							{activeFile && (
								<span>
									Size:{' '}
									{(
										activeFile.sizeBytes /
										1024
									).toFixed(1)}{' '}
									KB
								</span>
							)}
							<span>UTF-8</span>
							<span>
								Virtual Office IDE
							</span>
						</div>
					</footer>
				</div>

				{/* Right Sidebar: Code Detail & AI Insight Inspector */}
				{showInspector &&
					activeFile && (
						<aside className='w-80 bg-[#1e1e1e] border-l border-[#2d2d2d] flex flex-col overflow-y-auto p-4 space-y-4 select-text flex-shrink-0'>
							<div className='flex items-center justify-between border-b border-[#2d2d2d] pb-2.5'>
								<h3 className='font-bold text-xs text-slate-200 flex items-center gap-1.5 uppercase tracking-wider'>
									<span>🔍</span> Detail
									Code & AI Author
								</h3>
								<button
									onClick={() =>
										setShowInspector(
											false,
										)
									}
									className='text-slate-400 hover:text-white text-xs'
								>
									✕
								</button>
							</div>

							{/* Author Agent Info */}
							<div className='p-3 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-2'>
								<p className='text-[10px] text-slate-400 uppercase font-semibold'>
									Penulis / Creator
									Agent
								</p>
								<div className='flex items-center gap-2.5'>
									<div className='w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-lg'>
										🤖
									</div>
									<div>
										<h4 className='font-bold text-white text-xs'>
											{activeFile
												.agentInstance
												?.definition
												.name ||
												'System / Lead Agent'}
										</h4>
										<p className='text-[11px] text-indigo-400 font-mono'>
											{activeFile
												.agentInstance
												?.definition
												.role ||
												'orchestrator'}
										</p>
									</div>
								</div>

								{activeFile
									.agentInstance
									?.definition
									.department && (
									<span className='text-[10px] px-2 py-0.5 rounded bg-[#1f1f1f] text-slate-300 font-semibold inline-block'>
										🏛️ Dept:{' '}
										{
											activeFile
												.agentInstance
												.definition
												.department.name
										}
									</span>
								)}
							</div>

							{/* Task Info */}
							{activeFile.task && (
								<div className='p-3 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-1.5'>
									<p className='text-[10px] text-slate-400 uppercase font-semibold'>
										Konteks Tugas / Task
									</p>
									<p className='text-xs text-white font-medium'>
										{
											activeFile.task
												.title
										}
									</p>
									<p className='text-[10px] font-mono text-slate-500'>
										task #
										{activeFile.task.id.slice(
											0,
											8,
										)}
									</p>
								</div>
							)}

							{/* File Metadata */}
							<div className='p-3 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-2 text-xs'>
								<p className='text-[10px] text-slate-400 uppercase font-semibold'>
									Spesifikasi File
								</p>
								<div className='space-y-1 text-slate-300 text-[11px]'>
									<div className='flex justify-between'>
										<span className='text-slate-500'>
											Nama File:
										</span>
										<span className='font-mono text-white'>
											{activeFile.name}
										</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-slate-500'>
											Virtual Path:
										</span>
										<span className='font-mono text-indigo-300 truncate max-w-[150px]'>
											{activeFile.path}
										</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-slate-500'>
											Ukuran:
										</span>
										<span>
											{
												activeFile.sizeBytes
											}{' '}
											bytes (
											{(
												activeFile.sizeBytes /
												1024
											).toFixed(1)}{' '}
											KB)
										</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-slate-500'>
											Dibuat:
										</span>
										<span>
											{new Date(
												activeFile.createdAt,
											).toLocaleString()}
										</span>
									</div>
								</div>
							</div>

							{/* Persona Guidance */}
							{activeFile.agentInstance
								?.definition
								.persona && (
								<div className='p-3 rounded-xl bg-[#252526] border border-[#2d2d2d] space-y-1'>
									<p className='text-[10px] text-slate-400 uppercase font-semibold'>
										Persona Developer
									</p>
									<p className='text-[11px] text-slate-300 leading-relaxed line-clamp-4'>
										{
											activeFile
												.agentInstance
												.definition
												.persona
										}
									</p>
								</div>
							)}
						</aside>
					)}
			</div>

			{/* Modal: Buat File Baru */}
			{showNewFileModal && (
				<div
					className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4'
					onClick={() =>
						setShowNewFileModal(false)
					}
				>
					<div
						className='bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl'
						onClick={(e) =>
							e.stopPropagation()
						}
					>
						<div className='flex items-center justify-between border-b border-[#2d2d2d] pb-2.5'>
							<h3 className='text-sm font-bold text-white flex items-center gap-2'>
								<span>📄</span> Buat
								File Baru di Codebase
							</h3>
							<button
								onClick={() =>
									setShowNewFileModal(
										false,
									)
								}
								className='text-slate-400 hover:text-white text-base'
							>
								×
							</button>
						</div>

						<form
							onSubmit={
								handleCreateNewFile
							}
							className='space-y-3'
						>
							<div>
								<label className='text-xs text-slate-300 font-semibold block mb-1'>
									Path File (misal:
									src/services/auth.ts):
								</label>
								<input
									type='text'
									placeholder='src/components/Button.tsx'
									value={newFilePath}
									onChange={(e) =>
										setNewFilePath(
											e.target.value,
										)
									}
									className='w-full bg-[#181818] border border-[#3d3d3d] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-mono'
									required
								/>
							</div>

							<div>
								<label className='text-xs text-slate-300 font-semibold block mb-1'>
									Konten Awal
									(Opsional):
								</label>
								<textarea
									rows={4}
									placeholder='// Tulis kode atau dokumentasi awal di sini...'
									value={newFileContent}
									onChange={(e) =>
										setNewFileContent(
											e.target.value,
										)
									}
									className='w-full bg-[#181818] border border-[#3d3d3d] rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 font-mono'
								/>
							</div>

							<div className='flex gap-2 pt-2 border-t border-[#2d2d2d]'>
								<button
									type='submit'
									className='flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer'
								>
									Buat File
								</button>
								<button
									type='button'
									onClick={() =>
										setShowNewFileModal(
											false,
										)
									}
									className='py-1.5 px-3 bg-[#2a2a2a] hover:bg-[#333333] text-slate-300 rounded-lg text-xs font-semibold cursor-pointer'
								>
									Batal
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
