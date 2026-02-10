import React, { useState } from 'react';
import { FileText, Plus, Edit2, Trash2, Search, X, Save, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AFDManagement = () => {
  const [afdRecords, setAfdRecords] = useState([
    {
      id: 1,
      name: 'Quality Control Checklist',
      categories: [
        {
          id: 1,
          name: 'Documentation',
          score: 40,
          subCategories: [
            { id: 1, name: 'Code Comments', score: 15 },
            { id: 2, name: 'API Documentation', score: 25 }
          ]
        },
        {
          id: 2,
          name: 'Testing',
          score: 60,
          subCategories: [
            { id: 1, name: 'Unit Tests', score: 30 },
            { id: 2, name: 'Integration Tests', score: 40 },
            { id: 3, name: 'E2E Tests', score: 30 }
          ]
        }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [editingRecordId, setEditingRecordId] = useState(null);
  
  // Form state
  const [afdName, setAfdName] = useState('');
  const [categories, setCategories] = useState([
    {
      id: Date.now(),
      name: '',
      score: 0,
      subCategories: [{ id: Date.now(), name: '', score: 0 }]
    }
  ]);

  // Add new category
  const addCategory = () => {
    setCategories([
      ...categories,
      {
        id: Date.now(),
        name: '',
        score: 0,
        subCategories: [{ id: Date.now() + 1, name: '', score: 0 }]
      }
    ]);
  };

  // Remove category
  const removeCategory = (categoryId) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
  };

  // Update category
  const updateCategory = (categoryId, field, value) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId ? { ...cat, [field]: field === 'score' ? Number(value) || 0 : value } : cat
    ));
  };

  // Add subcategory
  const addSubCategory = (categoryId) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, subCategories: [...cat.subCategories, { id: Date.now(), name: '', score: 0 }] }
        : cat
    ));
  };

  // Remove subcategory
  const removeSubCategory = (categoryId, subCategoryId) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? { ...cat, subCategories: cat.subCategories.filter(sub => sub.id !== subCategoryId) }
        : cat
    ));
  };

  // Update subcategory
  const updateSubCategory = (categoryId, subCategoryId, field, value) => {
    setCategories(categories.map(cat =>
      cat.id === categoryId
        ? {
            ...cat,
            subCategories: cat.subCategories.map(sub =>
              sub.id === subCategoryId
                ? { ...sub, [field]: field === 'score' ? Number(value) || 0 : value }
                : sub
            )
          }
        : cat
    ));
  };

  // Calculate totals
  const getTotalCategoryScore = () => {
    return categories.reduce((sum, cat) => sum + (Number(cat.score) || 0), 0);
  };

  const getSubCategoryTotal = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.subCategories.reduce((sum, sub) => sum + (Number(sub.score) || 0), 0) : 0;
  };

  // Validate and save AFD
  const handleSaveAFD = () => {
    // Validation
    if (!afdName.trim()) {
      toast.error('AFD Name is required');
      return;
    }

    if (categories.length === 0) {
      toast.error('At least one category is required');
      return;
    }

    // Check if all categories have names
    const emptyCategoryNames = categories.some(cat => !cat.name.trim());
    if (emptyCategoryNames) {
      toast.error('All categories must have a name');
      return;
    }

    // Check total category score
    const totalCategoryScore = getTotalCategoryScore();
    if (totalCategoryScore !== 100) {
      toast.error(`Total category score must be 100 (currently ${totalCategoryScore})`);
      return;
    }

    // Check each category's subcategories
    for (const category of categories) {
      const emptySubNames = category.subCategories.some(sub => !sub.name.trim());
      if (emptySubNames) {
        toast.error(`All subcategories in "${category.name}" must have a name`);
        return;
      }

      const subTotal = getSubCategoryTotal(category.id);
      if (subTotal !== 100) {
        toast.error(`Subcategory total for "${category.name}" must be 100 (currently ${subTotal})`);
        return;
      }
    }

    // Save or update
    if (editingRecordId) {
      setAfdRecords(afdRecords.map(rec =>
        rec.id === editingRecordId
          ? { ...rec, name: afdName, categories: JSON.parse(JSON.stringify(categories)) }
          : rec
      ));
      toast.success('AFD updated successfully!');
      setEditingRecordId(null);
    } else {
      const newRecord = {
        id: Date.now(),
        name: afdName,
        categories: JSON.parse(JSON.stringify(categories))
      };
      setAfdRecords([...afdRecords, newRecord]);
      toast.success('AFD added successfully!');
    }

    // Reset form
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setAfdName('');
    setCategories([
      {
        id: Date.now(),
        name: '',
        score: 0,
        subCategories: [{ id: Date.now() + 1, name: '', score: 0 }]
      }
    ]);
    setEditingRecordId(null);
  };

  // Edit AFD
  const handleEditAFD = (record) => {
    setAfdName(record.name);
    setCategories(JSON.parse(JSON.stringify(record.categories)));
    setEditingRecordId(record.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete AFD
  const handleDeleteAFD = (record) => {
    setRecordToDelete(record);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      setAfdRecords(afdRecords.filter(rec => rec.id !== recordToDelete.id));
      toast.success('AFD deleted successfully!');
      setShowDeleteModal(false);
      setRecordToDelete(null);
    }
  };

  const filteredRecords = afdRecords.filter(rec =>
    rec.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">AFD Management</h2>
              <p className="text-blue-100 text-sm mt-1">Application for Development - Categories & Scoring</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
            <FileText className="w-5 h-5" />
            <span className="font-semibold">{afdRecords.length} AFD Records</span>
          </div>
        </div>
      </div>

      {/* AFD Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            {editingRecordId ? 'Edit AFD' : 'Create New AFD'}
          </h3>
          {editingRecordId && (
            <button
              onClick={resetForm}
              className="text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel Edit
            </button>
          )}
        </div>

        {/* AFD Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            AFD Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={afdName}
            onChange={(e) => setAfdName(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Quality Control Checklist"
          />
        </div>

        {/* Categories Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-700 flex items-center gap-2">
              Categories
              <span className={`text-xs px-2 py-1 rounded-full ${
                getTotalCategoryScore() === 100 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                Total: {getTotalCategoryScore()}/100
              </span>
            </h4>
            <button
              onClick={addCategory}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          {categories.map((category, catIndex) => {
            const subTotal = getSubCategoryTotal(category.id);
            return (
              <div key={category.id} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
                {/* Category Header */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Category Name <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        placeholder="Category name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Category Score <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="number"
                        value={category.score}
                        onChange={(e) => updateCategory(category.id, 'score', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        placeholder="Score"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeCategory(category.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-5"
                    title="Remove Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Subcategories */}
                <div className="ml-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                      Subcategories
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        subTotal === 100 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {subTotal}/100
                      </span>
                    </label>
                    <button
                      onClick={() => addSubCategory(category.id)}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add Sub
                    </button>
                  </div>

                  {category.subCategories.map((subCategory, subIndex) => (
                    <div key={subCategory.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={subCategory.name}
                          onChange={(e) => updateSubCategory(category.id, subCategory.id, 'name', e.target.value)}
                          className="px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Subcategory name"
                        />
                        <input
                          type="number"
                          value={subCategory.score}
                          onChange={(e) => updateSubCategory(category.id, subCategory.id, 'score', e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="px-3 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="Score"
                          min="0"
                          max="100"
                        />
                      </div>
                      <button
                        onClick={() => removeSubCategory(category.id, subCategory.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove Subcategory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          {editingRecordId && (
            <button
              onClick={resetForm}
              className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSaveAFD}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {editingRecordId ? 'Update AFD' : 'Save AFD'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search AFD records by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* AFD Records List */}
      <div className="space-y-4">
        {filteredRecords.map(record => (
          <div key={record.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  {record.name}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {record.categories.length} Categories
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditAFD(record)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteAFD(record)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Categories Display */}
            <div className="space-y-3">
              {record.categories.map(category => (
                <div key={category.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-700">{category.name}</span>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                      {category.score} points
                    </span>
                  </div>
                  <div className="ml-4 space-y-1">
                    {category.subCategories.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">• {sub.name}</span>
                        <span className="text-slate-500 font-medium">{sub.score} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filteredRecords.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-600 mb-2">No AFD records found</h3>
            <p className="text-slate-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first AFD using the form above'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && recordToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Delete AFD Record
              </h2>
              <button onClick={() => {
                setShowDeleteModal(false);
                setRecordToDelete(null);
              }}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete
              <span className="font-semibold text-slate-800"> {recordToDelete.name}</span>?
            </p>
            <p className="text-xs text-red-500 mt-2">
              This action cannot be undone. All categories and subcategories will be deleted.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setRecordToDelete(null);
                }}
                className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AFDManagement;
