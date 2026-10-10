import React, { useState, useEffect } from 'react';
import { X, Building2 } from 'lucide-react';
import { teacherSubjectsOptions, allAssignableClasses } from '@/data/teacherData';

export const TeacherFormModal = ({ isOpen, teacherToEdit, onClose, onSave }) => {
  const isEditing = Boolean(teacherToEdit);

  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    email: '',
    phone: '',
    qualification: '',
    experience: '',
    assignedClasses: [],
  });

  const [errors, setErrors] = useState({});

  // Reset or populate form state when modal opens or teacherToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (teacherToEdit) {
        setFormData({
          name: teacherToEdit.name || '',
          subject: teacherToEdit.subject || '',
          email: teacherToEdit.email || '',
          phone: teacherToEdit.phone || '',
          qualification: teacherToEdit.qualification || '',
          experience: teacherToEdit.experience || '',
          assignedClasses: teacherToEdit.assignedClasses ? [...teacherToEdit.assignedClasses] : [],
        });
      } else {
        setFormData({
          name: '',
          subject: '',
          email: '',
          phone: '',
          qualification: '',
          experience: '',
          assignedClasses: [],
        });
      }
      setErrors({});
    }
  }, [isOpen, teacherToEdit]);

  if (!isOpen) return null;

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Toggle Class Chip Selection
  const toggleClassSelection = (cls) => {
    setFormData((prev) => {
      const exists = prev.assignedClasses.includes(cls);
      const updated = exists
        ? prev.assignedClasses.filter((c) => c !== cls)
        : [...prev.assignedClasses, cls];
      return { ...prev, assignedClasses: updated };
    });
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Full Name is required.';
    }
    if (!formData.subject) {
      newErrors.subject = 'Subject is required.';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSave({
      ...(teacherToEdit || {}),
      name: formData.name.trim(),
      subject: formData.subject,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      qualification: formData.qualification.trim(),
      experience: formData.experience.trim(),
      assignedClasses: formData.assignedClasses,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative max-h-[90vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <h2 className="text-xl font-extrabold text-slate-900">
            {isEditing ? 'Edit Teacher' : 'Add New Teacher'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full name"
                className={`w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                  errors.name
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-rose-500 font-medium">{errors.name}</p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                  errors.subject
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                }`}
              >
                <option value="">Select subject...</option>
                {teacherSubjectsOptions.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
              {errors.subject && (
                <p className="text-xs text-rose-500 font-medium">{errors.subject}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className={`w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                  errors.email
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                }`}
              />
              {errors.email && (
                <p className="text-xs text-rose-500 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone"
                className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
              />
            </div>

            {/* Qualification */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Qualification
              </label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                placeholder="e.g. BSc, MSc"
                className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
              />
            </div>

            {/* Experience */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Experience
              </label>
              <input
                type="text"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="e.g. 5 years"
                className="w-full px-4 py-2.5 rounded-2xl text-xs sm:text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Assign Classes Area */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#FF6B2C]" />
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assign Classes
              </label>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50">
              <div className="flex flex-wrap gap-2">
                {allAssignableClasses.map((cls) => {
                  const isSelected = formData.assignedClasses.includes(cls);
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => toggleClassSelection(cls)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF6B2C] text-white border border-[#FF6B2C] shadow-xs'
                          : 'bg-white text-slate-700 border border-orange-200 hover:border-orange-300'
                      }`}
                    >
                      {cls}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] text-white font-semibold text-xs rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-colors cursor-pointer"
            >
              {isEditing ? 'Save Changes' : 'Add Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
