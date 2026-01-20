import React, { useRef, useState, useEffect } from "react";
import { Briefcase, X, Upload, XCircle, User } from "lucide-react";
import { log, logError } from "../../../../config/environment";
import CustomSelect from "../../../common/CustomSelect";

const EditProjectModal = ({
	project,
	onClose,
	onUpdate,
	projectManagers = [],
	assistantManagers = [],
	qaManagers = [],
	teams = [],
	formErrors = {},
	isSubmitting = false,
	handleProjectFilesChange,
	handleRemoveProjectFile,
}) => {
	const fileInputRef = useRef(null);
	const [dropdownOpen, setDropdownOpen] = useState({
		assistantManagers: false,
		qaManagers: false,
		teams: false,
	});
	const [editProject, setEditProject] = useState(null);
	const [projectFiles, setProjectFiles] = useState(null);

	// Initialize editProject from project prop
	// Wait for dropdown data to be available before setting editProject
	useEffect(() => {
		if (
			project &&
			Array.isArray(assistantManagers) && assistantManagers.length > 0 &&
			Array.isArray(qaManagers) && qaManagers.length > 0 &&
			Array.isArray(teams) && teams.length > 0
		) {
			log('[EditProjectModal] Initializing project:', project);
			
			// Helper to extract string IDs from any array of IDs or objects
			const extractIds = (arr, key = 'user_id') => {
				if (!arr) return [];
				if (Array.isArray(arr) && typeof arr[0] === 'object') {
					return arr.map(u => String(u[key] ?? u.id)).filter(Boolean);
				}
				return arr.map(id => String(id)).filter(Boolean);
			};

			// Defensive: force all dropdown options to string IDs (local variables)
			const normalizedAssistantManagers = Array.isArray(assistantManagers)
				? assistantManagers.map(item => ({
						id: String(item.user_id ?? item.team_id ?? item.id),
						label: item.user_name || item.label || item.team_name || item.name || String(item.user_id ?? item.team_id ?? item.id)
					}))
				: [];
			const normalizedQaManagers = Array.isArray(qaManagers)
				? qaManagers.map(item => ({
						id: String(item.user_id ?? item.team_id ?? item.id),
						label: item.user_name || item.label || item.team_name || item.name || String(item.user_id ?? item.team_id ?? item.id)
					}))
				: [];
			const normalizedTeams = Array.isArray(teams)
				? teams.map(item => ({
						id: String(item.user_id ?? item.team_id ?? item.id),
						label: item.user_name || item.label || item.team_name || item.name || String(item.user_id ?? item.team_id ?? item.id)
					}))
				: [];

			// Assistant Project Managers
			let assistantManagerIds = [];
			if (Array.isArray(project.assistantManagerIds) && project.assistantManagerIds.length > 0) {
				assistantManagerIds = extractIds(project.assistantManagerIds);
			} else if (Array.isArray(project.asst_project_managers) && project.asst_project_managers.length > 0) {
				assistantManagerIds = extractIds(project.asst_project_managers, 'user_id');
			} else if (Array.isArray(project.asst_project_manager_id) && project.asst_project_manager_id.length > 0) {
				assistantManagerIds = extractIds(project.asst_project_manager_id);
			}
			log('[EditProjectModal] Assistant Manager IDs:', assistantManagerIds);

			// QA Managers
			let qaManagerIds = [];
			if (Array.isArray(project.qaManagerIds) && project.qaManagerIds.length > 0) {
				qaManagerIds = extractIds(project.qaManagerIds);
			} else if (Array.isArray(project.qa_users) && project.qa_users.length > 0) {
				qaManagerIds = extractIds(project.qa_users, 'user_id');
			} else if (Array.isArray(project.project_qa_id) && project.project_qa_id.length > 0) {
				qaManagerIds = extractIds(project.project_qa_id);
			}
			log('[EditProjectModal] QA Manager IDs:', qaManagerIds);

			// Agents/Teams
			let teamIds = [];
			if (Array.isArray(project.teamIds) && project.teamIds.length > 0) {
				teamIds = extractIds(project.teamIds);
			} else if (Array.isArray(project.project_team) && project.project_team.length > 0) {
				teamIds = extractIds(project.project_team, 'user_id');
			} else if (Array.isArray(project.project_team_id) && project.project_team_id.length > 0) {
				teamIds = extractIds(project.project_team_id);
			}
			log('[EditProjectModal] Team IDs:', teamIds);

			const newProject = {
				...project,
				assistantManagerIds,
				qaManagerIds,
				teamIds,
				projectManagerId: String(project.projectManagerId || project.project_manager_id || ""),
				name: project.name || project.project_name || "",
				description: project.description || project.project_description || "",
			};
			
			setTimeout(() => {
				setEditProject(newProject);
				if (project.project_file) setProjectFiles({ name: project.project_file });
			}, 0);
		}
	}, [project, assistantManagers, qaManagers, teams]);

	const handleMultipleSelect = (field, userId, isChecked) => {
		if (!editProject) return;
		
		const currentValues = (editProject[field] || []).map(id => String(id));
		const normalizedUserId = String(userId);
		let updatedValues;
		
		if (isChecked) {
			if (!currentValues.includes(normalizedUserId)) {
				updatedValues = [...currentValues, normalizedUserId];
			} else {
				updatedValues = currentValues;
			}
		} else {
			updatedValues = currentValues.filter(id => id !== normalizedUserId);
		}
		
		setEditProject(prev => ({ ...prev, [field]: updatedValues }));
	};

	// Helper to normalize dropdown data for lookup by id
	const normalizeList = (items, idKey = 'user_id', labelKey = 'user_name') => {
		if (!Array.isArray(items)) return [];
		return items.map(item => {
			const id = String(item[idKey] ?? item.team_id ?? item.id);
			const label = item[labelKey] || item.label || item.user_name || item.team_name || item.name || id;
			return { id, label };
		});
	};

	const processedAssistantManagers = normalizeList(assistantManagers, 'user_id', 'user_name');
	const processedQaManagers = normalizeList(qaManagers, 'user_id', 'user_name');
	const processedTeams = normalizeList(teams, 'user_id', 'user_name');
	const processedProjectManagers = normalizeList(projectManagers, 'user_id', 'user_name');

	const toggleDropdown = (dropdown) => {
		setDropdownOpen(prev => ({
			assistantManagers: false,
			qaManagers: false,
			teams: false,
			[dropdown]: !prev[dropdown]
		}));
	};

	const handleFileChange = (e) => {
		const file = e.target.files?.[0];
		if (file) {
			log('[EditProjectModal] File selected:', file.name);
			setProjectFiles(file);
			handleProjectFilesChange && handleProjectFilesChange(file);
		}
		e.target.value = "";
	};

	const triggerFileInput = () => {
		fileInputRef.current.click();
	};

	const handleRemoveFile = () => {
		log('[EditProjectModal] Removing file');
		setProjectFiles(null);
		handleRemoveProjectFile && handleRemoveProjectFile();
	};

	if (!editProject) {
		return (
			<div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50">
				<div className="bg-white rounded-xl shadow-2xl p-8">Loading...</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
				<div className="p-4 bg-blue-800 text-white flex justify-between items-center shrink-0">
					<div>
						<h2 className="text-lg font-bold flex items-center gap-2">
							<Briefcase className="w-5 h-5 text-blue-300" />
							Edit Project
						</h2>
						<p className="text-blue-200 text-xs">Update project details as needed</p>
					</div>
					<button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
						<X className="w-5 h-5 text-white" />
					</button>
				</div>
				<div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{/* Project Name */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">Project Name <span className="text-red-600">*</span></label>
							<input
								type="text"
								className="block w-full px-3 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="e.g. MoveEasy Platform"
								value={editProject.name}
								onChange={e => setEditProject(prev => ({ ...prev, name: e.target.value }))}
								required
							/>
							{formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
						</div>
						{/* Description */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">Project Description</label>
							<textarea
								className="block w-full px-3 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-12 resize-none"
								placeholder="Describe the project scope and features..."
								value={editProject.description}
								onChange={e => setEditProject(prev => ({ ...prev, description: e.target.value }))}
							/>
						</div>
						{/* Project Manager */}
						<div>
							<label className="block text-sm font-semibold text-gray-700 mb-2">
								Project Manager <span className="text-red-600">*</span>
							</label>
							<CustomSelect
								value={editProject.projectManagerId}
								onChange={(val) => setEditProject(prev => ({ ...prev, projectManagerId: val }))}
								options={[
									{ value: "", label: "Select Project Manager" },
									...processedProjectManagers.map((pm) => ({ value: pm.id, label: pm.label }))
								]}
								icon={User}
								placeholder="Select Project Manager"
							/>
							{formErrors.projectManagerId && (
								<p className="mt-1 text-xs text-red-600">{formErrors.projectManagerId}</p>
							)}
						</div>
						{/* Assistant Project Manager - Multi Select */}
						<div className="md:col-span-1">
							<label className="block text-xs font-semibold text-slate-500 mb-1 text-left">
								Assistant Project Manager(s) <span className="text-red-600">*</span>
							</label>
							<div className="relative">
								<button
									type="button"
									onClick={() => toggleDropdown('assistantManagers')}
									className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-50"
								>
									<span className="truncate text-left">
										{editProject.assistantManagerIds?.length === 0
											? 'Select Assistant Project Managers'
											: processedAssistantManagers
												.filter((a) => editProject.assistantManagerIds.includes(a.id))
												.map((a) => a.label)
												.filter(Boolean)
												.join(', ') || `${editProject.assistantManagerIds.length} selected`}
									</span>
								</button>
								{dropdownOpen.assistantManagers && (
									<div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
										{processedAssistantManagers.length === 0 && (
											<div className="px-3 py-2 text-sm text-slate-500">No assistant managers available</div>
										)}
										{[
											// Add selected IDs not in processedAssistantManagers
											...editProject.assistantManagerIds
												.filter(id => !processedAssistantManagers.some(am => am.id === id))
												.map(id => ({ id, label: `Unknown (${id})` })),
											...processedAssistantManagers
										].map((am) => (
											<label 
												key={am.id} 
												className={`flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm ${editProject.assistantManagerIds.includes(am.id) ? 'bg-blue-50' : ''}`}
											>
												<input
													type="checkbox"
													className="w-4 h-4 text-blue-600 border-slate-300 rounded mr-2"
													checked={editProject.assistantManagerIds.includes(am.id)}
													onChange={() => handleMultipleSelect('assistantManagerIds', am.id, !editProject.assistantManagerIds.includes(am.id))}
												/>
												<span className="text-slate-700 font-semibold">{am.label || 'Unnamed'}</span>
												{editProject.assistantManagerIds.includes(am.id) && (
													<span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Selected</span>
												)}
											</label>
										))}
									</div>
								)}
							</div>
							{formErrors.assistantManagerIds && (
								<p className="text-xs text-red-600 mt-1">{formErrors.assistantManagerIds}</p>
							)}
							{Array.isArray(editProject.assistantManagerIds) && editProject.assistantManagerIds.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-2">
									{editProject.assistantManagerIds.map((id) => {
										const am = processedAssistantManagers.find((a) => a.id === id);
										return (
											<span key={id} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
												{am?.label || id}
												<button 
													onClick={() => handleMultipleSelect('assistantManagerIds', id, false)} 
													className="text-green-600 hover:text-green-800"
												>
													&times;
												</button>
											</span>
										);
									})}
								</div>
							)}
						</div>
						{/* QA Manager - Multi Select */}
						<div className="md:col-span-1">
							<label className="block text-xs font-semibold text-slate-500 mb-1 text-left">QA Manager(s) <span className="text-red-600">*</span></label>
							<div className="relative">
								<button
									type="button"
									onClick={() => toggleDropdown('qaManagers')}
									className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-50"
								>
									<span className="truncate text-left">
										{editProject.qaManagerIds?.length === 0
											? 'Select QA Managers'
											: processedQaManagers
												.filter((a) => editProject.qaManagerIds.includes(a.id))
												.map((a) => a.label)
												.filter(Boolean)
												.join(', ') || `${editProject.qaManagerIds.length} selected`}
									</span>
								</button>
								{dropdownOpen.qaManagers && (
									<div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
										{processedQaManagers.length === 0 && (
											<div className="px-3 py-2 text-sm text-slate-500">No QA managers available</div>
										)}
										{[
											...editProject.qaManagerIds
												.filter(id => !processedQaManagers.some(qa => qa.id === id))
												.map(id => ({ id, label: `Unknown (${id})` })),
											...processedQaManagers
										].map((qa) => (
											<label key={qa.id} className={`flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm ${editProject.qaManagerIds.includes(qa.id) ? 'bg-blue-50' : ''}`}>
												<input
													type="checkbox"
													className="w-4 h-4 text-blue-600 border-slate-300 rounded mr-2"
													checked={editProject.qaManagerIds.includes(qa.id)}
													onChange={() => handleMultipleSelect('qaManagerIds', qa.id, !editProject.qaManagerIds.includes(qa.id))}
												/>
												<span className="text-slate-700 font-semibold">{qa.label || 'Unnamed'}</span>
												{editProject.qaManagerIds.includes(qa.id) && (
													<span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Selected</span>
												)}
											</label>
										))}
									</div>
								)}
							</div>
							{formErrors.qaManagerIds && <p className="text-xs text-red-600 mt-1">{formErrors.qaManagerIds}</p>}
							{Array.isArray(editProject.qaManagerIds) && editProject.qaManagerIds.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-2">
									{editProject.qaManagerIds.map((id) => {
										const qa = processedQaManagers.find((a) => a.id === id);
										return (
											<span key={id} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
												{qa?.label || id}
												<button onClick={() => handleMultipleSelect('qaManagerIds', id, false)} className="text-blue-600 hover:text-blue-800">&times;</button>
											</span>
										);
									})}
								</div>
							)}
						</div>
						{/* Team Assignment - Multi Select */}
						<div className="md:col-span-1">
							<label className="block text-xs font-semibold text-slate-500 mb-1 text-left">Agent(s) <span className="text-red-600">*</span></label>
							<div className="relative">
								<button
									type="button"
									onClick={() => toggleDropdown('teams')}
									className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-50"
								>
									<span className="truncate text-left">
										{editProject.teamIds?.length === 0
											? 'Select agents'
											: processedTeams
												.filter((a) => editProject.teamIds.includes(a.id))
												.map((a) => a.label)
												.filter(Boolean)
												.join(', ') || `${editProject.teamIds.length} selected`}
									</span>
								</button>
								{dropdownOpen.teams && (
									<div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
										{processedTeams.length === 0 && (
											<div className="px-3 py-2 text-sm text-slate-500">No agents available</div>
										)}
										{[
											...editProject.teamIds
												.filter(id => !processedTeams.some(team => team.id === id))
												.map(id => ({ id, label: `Unknown (${id})` })),
											...processedTeams
										].map((team) => (
											<label key={team.id} className={`flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm ${editProject.teamIds.includes(team.id) ? 'bg-blue-50' : ''}`}>
												<input
													type="checkbox"
													className="w-4 h-4 text-blue-600 border-slate-300 rounded mr-2"
													checked={editProject.teamIds.includes(team.id)}
													onChange={() => handleMultipleSelect('teamIds', team.id, !editProject.teamIds.includes(team.id))}
												/>
												<span className="text-slate-700 font-semibold">{team.label || 'Unnamed agent'}</span>
												{editProject.teamIds.includes(team.id) && (
													<span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Selected</span>
												)}
											</label>
										))}
									</div>
								)}
							</div>
							{formErrors.teamIds && <p className="text-xs text-red-600 mt-1">{formErrors.teamIds}</p>}
							{Array.isArray(editProject.teamIds) && editProject.teamIds.length > 0 && (
								<div className="flex flex-wrap gap-2 mt-2">
									{editProject.teamIds.map((id) => {
										const team = processedTeams.find((a) => a.id === id);
										return (
											<span key={id} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
												{team?.label || id}
												<button onClick={() => handleMultipleSelect('teamIds', id, false)} className="text-purple-600 hover:text-purple-800">&times;</button>
											</span>
										);
									})}
								</div>
							)}
						</div>
						{/* Project Files Upload */}
						<div className="md:col-span-1">
							<label className="block text-sm font-semibold text-gray-700 mb-2">Project Files</label>
							<input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
							<div className="flex items-center gap-3">
								<div onClick={triggerFileInput} className="flex items-center justify-between w-full px-3 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 focus-within:ring-2 focus-within:ring-blue-500">
									<div className="flex items-center gap-2 text-gray-600">
										<Upload className="w-4 h-4" />
										{projectFiles ? <span>{projectFiles.name}</span> : <span>Select project files</span>}
									</div>
									<span className="text-blue-600 text-xs font-medium">Browse</span>
								</div>
							</div>
							{projectFiles && (
								<div className="mt-1 space-y-1">
									<div className="flex items-center justify-between px-3 py-1 border border-gray-200 rounded-md text-sm bg-white">
										<span className="truncate text-red-600 text-xs max-w-[85%]">{projectFiles.name}</span>
										<button type="button" onClick={handleRemoveFile} className="text-gray-400 hover:text-red-500" title="Remove file"><XCircle className="w-4 h-4" /></button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
				<div className="p-4 border-t border-slate-200 bg-white flex justify-end gap-3">
					<button
						onClick={() => onUpdate(editProject)}
						disabled={isSubmitting}
						className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{isSubmitting ? (
							<>
								<svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
								</svg>
								Updating...
							</>
						) : "Update Project"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default EditProjectModal;
