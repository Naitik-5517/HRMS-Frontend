import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, Loader2, ChevronDown, Pencil, Trash2, Upload, Users, Table } from 'lucide-react';
import { fetchDropdown } from '../../../../services/dropdownService';
import { fetchProjectTasks } from '../../../../services/projectService';
import { useAuth } from '../../../../context/AuthContext';
import MultiSelectWithCheckbox from '../../../common/MultiSelectWithCheckbox';
import * as XLSX from 'xlsx';

const TasksModal = ({
  project,
  onClose,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  readOnly = false
}) => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [editTaskId, setEditTaskId] = useState(null);
    const [editFormData, setEditFormData] = useState(null);
    const [editFormErrors, setEditFormErrors] = useState({});
    const [editSubmitting, setEditSubmitting] = useState(false);
    // Fetch tasks for this project
    useEffect(() => {
      if (!project?.id) return;
      setTasksLoading(true);
      fetchProjectTasks(
        project.id,
        user?.user_id,
        user?.device_id || 'web',
        user?.device_type || 'Laptop'
      )
        .then(res => {
          setTasks(Array.isArray(res.data) ? res.data : []);
        })
        .catch(() => setTasks([]))
        .finally(() => setTasksLoading(false));
    }, [project?.id, user?.user_id, user?.device_id, user?.device_type]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target: '',
    teamIds: [],
    file: null,
    importantColumns: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsError, setAgentsError] = useState('');
  const fileInputRef = useRef(null);
  
  // Dynamic important columns options from Excel file
  const [excelColumnHeaders, setExcelColumnHeaders] = useState([]);

  useEffect(() => {
    const loadAgents = async () => {
      setAgentsLoading(true);
      setAgentsError('');
      try {
        const data = await fetchDropdown('agent', project?.id);
        const normalized = (data || []).map((item) => {
          const candidate = Array.isArray(item) ? item[0] : item;
          const id = candidate?.user_id || candidate?.team_id || candidate?.id;
          const label = candidate?.label || candidate?.name || candidate?.user_name || candidate?.team_name || '';
          return id ? { id: String(id), label } : null;
        }).filter(Boolean);
        setAgents(normalized);
      } catch (error) {
        console.error('Failed to fetch agents:', error);
        setAgentsError('Unable to load agents');
      } finally {
        setAgentsLoading(false);
      }
    };
    loadAgents();
  }, [project?.id]);

  const handleTeamChange = (newTeamIds) => {
    setFormData((prev) => ({ ...prev, teamIds: newTeamIds }));
    if (formErrors.teamIds) {
      setFormErrors((prev) => ({ ...prev, teamIds: '' }));
    }
  };

  const handleImportantColumnsChange = (newColumns) => {
    setFormData((prev) => ({ ...prev, importantColumns: newColumns }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
      
      // Read Excel file and extract column headers
      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            // Get first row (column headers)
            if (jsonData && jsonData.length > 0 && jsonData[0]) {
              const headers = jsonData[0].filter(header => header && String(header).trim());
              setExcelColumnHeaders(headers.map(h => String(h)));
              // Clear previously selected important columns when new file is uploaded
              setFormData((prev) => ({ ...prev, importantColumns: [] }));
            }
          } catch (error) {
            console.error('Error reading Excel file:', error);
            toast.error('Failed to read Excel file');
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error('Failed to process Excel file');
      }
    }
  };
  
  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, file: null, importantColumns: [] }));
    setExcelColumnHeaders([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Please upload a valid Excel file (.xlsx or .xls)');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        const headers = jsonData[0] || [];
        const filteredHeaders = headers.filter(h => h && String(h).trim());
        
        if (filteredHeaders.length === 0) {
          toast.error('No column headers found in Excel file');
          return;
        }

        setColumnNames(filteredHeaders);
        setFormData((prev) => ({ ...prev, excelFile: file, selectedColumns: [] }));
        toast.success(`Excel file uploaded successfully! ${filteredHeaders.length} columns found.`);
      } catch (error) {
        console.error('Error reading Excel file:', error);
        toast.error('Failed to read Excel file. Please check the file format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const toggleColumnSelection = (column) => {
    setFormData((prev) => {
      const exists = prev.selectedColumns.includes(column);
      const updated = exists 
        ? prev.selectedColumns.filter((c) => c !== column) 
        : [...prev.selectedColumns, column];
      return { ...prev, selectedColumns: updated };
    });
  };

  const handleSelectAllColumns = (isChecked) => {
    if (isChecked) {
      setFormData((prev) => ({ ...prev, selectedColumns: [...columnNames] }));
    } else {
      setFormData((prev) => ({ ...prev, selectedColumns: [] }));
    }
  };

  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, excelFile: null, selectedColumns: [] }));
    setColumnNames([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const errors = {};

    console.log('Validating form data:', formData);
    console.log('teamIds:', formData.teamIds, 'length:', formData.teamIds.length);

    if (!formData.name.trim()) errors.name = 'Task name is required';

    if (!formData.target) {
      errors.target = 'Target is required';
    } else if (Number(formData.target) <= 0) {
      errors.target = 'Target must be greater than 0';
    }

    if (!formData.teamIds || formData.teamIds.length === 0) errors.teamIds = 'Select at least one agent';

    console.log('Validation errors:', errors);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddTask = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    const success = await onAddTask(formData);
    setIsSubmitting(false);
    if (success) {
      setFormData({ name: '', description: '', target: '', teamIds: [], file: null, importantColumns: [] });
      setExcelColumnHeaders([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Refetch tasks
      setTasksLoading(true);
      fetchProjectTasks(
        project.id,
        user?.user_id,
        user?.device_id || 'web',
        user?.device_type || 'Laptop'
      )
        .then(res => setTasks(Array.isArray(res.data) ? res.data : []))
        .finally(() => setTasksLoading(false));
    }
  };

  // Edit logic
  const startEditTask = (task) => {
    setEditTaskId(task.task_id || task.id);
    setEditFormData({
      name: task.task_name || task.name || '',
      description: task.task_description || task.description || '',
      target: task.task_target || task.target || '',
      teamIds: Array.isArray(task.task_team_id) ? task.task_team_id.map(String) : [],
    });
    setEditFormErrors({});
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    if (editFormErrors[field]) setEditFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleEditTeamToggle = (id) => {
    setEditFormData(prev => {
      const exists = prev.teamIds.includes(id);
      const updated = exists ? prev.teamIds.filter(t => t !== id) : [...prev.teamIds, id];
      return { ...prev, teamIds: updated };
    });
    if (editFormErrors.teamIds) setEditFormErrors(prev => ({ ...prev, teamIds: '' }));
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editFormData.name?.trim()) errors.name = 'Task name is required';
    if (!editFormData.target) errors.target = 'Target is required';
    else if (Number(editFormData.target) <= 0) errors.target = 'Target must be greater than 0';
    if (!editFormData.teamIds?.length) errors.teamIds = 'Select at least one agent';
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditTask = async () => {
    if (!validateEditForm()) return;
    setEditSubmitting(true);
    const success = await onUpdateTask(project.id, editTaskId, editFormData);
    setEditSubmitting(false);
    if (success) {
      setEditTaskId(null);
      setEditFormData(null);
      // Refetch tasks
      setTasksLoading(true);
      fetchProjectTasks(
        project.id,
        user?.user_id,
        user?.device_id || 'web',
        user?.device_type || 'Laptop'
      )
        .then(res => setTasks(Array.isArray(res.data) ? res.data : []))
        .finally(() => setTasksLoading(false));
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    setTasksLoading(true);
    await onDeleteTask(project.id, taskId);
    fetchProjectTasks(
      project.id,
      user?.user_id,
      user?.device_id || 'web',
      user?.device_type || 'Laptop'
    )
      .then(res => setTasks(Array.isArray(res.data) ? res.data : []))
      .finally(() => setTasksLoading(false));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
        <div className="p-4 bg-blue-800 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-bold">Project Tasks</h2>
            <p className="text-blue-200 text-xs">{project.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-white">
          {/* Add Task Form */}
          {!readOnly && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700 mb-3">Add Task</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Task Name <span className="text-red-600">*</span></label>
                  <input
                    className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter task name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                  />
                  {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Target <span className="text-red-600">*</span></label>
                  <input
                    className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Target"
                    type="number"
                    value={formData.target}
                    onChange={(e) => handleChange('target', e.target.value)}
                  />
                  {formErrors.target && <p className="text-xs text-red-600 mt-1">{formErrors.target}</p>}
                </div>
                
                {/* Excel File Upload */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Upload Excel File</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="excel-upload"
                    />
                    <label
                      htmlFor="excel-upload"
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors text-sm"
                    >
                      <Upload className="w-4 h-4 text-slate-600" />
                      <span className="text-slate-700">Choose Excel File</span>
                    </label>
                    {formData.excelFile && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">{formData.excelFile.name}</span>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {!formData.excelFile && (
                    <p className="text-xs text-slate-500 mt-1">Upload an Excel file to extract column names</p>
                  )}
                </div>

                {/* Column Selection Dropdown */}
                {columnNames.length > 0 && (
                  <div className="md:col-span-2" ref={columnDropdownRef}>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Select Columns</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowColumnDropdown((prev) => !prev)}
                        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-slate-50"
                      >
                        <span className="truncate text-left">
                          {formData.selectedColumns.length === 0
                            ? 'Select columns from Excel'
                            : `${formData.selectedColumns.length} column${formData.selectedColumns.length > 1 ? 's' : ''} selected`}
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showColumnDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {showColumnDropdown && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                          {/* Select All Option */}
                          <label className="flex items-center px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-200 bg-slate-50 text-sm">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded mr-2"
                              checked={columnNames.length > 0 && formData.selectedColumns.length === columnNames.length}
                              onChange={(e) => handleSelectAllColumns(e.target.checked)}
                            />
                            <span className="font-semibold text-slate-900">Select All</span>
                          </label>
                          {columnNames.map((column, index) => (
                            <label key={index} className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 border-slate-300 rounded mr-2"
                                checked={formData.selectedColumns.includes(column)}
                                onChange={() => toggleColumnSelection(column)}
                              />
                              <span className="text-slate-700">{column}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    {formData.selectedColumns.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.selectedColumns.map((column, index) => (
                          <span key={index} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            {column}
                            <button onClick={() => toggleColumnSelection(column)} className="text-green-600 hover:text-green-800">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Task Description</label>
                  <textarea
                    className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[70px]"
                    placeholder="Add a short description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                </div>
                
                {/* Task File Upload - Excel Only */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Task File (Excel Only)</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="task-file-upload"
                      accept=".xlsx,.xls"
                    />
                    <label
                      htmlFor="task-file-upload"
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 text-sm"
                    >
                      <Upload className="w-4 h-4" />
                      Choose Excel File
                    </label>
                    {formData.file && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <span className="text-blue-800 truncate max-w-xs">{formData.file.name}</span>
                        <button
                          onClick={handleRemoveFile}
                          className="text-blue-600 hover:text-blue-800"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {excelColumnHeaders.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">✓ Found {excelColumnHeaders.length} columns in Excel file</p>
                  )}
                </div>
                
                {/* Important Columns Dropdown - Populated from Excel */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Important Columns</label>
                  <MultiSelectWithCheckbox
                    value={formData.importantColumns}
                    onChange={handleImportantColumnsChange}
                    options={excelColumnHeaders.map(col => ({ value: col, label: col }))}
                    icon={Table}
                    placeholder={excelColumnHeaders.length === 0 ? "Upload Excel file first" : "Select important columns"}
                    disabled={excelColumnHeaders.length === 0}
                    showSelectAll={true}
                    maxDisplayCount={2}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Team (Agents) <span className="text-red-600">*</span></label>
                  <MultiSelectWithCheckbox
                    value={formData.teamIds}
                    onChange={handleTeamChange}
                    options={agents.map(agent => ({ value: agent.id, label: agent.label }))}
                    icon={Users}
                    placeholder={agentsLoading ? "Loading agents..." : agents.length === 0 ? (agentsError || "No agents available") : "Select agents"}
                    disabled={agentsLoading || agents.length === 0}
                    showSelectAll={true}
                    error={!!formErrors.teamIds}
                    errorMessage={formErrors.teamIds}
                    maxDisplayCount={2}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleAddTask}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksModal;
