/**
 * File: QCFormPage.jsx
 * Author: Naitik Maisuriya
 * Description: QC Form page for quality checking with dynamic form fields
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  Download,
  Save,
  FileText,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import MultiSelectWithCheckbox from '../components/common/MultiSelectWithCheckbox';
import SearchableSelect from '../components/common/SearchableSelect';

const QCFormPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const trackerData = location.state?.tracker;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data from API
  const [formData, setFormData] = useState([]);
  const [afdData, setAfdData] = useState(null); // AFD with categories and subcategories
  
  // Form state - errors selected for each record
  const [formRows, setFormRows] = useState([]);
  const [qcScore, setQcScore] = useState(0);
  
  // State for error selection
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Fetch QC Form data
  useEffect(() => {
    if (!trackerData) {
      toast.error('No tracker data found');
      navigate(-1);
      return;
    }
    fetchQCFormData();
  }, [trackerData]);

  const fetchQCFormData = async () => {
    try {
      setLoading(true);
      setError(null);

      let transformedAFD = null;

      // Fetch AFD data from API
      const afdResponse = await api.post('/qc_afd/list', {});
      
      if (afdResponse.data.status === 200 && afdResponse.data.data.length > 0) {
        // Get the first AFD (or match by project/tracker)
        const afd = afdResponse.data.data.find(a => a.categories && a.categories.length > 0) || afdResponse.data.data[0];
        
        // Transform AFD data structure
        transformedAFD = {
          afd_id: afd.afd_id,
          afd_name: afd.afd_name,
          categories: (afd.categories || []).map(cat => ({
            qc_afd_id: cat.qc_afd_id,
            name: cat.afd_name,
            points: cat.afd_points,
            subcategories: (cat.subcategories || []).map(sub => ({
              qc_afd_id: sub.qc_afd_id,
              name: sub.afd_name,
              points: sub.afd_points
            }))
          }))
        };
        
        setAfdData(transformedAFD);
      }

      // TODO: Fetch actual form data from tracker
      // const formResponse = await api.get(`/tracker/data/${trackerData.tracker_id}`);
      
      // MOCK DATA: Simulating file records
      const mockFormData = [
        { id: 1, field1: 'John Doe', field2: 'Active', field3: '2024-01-15' },
        { id: 2, field1: 'Jane Smith', field2: 'Completed', field3: '2024-01-16' },
        { id: 3, field1: 'Bob Wilson', field2: 'Pending', field3: '2024-01-17' },
        { id: 4, field1: 'Alice Johnson', field2: 'Active', field3: '2024-01-18' },
        { id: 5, field1: 'Charlie Brown', field2: 'Completed', field3: '2024-01-19' }
      ];

      setFormData(mockFormData);

      // Initialize form rows with errors structure
      const initialRows = mockFormData.map((data) => ({
        id: data.id,
        originalData: data,
        errors: [] // Array of { categoryId, subcategoryId }
      }));
      setFormRows(initialRows);
      calculateQCScore(initialRows, transformedAFD);

    } catch (err) {
      console.error('[QCFormPage] Error fetching form data:', err);
      setError(err.message || 'Failed to load QC form data');
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  // Add error to a record
  const handleAddError = (rowIndex, categoryId, subcategoryId) => {
    const updatedRows = [...formRows];
    const row = updatedRows[rowIndex];
    
    // Check if error already exists
    const errorExists = row.errors.some(
      err => err.categoryId === categoryId && err.subcategoryId === subcategoryId
    );
    
    if (!errorExists) {
      row.errors.push({ categoryId, subcategoryId });
      setFormRows(updatedRows);
      calculateQCScore(updatedRows, afdData);
    }
  };

  // Remove error from a record
  const handleRemoveError = (rowIndex, errorIndex) => {
    const updatedRows = [...formRows];
    updatedRows[rowIndex].errors.splice(errorIndex, 1);
    setFormRows(updatedRows);
    calculateQCScore(updatedRows, afdData);
  };

  // Calculate QC Score for all records
  const calculateQCScore = (rows, afd) => {
    if (!afd || !afd.categories || afd.categories.length === 0) {
      setQcScore(0);
      return;
    }

    // Calculate score for each record
    const recordScores = rows.map(row => calculateRecordScore(row, afd));
    
    // Calculate average of all record scores = Final QC Score
    const avgScore = recordScores.length > 0
      ? recordScores.reduce((sum, score) => sum + score, 0) / recordScores.length
      : 0;
    
    setQcScore(Number(avgScore.toFixed(2)));
  };

  // Calculate score for a single record
  const calculateRecordScore = (row, afd) => {
    if (!afd || !afd.categories) return 100;

    // Calculate score for each category
    const categoryScores = afd.categories.map(category => {
      // Start with 100 points for this category
      let categoryScore = 100;
      
      // Find all errors in this category for this record
      const categoryErrors = row.errors.filter(err => err.categoryId === category.qc_afd_id);
      
      // Deduct points for each error
      categoryErrors.forEach(error => {
        const subcategory = category.subcategories.find(sub => sub.qc_afd_id === error.subcategoryId);
        if (subcategory) {
          categoryScore -= subcategory.points;
        }
      });
      
      // Ensure score doesn't go below 0
      return Math.max(0, categoryScore);
    });

    // Calculate average of all category scores for this record
    const recordScore = categoryScores.length > 0
      ? categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length
      : 100;
    
    return recordScore;
  };

  // Get category score for a specific record
  const getCategoryScore = (row, categoryId) => {
    if (!afdData) return 100;
    
    const category = afdData.categories.find(cat => cat.qc_afd_id === categoryId);
    if (!category) return 100;

    let categoryScore = 100;
    const categoryErrors = row.errors.filter(err => err.categoryId === categoryId);
    
    categoryErrors.forEach(error => {
      const subcategory = category.subcategories.find(sub => sub.qc_afd_id === error.subcategoryId);
      if (subcategory) {
        categoryScore -= subcategory.points;
      }
    });
    
    return Math.max(0, categoryScore);
  };

  // Get total deduction for a subcategory across all records
  const getSubcategoryTotalDeduction = (categoryId, subcategoryId) => {
    let totalDeduction = 0;
    formRows.forEach(row => {
      const hasError = row.errors.some(
        err => err.categoryId === categoryId && err.subcategoryId === subcategoryId
      );
      if (hasError) {
        const category = afdData?.categories.find(cat => cat.qc_afd_id === categoryId);
        const subcategory = category?.subcategories.find(sub => sub.qc_afd_id === subcategoryId);
        if (subcategory) {
          totalDeduction += subcategory.points;
        }
      }
    });
    return totalDeduction;
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSaving(true);

      // TODO: Replace with actual API call
      // const response = await api.post('/qc/form/submit', {
      //   tracker_id: trackerData.tracker_id,
      //   rows: formRows,
      //   qc_score: qcScore
      // });

      // Mock success
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('QC Form submitted successfully!');
      navigate(-1);

    } catch (err) {
      console.error('[QCFormPage] Error submitting form:', err);
      toast.error('Failed to submit QC form');
    } finally {
      setSaving(false);
    }
  };

  // Handle file download
  const handleDownload = () => {
    if (trackerData?.tracker_file) {
      const fileUrl = `${import.meta.env.VITE_BACKEND_URL || ''}/${trackerData.tracker_file}`;
      window.open(fileUrl, '_blank');
      toast.success('Downloading file...');
    } else {
      toast.error('No file available for download');
    }
  };

  if (!trackerData) {
    return (
      <div className="flex items-center justify-center h-64">
        <ErrorMessage message="No tracker data available" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ErrorMessage message={error} />
      </div>
    );
  }

  // Get the first three keys from the first data object for dynamic columns
  const dynamicKeys = formData.length > 0 ? Object.keys(formData[0]).filter(key => key !== 'id').slice(0, 3) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
      </div>

      {/* QC Form Heading */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-3">
          <FileText className="w-8 h-8" />
          QC Form - {afdData?.afd_name || 'Quality Check'}
        </h1>
      </div>

      {/* Agent Info & File Details */}
      <div className="bg-white rounded-xl shadow-md p-6 border-2 border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Agent Name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 font-medium">Agent Name</p>
              <p className="text-lg font-bold text-slate-800">
                {trackerData.user_name || 'N/A'}
              </p>
            </div>
          </div>

          {/* File Name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-600 font-medium">File Name</p>
              <p className="text-lg font-bold text-slate-800 truncate">
                {trackerData.tracker_file ? trackerData.tracker_file.split('/').pop() : 'No file'}
              </p>
            </div>
          </div>

          {/* Download Button */}
          <div className="flex items-center justify-center md:justify-end">
            <button
              onClick={handleDownload}
              disabled={!trackerData.tracker_file}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download File
            </button>
          </div>
        </div>
      </div>

      {/* Final QC Score Display */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-md p-6 border-2 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-semibold uppercase tracking-wide">Final QC Score</p>
              <p className="text-4xl font-bold text-green-800">
                {qcScore.toFixed(2)}%
              </p>
              <p className="text-xs text-green-600 mt-1">Average of all records</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center bg-white rounded-lg p-3 shadow">
              <p className="text-xs text-slate-600">Total Records</p>
              <p className="text-2xl font-bold text-slate-800">{formRows.length}</p>
            </div>
            <div className="text-center bg-white rounded-lg p-3 shadow">
              <p className="text-xs text-slate-600">Categories</p>
              <p className="text-2xl font-bold text-slate-800">{afdData?.categories.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* QC Form Table */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 sticky top-0">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500">
                  Sr. No.
                </th>
                {dynamicKeys.map((key, index) => (
                  <th
                    key={index}
                    className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500"
                  >
                    {key.replace(/_/g, ' ')}
                  </th>
                ))}
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500">
                  Select Error
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500">
                  Selected Errors
                </th>
                {afdData?.categories.map((cat) => (
                  <th
                    key={cat.qc_afd_id}
                    className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider border-r border-blue-500"
                  >
                    {cat.name}
                  </th>
                ))}
                <th className="px-4 py-4 text-center text-xs font-bold text-white uppercase tracking-wider">
                  Record Score
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {formRows.map((row, rowIndex) => {
                const recordScore = calculateRecordScore(row, afdData);
                
                return (
                  <tr key={row.id} className="hover:bg-blue-50 transition-colors">
                    {/* Sr. No. */}
                    <td className="px-4 py-4 text-sm font-semibold text-slate-700 border-r border-slate-200">
                      {rowIndex + 1}
                    </td>

                    {/* Dynamic Columns */}
                    {dynamicKeys.map((key, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-4 py-4 text-sm text-slate-600 border-r border-slate-200"
                      >
                        {row.originalData[key]}
                      </td>
                    ))}

                    {/* Error Selection Dropdown */}
                    <td className="px-4 py-4 border-r border-slate-200">
                      <div className="flex flex-col gap-3">
                        <SearchableSelect
                          value={selectedRecord === rowIndex ? selectedCategory : ''}
                          onChange={(value) => {
                            setSelectedRecord(rowIndex);
                            setSelectedCategory(value);
                            setSelectedSubcategories([]);
                          }}
                          options={afdData?.categories.map((cat) => ({
                            value: cat.qc_afd_id,
                            label: cat.name
                          })) || []}
                          placeholder="Select Category"
                          icon={FileText}
                          isClearable={true}
                        />

                        <MultiSelectWithCheckbox
                          value={selectedRecord === rowIndex && selectedCategory ? selectedSubcategories : []}
                          onChange={(values) => {
                            if (selectedRecord === rowIndex) {
                              setSelectedSubcategories(values);
                            }
                          }}
                          options={selectedCategory && afdData?.categories
                            .find(cat => cat.qc_afd_id === parseInt(selectedCategory))
                            ?.subcategories.map((sub) => ({
                              value: sub.qc_afd_id,
                              label: `${sub.name} (-${sub.points} pts)`
                            })) || []}
                          placeholder="Select Errors"
                          disabled={!selectedCategory || selectedRecord !== rowIndex}
                          showSelectAll={true}
                          icon={AlertCircle}
                        />

                        <button
                          onClick={() => {
                            if (selectedCategory && selectedSubcategories.length > 0 && selectedRecord === rowIndex) {
                              selectedSubcategories.forEach(subcategoryId => {
                                handleAddError(rowIndex, parseInt(selectedCategory), subcategoryId);
                              });
                              setSelectedSubcategories([]);
                            }
                          }}
                          disabled={!selectedCategory || selectedSubcategories.length === 0 || selectedRecord !== rowIndex}
                          className="w-full px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-500 text-white text-sm font-bold rounded-lg transition-all shadow-sm hover:shadow-md"
                        >
                          Add {selectedSubcategories.length > 0 ? `(${selectedSubcategories.length})` : ''} Error{selectedSubcategories.length !== 1 ? 's' : ''}
                        </button>
                      </div>
                    </td>

                    {/* Selected Errors */}
                    <td className="px-4 py-4 border-r border-slate-200">
                      <div className="flex flex-col gap-1 max-w-xs">
                        {row.errors.length > 0 ? (
                          row.errors.map((error, errorIndex) => {
                            const category = afdData?.categories.find(cat => cat.qc_afd_id === error.categoryId);
                            const subcategory = category?.subcategories.find(sub => sub.qc_afd_id === error.subcategoryId);
                            
                            return (
                              <div
                                key={errorIndex}
                                className="flex items-center justify-between gap-1 bg-red-50 border border-red-300 px-2 py-1 rounded text-xs"
                              >
                                <span className="font-semibold text-red-800 truncate">
                                  {subcategory?.name} (-{subcategory?.points})
                                </span>
                                <button
                                  onClick={() => handleRemoveError(rowIndex, errorIndex)}
                                  className="text-red-600 hover:text-red-800 font-bold flex-shrink-0"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-400 italic">No errors</span>
                        )}
                      </div>
                    </td>

                    {/* Category Scores */}
                    {afdData?.categories.map((category) => {
                      const catScore = getCategoryScore(row, category.qc_afd_id);
                      
                      return (
                        <td
                          key={category.qc_afd_id}
                          className="px-4 py-4 text-center border-r border-slate-200"
                        >
                          <span
                            className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg font-bold text-sm min-w-[60px] ${
                              catScore === 100
                                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                : catScore >= 80
                                ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                                : 'bg-red-100 text-red-700 border-2 border-red-300'
                            }`}
                          >
                            {catScore}%
                          </span>
                        </td>
                      );
                    })}

                    {/* Record Score */}
                    <td className="px-4 py-4 text-center border-r border-slate-200">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg font-bold text-sm min-w-[60px] ${
                          recordScore >= 80
                            ? 'bg-green-100 text-green-700 border-2 border-green-300'
                            : recordScore >= 60
                            ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                            : 'bg-red-100 text-red-700 border-2 border-red-300'
                        }`}
                      >
                        {recordScore.toFixed(0)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all shadow-md"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Submit QC Form
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QCFormPage;
