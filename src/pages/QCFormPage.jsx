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
import AppLayout from '../layouts/AppLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const QCFormPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const trackerData = location.state?.tracker;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data from API
  const [formData, setFormData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState({});
  
  // Form state
  const [formRows, setFormRows] = useState([]);
  const [totalScore, setTotalScore] = useState(0);

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

      // TODO: Replace with actual API endpoint
      // const response = await api.get(`/qc/form/${trackerData.tracker_id}`);
      
      // MOCK DATA: Simulating API response
      const mockResponse = {
        formData: [
          { id: 1, field1: 'John Doe', field2: 'Active', field3: '2024-01-15' },
          { id: 2, field1: 'Jane Smith', field2: 'Completed', field3: '2024-01-16' },
          { id: 3, field1: 'Bob Wilson', field2: 'Pending', field3: '2024-01-17' },
          { id: 4, field1: 'Alice Johnson', field2: 'Active', field3: '2024-01-18' },
          { id: 5, field1: 'Charlie Brown', field2: 'Completed', field3: '2024-01-19' }
        ],
        categories: [
          { id: 1, name: 'Data Quality' },
          { id: 2, name: 'Completeness' },
          { id: 3, name: 'Accuracy' },
          { id: 4, name: 'Format' }
        ],
        subCategories: {
          1: [
            { id: 11, name: 'Missing Fields', score: 5 },
            { id: 12, name: 'Invalid Data', score: 10 },
            { id: 13, name: 'Duplicate Entries', score: 15 }
          ],
          2: [
            { id: 21, name: 'Partial Information', score: 8 },
            { id: 22, name: 'Incomplete Records', score: 12 }
          ],
          3: [
            { id: 31, name: 'Wrong Values', score: 20 },
            { id: 32, name: 'Calculation Errors', score: 15 }
          ],
          4: [
            { id: 41, name: 'Date Format', score: 5 },
            { id: 42, name: 'Text Format', score: 5 }
          ]
        }
      };

      setFormData(mockResponse.formData);
      setCategories(mockResponse.categories);
      setSubCategories(mockResponse.subCategories);

      // Initialize form rows
      const initialRows = mockResponse.formData.map((data, index) => ({
        id: data.id,
        categoryId: null,
        subCategoryId: null,
        score: 0,
        originalData: data
      }));
      setFormRows(initialRows);

    } catch (err) {
      console.error('[QCFormPage] Error fetching form data:', err);
      setError(err.message || 'Failed to load QC form data');
      toast.error('Failed to load form data');
    } finally {
      setLoading(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (rowIndex, categoryId) => {
    const updatedRows = [...formRows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      categoryId: categoryId ? parseInt(categoryId) : null,
      subCategoryId: null, // Reset subcategory when category changes
      score: 0
    };
    setFormRows(updatedRows);
    calculateTotalScore(updatedRows);
  };

  // Handle subcategory change
  const handleSubCategoryChange = (rowIndex, subCategoryId) => {
    const updatedRows = [...formRows];
    const categoryId = updatedRows[rowIndex].categoryId;
    
    if (categoryId && subCategoryId) {
      const selectedSubCategory = subCategories[categoryId]?.find(
        sub => sub.id === parseInt(subCategoryId)
      );
      
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        subCategoryId: parseInt(subCategoryId),
        score: selectedSubCategory?.score || 0
      };
    } else {
      updatedRows[rowIndex] = {
        ...updatedRows[rowIndex],
        subCategoryId: null,
        score: 0
      };
    }
    
    setFormRows(updatedRows);
    calculateTotalScore(updatedRows);
  };

  // Calculate total score
  const calculateTotalScore = (rows) => {
    const total = rows.reduce((sum, row) => sum + (row.score || 0), 0);
    setTotalScore(total);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSaving(true);

      // Validate that all rows have selections
      const incompleteRows = formRows.filter(row => !row.categoryId || !row.subCategoryId);
      if (incompleteRows.length > 0) {
        toast.error('Please complete all rows before submitting');
        return;
      }

      // TODO: Replace with actual API call
      // const response = await api.post('/qc/form/submit', {
      //   tracker_id: trackerData.tracker_id,
      //   rows: formRows,
      //   total_score: totalScore
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
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <ErrorMessage message="No tracker data available" />
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <ErrorMessage message={error} />
        </div>
      </AppLayout>
    );
  }

  // Get the first three keys from the first data object for dynamic columns
  const dynamicKeys = formData.length > 0 ? Object.keys(formData[0]).filter(key => key !== 'id').slice(0, 3) : [];

  return (
    <AppLayout>
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
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8" />
            QC Form
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

        {/* Score Display */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-md p-4 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Total Score</p>
                <p className="text-2xl font-bold text-purple-800">
                  {totalScore} <span className="text-lg text-purple-600">/ 100</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="w-20 h-20 rounded-full border-4 border-purple-600 flex items-center justify-center bg-white">
                <span className="text-xl font-bold text-purple-600">{totalScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic QC Form Table */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-bold text-white uppercase tracking-wider border-r border-blue-500">
                    Sr. No.
                  </th>
                  {dynamicKeys.map((key, index) => (
                    <th
                      key={index}
                      className="px-4 py-4 text-left text-sm font-bold text-white uppercase tracking-wider border-r border-blue-500"
                    >
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                  <th className="px-4 py-4 text-left text-sm font-bold text-white uppercase tracking-wider border-r border-blue-500">
                    Category
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-white uppercase tracking-wider border-r border-blue-500">
                    Sub Category
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {formRows.map((row, rowIndex) => (
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

                    {/* Category Dropdown */}
                    <td className="px-4 py-4 border-r border-slate-200">
                      <select
                        value={row.categoryId || ''}
                        onChange={(e) => handleCategoryChange(rowIndex, e.target.value)}
                        className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Sub Category Dropdown */}
                    <td className="px-4 py-4 border-r border-slate-200">
                      <select
                        value={row.subCategoryId || ''}
                        onChange={(e) => handleSubCategoryChange(rowIndex, e.target.value)}
                        disabled={!row.categoryId}
                        className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed text-sm"
                      >
                        <option value="">Select Sub Category</option>
                        {row.categoryId &&
                          subCategories[row.categoryId]?.map((subCat) => (
                            <option key={subCat.id} value={subCat.id}>
                              {subCat.name} ({subCat.score} pts)
                            </option>
                          ))}
                      </select>
                    </td>

                    {/* Score Display */}
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-4 py-2 rounded-lg font-bold text-sm min-w-[60px] ${
                          row.score > 0
                            ? 'bg-red-100 text-red-700 border-2 border-red-300'
                            : 'bg-slate-100 text-slate-500 border-2 border-slate-300'
                        }`}
                      >
                        {row.score || 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              
              {/* Footer with Total */}
              <tfoot className="bg-slate-100">
                <tr>
                  <td
                    colSpan={dynamicKeys.length + 3}
                    className="px-4 py-4 text-right text-sm font-bold text-slate-700 uppercase"
                  >
                    Total Deduction:
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-bold text-lg bg-red-200 text-red-800 border-2 border-red-400 min-w-[60px]">
                      {totalScore}
                    </span>
                  </td>
                </tr>
              </tfoot>
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
            disabled={saving || formRows.some(row => !row.categoryId || !row.subCategoryId)}
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
    </AppLayout>
  );
};

export default QCFormPage;
