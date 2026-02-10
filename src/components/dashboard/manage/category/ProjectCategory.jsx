import React, { useState } from 'react';
import { FolderKanban, Plus, Edit2, Trash2, Search, Save, X, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CustomSelect from '../../../common/CustomSelect';

const ProjectCategory = () => {
  const [categories, setCategories] = useState([
    { id: 1, name: 'Web Development', afdName: 'Project Requirement Document' },
    { id: 2, name: 'Mobile Development', afdName: 'Technical Specification' },
    { id: 3, name: 'Data Entry', afdName: 'API Documentation' },
    { id: 4, name: 'Quality Assurance', afdName: 'Testing Guidelines' },
    { id: 5, name: 'Design', afdName: 'Design Standards' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    afdName: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // AFD options based on AFD Management records
  const afdOptions = [
    { value: 'Project Requirement Document', label: 'Project Requirement Document' },
    { value: 'Technical Specification', label: 'Technical Specification' },
    { value: 'API Documentation', label: 'API Documentation' },
    { value: 'Design Standards', label: 'Design Standards' },
    { value: 'Testing Guidelines', label: 'Testing Guidelines' },
    { value: 'Deployment Guide', label: 'Deployment Guide' },
    { value: 'Security Guidelines', label: 'Security Guidelines' },
    { value: 'User Manual', label: 'User Manual' },
  ];

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    }
    if (!formData.afdName) {
      errors.afdName = 'AFD Name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddCategory = () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newCategory = {
      id: Date.now(),
      name: formData.name.trim(),
      afdName: formData.afdName
    };

    setCategories([newCategory, ...categories]);
    setFormData({ name: '', afdName: '' });
    setFormErrors({});
    toast.success('Category added successfully!');
  };

  const handleEditClick = (category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      afdName: category.afdName
    });
    setFormErrors({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', afdName: '' });
    setFormErrors({});
  };

  const handleSaveEdit = () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCategories(categories.map(cat =>
      cat.id === editingId
        ? {
            ...cat,
            name: formData.name.trim(),
            afdName: formData.afdName
          }
        : cat
    ));

    setEditingId(null);
    setFormData({ name: '', afdName: '' });
    setFormErrors({});
    toast.success('Category updated successfully!');
  };

  const handleDeleteCategory = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      setCategories(categories.filter(cat => cat.id !== categoryToDelete.id));
      toast.success('Category deleted successfully!');
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.afdName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <FolderKanban className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Project Categories</h2>
              <p className="text-blue-100 text-sm mt-1">Create and manage your project categories</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
            <FolderKanban className="w-5 h-5" />
            <span className="font-semibold">{categories.length} Categories</span>
          </div>
        </div>
      </div>

      {/* Add Category Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Plus className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Add New Category</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Category Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setFormErrors({ ...formErrors, name: '' });
              }}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                formErrors.name ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="e.g., Web Development"
            />
            {formErrors.name && (
              <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              AFD Name <span className="text-red-600">*</span>
            </label>
            <CustomSelect
              value={formData.afdName}
              onChange={(value) => {
                setFormData({ ...formData, afdName: value });
                setFormErrors({ ...formErrors, afdName: '' });
              }}
              options={afdOptions}
              icon={FileText}
              placeholder="Select AFD"
              className={formErrors.afdName ? 'ring-2 ring-red-500' : ''}
            />
            {formErrors.afdName && (
              <p className="text-xs text-red-600 mt-1">{formErrors.afdName}</p>
            )}
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddCategory}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Category
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories by name or AFD name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Sr. No.
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Category Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  AFD Name
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCategories.map((category, index) => (
                <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === category.id ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          setFormErrors({ ...formErrors, name: '' });
                        }}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          formErrors.name ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                    ) : (
                      <span className="text-sm font-semibold text-slate-800">{category.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === category.id ? (
                      <CustomSelect
                        value={formData.afdName}
                        onChange={(value) => {
                          setFormData({ ...formData, afdName: value });
                          setFormErrors({ ...formErrors, afdName: '' });
                        }}
                        options={afdOptions}
                        icon={FileText}
                        placeholder="Select AFD"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm text-slate-700 font-medium">{category.afdName}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {editingId === category.id ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditClick(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCategories.length === 0 && (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <FolderKanban className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-600 mb-2">No categories found</h3>
            <p className="text-slate-500 text-sm">
              {searchTerm ? 'Try adjusting your search terms' : 'Add your first category using the form above'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                Delete Category
              </h2>
              <button onClick={() => {
                setShowDeleteModal(false);
                setCategoryToDelete(null);
              }}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete
              <span className="font-semibold text-slate-800"> {categoryToDelete.name}</span>?
            </p>
            <p className="text-xs text-red-500 mt-2">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCategoryToDelete(null);
                }}
                className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
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

export default ProjectCategory;
