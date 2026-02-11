import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  Copy,
  X,
  FileSearch,
  Brain,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  FileText,
  CheckCircle,
  Info
} from 'lucide-react';

const AIEvaluation = () => {
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);
  const [duplicateCheckProgress, setDuplicateCheckProgress] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [duplicateCheckResult, setDuplicateCheckResult] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [aiTextualSuggestion, setAiTextualSuggestion] = useState('');
  const fileInputRef = useRef(null);
  const evaluationCompletedRef = useRef(false);
  const duplicateCheckCompletedRef = useRef(false);

  // File validation constants
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
  const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];
  const ALLOWED_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];

  // Validate file
  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      return 'Please select a file';
    }

    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB limit';
    }

    // Check file extension
    const fileName = selectedFile.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return 'Only Excel files (.xlsx, .xls) are allowed';
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      return 'Invalid file type. Please upload an Excel file';
    }

    return null;
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      const error = validateFile(selectedFile);
      
      if (error) {
        setFileError(error);
        setFile(null);
        toast.error(error);
        return;
      }

      setFile(selectedFile);
      setFileError('');
      setEvaluationResult(null);
      setDuplicateCheckResult(null);
      setShowSuggestions(false);
      setAiTextualSuggestion('');
      
      // Simulate file upload
      simulateUpload();
      toast.success('File uploaded successfully!');
    }
  };

  // Simulate file upload progress
  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    
    if (droppedFile) {
      const error = validateFile(droppedFile);
      
      if (error) {
        setFileError(error);
        setFile(null);
        toast.error(error);
        return;
      }

      setFile(droppedFile);
      setFileError('');
      setEvaluationResult(null);
      setDuplicateCheckResult(null);
      setShowSuggestions(false);
      setAiTextualSuggestion('');
      simulateUpload();
      toast.success('File uploaded successfully!');
    }
  };

  // Prevent default drag behavior
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Remove file
  const handleRemoveFile = () => {
    setFile(null);
    setFileError('');
    setEvaluationResult(null);
    setDuplicateCheckResult(null);
    setShowSuggestions(false);
    setAiTextualSuggestion('');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Simulate evaluation process
  const handleEvaluate = async () => {
    if (!file) {
      toast.error('Please upload a file first');
      return;
    }

    setIsEvaluating(true);
    setEvaluationProgress(0);
    setEvaluationResult(null);
    setShowSuggestions(false);
    setAiTextualSuggestion('');
    evaluationCompletedRef.current = false;

    // Simulate AI evaluation with progress
    // NOTE: This is MOCK DATA for demonstration only
    // In production, replace this with actual API call to your backend
    const interval = setInterval(() => {
      setEvaluationProgress(prev => {
        const newProgress = prev + 5;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          
          // MOCK DATA: Showing evaluation results (no pass/fail concept)
          // REPLACE THIS ENTIRE BLOCK with actual API response parsing
          if (!evaluationCompletedRef.current) {
            evaluationCompletedRef.current = true;
            setTimeout(() => {
              const mockEvaluationSummary = "AI Analysis Complete: Your file contains 150 total records. The system has analyzed data quality, format consistency, and business rule compliance. 148 records meet all criteria, while 2 records have minor formatting inconsistencies that may need review. Overall data quality score: 95%.";
              
              setAiTextualSuggestion(mockEvaluationSummary);
              setEvaluationResult({
                status: 'info',
                message: 'AI Evaluation Complete',
                qualityScore: 95,
                details: {
                  totalRecords: 150,
                  validRecords: 148,
                  issuesFound: 2
                }
              });
              setIsEvaluating(false);
              toast('AI evaluation completed!');
            }, 0);
          }
          
          return 100;
        }
        return newProgress;
      });
    }, 150);

    // TODO: Replace with actual API call
    // Example API integration:
    // try {
    //   const formData = new FormData();
    //   formData.append('file', file);
    //   const response = await api.post('/ai/evaluate', formData);
    //   
    //   // Parse API response
    //   const { status, message, score, details, suggestions, textualSuggestion } = response.data;
    //   
    //   setEvaluationResult({
    //     status: status, // 'success' or 'failed'
    //     message: message,
    //     score: score,
    //     details: details // { totalRecords, validRecords, invalidRecords }
    //   });
    //   
    //   setAiTextualSuggestion(textualSuggestion); // AI's text summary
    //   
    //   if (suggestions && suggestions.length > 0) {
    //     setSuggestions(suggestions); // Array of detailed suggestions
    //     setShowSuggestions(true);
    //   }
    // } catch (error) {
    //   toast.error('Evaluation failed');
    //   setIsEvaluating(false);
    // }
  };

  // Simulate duplicate check process
  const handleDuplicateCheck = async () => {
    if (!file) {
      toast.error('Please upload a file first');
      return;
    }

    setIsDuplicateChecking(true);
    setDuplicateCheckProgress(0);
    setDuplicateCheckResult(null);
    duplicateCheckCompletedRef.current = false;

    // Simulate duplicate checking with progress
    // NOTE: This is MOCK DATA for demonstration only
    // In production, replace this with actual API call to your backend
    const interval = setInterval(() => {
      setDuplicateCheckProgress(prev => {
        const newProgress = prev + 8;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          
          // MOCK DATA: Showing DUPLICATES FOUND case for UI demonstration
          // REPLACE THIS ENTIRE BLOCK with actual API response parsing
          if (!duplicateCheckCompletedRef.current) {
            duplicateCheckCompletedRef.current = true;
            setTimeout(() => {
              const duplicateCount = 15; // Fixed count for demo
              setDuplicateCheckResult({
                status: 'warning',
                hasDuplicates: true,
                count: duplicateCount,
                message: `Duplicate Check Complete - ${duplicateCount} Duplicate ${duplicateCount === 1 ? 'Record' : 'Records'} Found`,
                duplicates: [
                  { row: 12, column: 'Email', value: 'john.doe@example.com' },
                  { row: 45, column: 'Phone', value: '+1-555-0123' },
                  { row: 78, column: 'ID', value: 'EMP001' },
                  { row: 89, column: 'Email', value: 'jane.smith@company.com' },
                  { row: 134, column: 'Phone', value: '+1-555-0456' }
                ]
              });
              setIsDuplicateChecking(false);
              toast.error(`Found ${duplicateCount} duplicate ${duplicateCount === 1 ? 'record' : 'records'}!`);
            }, 0);
          }
          
          return 100;
        }
        return newProgress;
      });
    }, 120);

    // TODO: Replace with actual API call
    // Example API integration:
    // try {
    //   const formData = new FormData();
    //   formData.append('file', file);
    //   const response = await api.post('/ai/duplicate-check', formData);
    //   
    //   // Parse API response
    //   const { status, hasDuplicates, count, message, duplicates } = response.data;
    //   
    //   setDuplicateCheckResult({
    //     status: status, // 'success' or 'warning'
    //     hasDuplicates: hasDuplicates,
    //     count: count,
    //     message: message,
    //     duplicates: duplicates // Array of { row, column, value }
    //   });
    // } catch (error) {
    //   toast.error('Duplicate check failed');
    //   setIsDuplicateChecking(false);
    // }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 px-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md border-2 border-blue-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">AI Evaluation</h2>
            <p className="text-slate-600 text-sm mt-1">
              Upload your Excel file for AI-powered evaluation and duplicate detection
            </p>
          </div>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Upload Excel File
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Maximum file size: 10MB | Supported formats: .xlsx, .xls
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 ${
            file
              ? 'border-green-400 bg-green-50'
              : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />

          {!file ? (
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-slate-700 font-medium mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-slate-500">Excel files (.xlsx, .xls) up to 10MB</p>
            </label>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                    title="Remove file"
                  >
                    <X className="w-5 h-5 text-slate-400 group-hover:text-red-600" />
                  </button>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 font-medium">Uploading...</span>
                    <span className="text-blue-600 font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* File Error */}
        {fileError && (
          <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{fileError}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {file && !isUploading && (
        <div className="flex items-center justify-center gap-3">
          {/* Evaluate Button */}
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating || isDuplicateChecking}
            className={`relative overflow-hidden rounded-lg px-6 py-3 text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${
              isEvaluating
                ? 'bg-blue-500'
                : 'bg-blue-600 hover:bg-blue-700'
            } ${(isEvaluating || isDuplicateChecking) ? 'cursor-not-allowed opacity-75' : ''}`}
          >
            <div className="flex items-center justify-center gap-2">
              {isEvaluating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span className="text-sm">
                {isEvaluating ? `Evaluating... ${evaluationProgress}%` : 'AI Evaluate'}
              </span>
            </div>
          </button>

          {/* Duplicate Check Button */}
          <button
            onClick={handleDuplicateCheck}
            disabled={isEvaluating || isDuplicateChecking}
            className={`relative overflow-hidden rounded-lg px-6 py-3 text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${
              isDuplicateChecking
                ? 'bg-blue-500'
                : 'bg-blue-600 hover:bg-blue-700'
            } ${(isEvaluating || isDuplicateChecking) ? 'cursor-not-allowed opacity-75' : ''}`}
          >
            <div className="flex items-center justify-center gap-2">
              {isDuplicateChecking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSearch className="w-4 h-4" />
              )}
              <span className="text-sm">
                {isDuplicateChecking ? `Checking... ${duplicateCheckProgress}%` : 'Duplicate Check'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* AI Textual Suggestion */}
      {aiTextualSuggestion && (
        <div className="bg-blue-50 rounded-xl shadow-md border-2 border-blue-200 p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-blue-900 mb-2">AI Summary</h4>
              <p className="text-slate-700 leading-relaxed text-sm">
                {aiTextualSuggestion}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 
      {/* Evaluation Result */}
      {evaluationResult && (
        <div className="rounded-xl shadow-lg border-2 p-6 bg-blue-50 border-blue-300">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-blue-100">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold mb-2 text-blue-800">
                {evaluationResult.message}
              </h4>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-sm text-slate-600">Total Records</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {evaluationResult.details.totalRecords}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-slate-600">Valid Records</p>
                  <p className="text-2xl font-bold text-green-600">
                    {evaluationResult.details.validRecords}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <p className="text-sm text-slate-600">Issues Found</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {evaluationResult.details.issuesFound}
                  </p>
                </div>
              </div>
              {evaluationResult.qualityScore && (
                <div className="mt-4 bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-sm text-slate-600 mb-2">Data Quality Score</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 rounded-full bg-blue-500"
                        style={{ width: `${evaluationResult.qualityScore}%` }}
                      />
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {evaluationResult.qualityScore}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Check Result */}
      {duplicateCheckResult && (
        <div
          className={`rounded-xl shadow-lg border-2 p-6 ${
            duplicateCheckResult.hasDuplicates
              ? 'bg-orange-50 border-orange-300'
              : 'bg-green-50 border-green-300'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                duplicateCheckResult.hasDuplicates ? 'bg-orange-100' : 'bg-green-100'
              }`}
            >
              {duplicateCheckResult.hasDuplicates ? (
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              )}
            </div>
            <div className="flex-1">
              <h4
                className={`text-lg font-bold mb-2 ${
                  duplicateCheckResult.hasDuplicates ? 'text-orange-800' : 'text-green-800'
                }`}
              >
                {duplicateCheckResult.message}
              </h4>
              
              {/* Duplicate Count Badge */}
              {duplicateCheckResult.hasDuplicates && (
                <div className="mb-4">
                  <div className="inline-flex items-center gap-2 bg-white rounded-lg px-4 py-2 border border-orange-200">
                    <Copy className="w-5 h-5 text-orange-600" />
                    <span className="text-sm text-slate-600">Total Duplicates:</span>
                    <span className="text-2xl font-bold text-orange-600">{duplicateCheckResult.count}</span>
                  </div>
                </div>
              )}
              
              {duplicateCheckResult.hasDuplicates && duplicateCheckResult.duplicates && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-slate-700">
                    Sample Duplicates (showing first {Math.min(duplicateCheckResult.duplicates.length, 5)}):
                  </p>
                  {duplicateCheckResult.duplicates.map((dup, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg p-3 border border-orange-200 flex items-center gap-3"
                    >
                      <Copy className="w-4 h-4 text-orange-600 shrink-0" />
                      <div className="text-sm">
                        <span className="font-medium text-slate-800">Row {dup.row}</span>
                        <span className="text-slate-500"> - </span>
                        <span className="font-medium text-slate-800">{dup.column}</span>
                        <span className="text-slate-500"> - </span>
                        <span className="text-slate-600">{dup.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions View - Inline Component */}
      {showSuggestions && suggestions.length > 0 && (
        <AISuggestionsViewInline suggestions={suggestions} onClose={() => setShowSuggestions(false)} />
      )}
    </div>
  );
};

// AI Suggestions View Component (Inline - merged from separate file)
const AISuggestionsViewInline = ({ suggestions, onClose }) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);
  const [filter, setFilter] = useState('all'); // all, error, warning, info

  // Toggle suggestion expansion
  const toggleSuggestion = (id) => {
    setExpandedSuggestion(expandedSuggestion === id ? null : id);
  };

  // Get icon based on severity
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'low':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  // Get severity color classes
  const getSeverityClasses = (severity) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          badge: 'bg-red-100 text-red-700'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          badge: 'bg-yellow-100 text-yellow-700'
        };
      case 'low':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-700'
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-800',
          badge: 'bg-slate-100 text-slate-700'
        };
    }
  };

  // Filter suggestions
  const filteredSuggestions = suggestions.filter(suggestion => {
    if (filter === 'all') return true;
    if (filter === 'error') return suggestion.severity === 'high';
    if (filter === 'warning') return suggestion.severity === 'medium';
    if (filter === 'info') return suggestion.severity === 'low';
    return true;
  });

  // Count by severity
  const counts = {
    high: suggestions.filter(s => s.severity === 'high').length,
    medium: suggestions.filter(s => s.severity === 'medium').length,
    low: suggestions.filter(s => s.severity === 'low').length
  };

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-blue-200 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">AI Suggestions</h3>
              <p className="text-blue-100 text-sm mt-1">
                Review and fix the issues identified by AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Close suggestions"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-red-200" />
              <span className="text-sm text-blue-100">High Priority</span>
            </div>
            <p className="text-2xl font-bold">{counts.high}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-200" />
              <span className="text-sm text-blue-100">Medium Priority</span>
            </div>
            <p className="text-2xl font-bold">{counts.medium}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-blue-200" />
              <span className="text-sm text-blue-100">Low Priority</span>
            </div>
            <p className="text-2xl font-bold">{counts.low}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All ({suggestions.length})
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'error'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Errors ({counts.high})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'warning'
                ? 'bg-yellow-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Warnings ({counts.medium})
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === 'info'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Info ({counts.low})
          </button>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="p-6 max-h-[500px] overflow-y-auto">
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-slate-600 font-medium">No suggestions in this category</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSuggestions.map((suggestion) => {
              const classes = getSeverityClasses(suggestion.severity);
              const isExpanded = expandedSuggestion === suggestion.id;

              return (
                <div
                  key={suggestion.id}
                  className={`rounded-lg border-2 overflow-hidden transition-all ${classes.border} ${classes.bg}`}
                >
                  {/* Suggestion Header */}
                  <button
                    onClick={() => toggleSuggestion(suggestion.id)}
                    className="w-full p-4 flex items-start gap-3 hover:bg-white/50 transition-colors"
                  >
                    <div className="shrink-0 mt-0.5">
                      {getSeverityIcon(suggestion.severity)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${classes.badge}`}>
                          {suggestion.severity.toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          Row {suggestion.row}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {suggestion.column}
                        </span>
                      </div>
                      <p className={`font-semibold ${classes.text}`}>
                        {suggestion.issue}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-slate-200">
                      <div className="bg-white rounded-lg p-4 mt-3">
                        <div className="flex items-start gap-2 mb-3">
                          <Lightbulb className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-slate-800 mb-1">
                              AI Suggestion:
                            </p>
                            <p className="text-sm text-slate-700 leading-relaxed">
                              {suggestion.suggestion}
                            </p>
                          </div>
                        </div>

                        {/* Additional Details */}
                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Location</p>
                            <p className="text-sm font-medium text-slate-800">
                              Row {suggestion.row}, Column {suggestion.column}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Severity Level</p>
                            <p className="text-sm font-medium text-slate-800 capitalize">
                              {suggestion.severity}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <FileText className="w-4 h-4" />
            <span>
              Showing {filteredSuggestions.length} of {suggestions.length} suggestions
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIEvaluation;
