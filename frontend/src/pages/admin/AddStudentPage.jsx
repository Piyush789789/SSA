import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  User,
  Mail,
  Calendar,
  Phone,
  MapPin,
  GraduationCap,
  Users,
  Camera,
  UploadCloud,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { studentsData, DEFAULT_STUDENT_PROFILE } from '@/data/studentData';
import {
  FORM_CLASSES,
  FORM_SECTIONS,
  FORM_GENDERS,
  FORM_BLOOD_GROUPS,
  FORM_RELATIONSHIPS,
  FORM_ACADEMIC_YEARS,
  FORM_INDIAN_STATES,
} from '@/data/studentFormOptions';
import { ROUTES } from '@/constants/routes';

export const AddStudentPage = () => {
  const navigate = useNavigate();
  const [activeSidebarId, setActiveSidebarId] = useState('students');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Success Notification Toast State
  const [toastMessage, setToastMessage] = useState('');

  // Generate Demo Student ID
  const demoStudentId = `STU-2026-00${15 + studentsData.length + 1}`;

  // Today's date in YYYY-MM-DD for date input default
  const todayStr = new Date().toISOString().split('T')[0];

  // Form Field State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    dob: '',
    gender: '',
    bloodGroup: '',
    photoPreview: null,

    studentId: demoStudentId,
    rollNumber: '',
    className: '',
    section: '',
    admissionDate: todayStr,
    academicYear: '2026–27',

    parentName: '',
    relationship: 'Father',
    parentPhone: '',
    parentEmail: '',
    occupation: '',

    address: '',
    city: '',
    state: 'Uttar Pradesh',
    pinCode: '',

    emergencyName: '',
    emergencyPhone: '',
    previousSchool: '',
    medicalNotes: '',
    remarks: '',
  });

  // Validation Error State
  const [errors, setErrors] = useState({});

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for field once edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Photo upload handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          photo: 'Only JPG, JPEG, and PNG images are allowed.',
        }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photoPreview: reader.result }));
        setErrors((prev) => ({ ...prev, photo: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Form Validation logic
  const validateForm = () => {
    const newErrors = {};

    // Basic Info
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required.';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.dob) newErrors.dob = 'Date of Birth is required.';
    if (!formData.gender) newErrors.gender = 'Gender is required.';

    // Academic Info
    if (!formData.rollNumber || Number(formData.rollNumber) <= 0) {
      newErrors.rollNumber = 'Roll Number must be a positive number.';
    }
    if (!formData.className) newErrors.className = 'Class is required.';
    if (!formData.section) newErrors.section = 'Section is required.';
    if (!formData.admissionDate) newErrors.admissionDate = 'Admission Date is required.';
    if (!formData.academicYear) newErrors.academicYear = 'Academic Year is required.';

    // Parent Info
    if (!formData.parentName.trim()) newErrors.parentName = 'Parent / Guardian Name is required.';
    if (!formData.relationship) newErrors.relationship = 'Relationship is required.';
    if (!formData.parentPhone.trim()) {
      newErrors.parentPhone = 'Parent Phone is required.';
    } else if (!/^[6-9]\d{9}$/.test(formData.parentPhone.replace(/\D/g, ''))) {
      newErrors.parentPhone = 'Parent Phone must be a valid 10-digit number.';
    }
    if (formData.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) {
      newErrors.parentEmail = 'Please enter a valid parent email address.';
    }

    // Address Info
    if (!formData.address.trim()) newErrors.address = 'Address is required.';
    if (!formData.city.trim()) newErrors.city = 'City is required.';
    if (!formData.state) newErrors.state = 'State is required.';
    if (!formData.pinCode.trim()) {
      newErrors.pinCode = 'PIN Code is required.';
    } else if (!/^\d{6}$/.test(formData.pinCode.trim())) {
      newErrors.pinCode = 'PIN Code must contain exactly 6 digits.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Format initials
    const nameParts = formData.fullName.trim().split(' ');
    const initials =
      nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : nameParts[0].slice(0, 2).toUpperCase();

    // Create new student object
    const newStudent = {
      id: Date.now(),
      name: formData.fullName.trim(),
      initials: initials,
      email: formData.email.trim() || `stu${formData.rollNumber}@student.example`,
      className: `${formData.className}-${formData.section}`,
      rollNumber: parseInt(formData.rollNumber, 10),
      attendance: 100,
      feeStatus: 'paid',
      ...DEFAULT_STUDENT_PROFILE,
      studentId: formData.studentId,
      dob: formData.dob,
      gender: formData.gender,
      bloodGroup: formData.bloodGroup || 'A+',
      address: `${formData.address}, ${formData.city}, ${formData.state} - ${formData.pinCode}`,
      parent: {
        name: formData.parentName.trim(),
        relation: formData.relationship,
        phone: formData.parentPhone.trim(),
        email: formData.parentEmail.trim() || 'parent@example.com',
      },
    };

    // Add to session mock state
    studentsData.unshift(newStudent);

    // Show toast message
    setToastMessage('Student created successfully.');

    // Navigate back to students list after brief delay
    setTimeout(() => {
      navigate(ROUTES.ADMIN_STUDENTS);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-900 antialiased flex flex-col relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar Component */}
      <Sidebar
        activeItemId={activeSidebarId}
        onItemSelect={setActiveSidebarId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-[310px] flex-1 flex flex-col transition-all duration-300">
        <DashboardHeader onToggleSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto pb-16">
          {/* Back Navigation Link */}
          <button
            type="button"
            onClick={() => navigate(ROUTES.ADMIN_STUDENTS)}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
          >
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Students</span>
          </button>

          {/* Page Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Add New Student
            </h1>
            <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1">
              Create a new student record
            </p>
          </div>

          {/* Main Form Card */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 lg:p-10 space-y-10"
          >
            {/* ========================================== */}
            {/* SECTION 1: BASIC INFORMATION               */}
            {/* ========================================== */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold text-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Basic Information
                  </h2>
                  <p className="text-xs text-slate-500">
                    Personal and contact details of the student
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter student's full name"
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      errors.fullName
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Student Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Student Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@example.com"
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      errors.email
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      errors.dob
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  />
                  {errors.dob && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.dob}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                      errors.gender
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  >
                    <option value="">Select Gender</option>
                    {FORM_GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  {errors.gender && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.gender}
                    </p>
                  )}
                </div>

                {/* Blood Group */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">Select Blood Group</option>
                    {FORM_BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Student Photo Upload */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Student Photo
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    {/* Photo Preview Box */}
                    <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                      {formData.photoPreview ? (
                        <img
                          src={formData.photoPreview}
                          alt="Student Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-xs rounded-xl shadow-xs cursor-pointer transition-all">
                        <UploadCloud className="w-4 h-4 text-slate-500" />
                        <span>Click to choose file</span>
                        <input
                          type="file"
                          accept="image/jpeg, image/jpg, image/png"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-slate-400">
                        Supports JPG, JPEG, PNG (Max 5MB)
                      </p>
                      {errors.photo && (
                        <p className="text-xs text-rose-500 font-medium">
                          {errors.photo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* SECTION 2: ACADEMIC INFORMATION            */}
            {/* ========================================== */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold text-sm">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Academic Information
                  </h2>
                  <p className="text-xs text-slate-500">
                    School enrollment, class, and roll details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Student ID (Read-Only) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Student ID
                  </label>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    readOnly
                    className="w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 bg-slate-100 text-slate-500 font-semibold cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400">
                    Auto-generated system ID
                  </p>
                </div>

                {/* Roll Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Roll Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    name="rollNumber"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    placeholder="Enter roll number"
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      errors.rollNumber
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  />
                  {errors.rollNumber && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.rollNumber}
                    </p>
                  )}
                </div>

                {/* Class */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                      errors.className
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  >
                    <option value="">Select Class</option>
                    {FORM_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.className && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.className}
                    </p>
                  )}
                </div>

                {/* Section */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Section <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                      errors.section
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  >
                    <option value="">Select Section</option>
                    {FORM_SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                  {errors.section && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.section}
                    </p>
                  )}
                </div>

                {/* Admission Date */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Admission Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="admissionDate"
                    value={formData.admissionDate}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      errors.admissionDate
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  />
                  {errors.admissionDate && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.admissionDate}
                    </p>
                  )}
                </div>

                {/* Academic Year */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Academic Year <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                      errors.academicYear
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  >
                    {FORM_ACADEMIC_YEARS.map((ay) => (
                      <option key={ay} value={ay}>
                        {ay}
                      </option>
                    ))}
                  </select>
                  {errors.academicYear && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.academicYear}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* SECTION 3: PARENT / GUARDIAN INFORMATION   */}
            {/* ========================================== */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold text-sm">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Parent / Guardian Information
                  </h2>
                  <p className="text-xs text-slate-500">
                    Primary guardian contact details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Parent Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Parent / Guardian Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleChange}
                    placeholder="Enter parent's full name"
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      errors.parentName
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  />
                  {errors.parentName && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.parentName}
                    </p>
                  )}
                </div>

                {/* Relationship */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Relationship <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                      errors.relationship
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  >
                    {FORM_RELATIONSHIPS.map((rel) => (
                      <option key={rel} value={rel}>
                        {rel}
                      </option>
                    ))}
                  </select>
                  {errors.relationship && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.relationship}
                    </p>
                  )}
                </div>

                {/* Parent Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Parent Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleChange}
                    placeholder="Enter 10-digit phone number"
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      errors.parentPhone
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  />
                  {errors.parentPhone && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.parentPhone}
                    </p>
                  )}
                </div>

                {/* Parent Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Parent Email
                  </label>
                  <input
                    type="email"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleChange}
                    placeholder="parent@example.com"
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      errors.parentEmail
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  />
                  {errors.parentEmail && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.parentEmail}
                    </p>
                  )}
                </div>

                {/* Occupation */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Occupation
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={formData.occupation}
                    onChange={handleChange}
                    placeholder="Enter occupation (e.g. Business, Engineer, Doctor)"
                    className="w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* SECTION 4: ADDRESS INFORMATION             */}
            {/* ========================================== */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold text-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Address Information
                  </h2>
                  <p className="text-xs text-slate-500">
                    Residential address details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Address Textarea */}
                <div className="space-y-1.5 md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Address <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter complete residential address"
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      errors.address
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  />
                  {errors.address && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.address}
                    </p>
                  )}
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city (e.g. Meerut)"
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      errors.city
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  />
                  {errors.city && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.city}
                    </p>
                  )}
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                      errors.state
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  >
                    <option value="">Select State</option>
                    {FORM_INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.state}
                    </p>
                  )}
                </div>

                {/* PIN Code */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    PIN Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleChange}
                    placeholder="Enter 6-digit PIN code"
                    className={`w-full px-4 py-3 rounded-2xl text-sm border bg-slate-50/30 text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      errors.pinCode
                        ? 'border-rose-400 focus:ring-rose-200'
                        : 'border-slate-200 focus:border-[#FF6B2C] focus:ring-orange-100'
                    }`}
                  />
                  {errors.pinCode && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      {errors.pinCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* SECTION 5: ADDITIONAL INFORMATION          */}
            {/* ========================================== */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF6B2C] flex items-center justify-center font-bold text-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Additional Information
                  </h2>
                  <p className="text-xs text-slate-500">
                    Emergency contacts, previous school & medical remarks (Optional)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Emergency Contact Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Emergency Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergencyName"
                    value={formData.emergencyName}
                    onChange={handleChange}
                    placeholder="Emergency contact person"
                    className="w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
                  />
                </div>

                {/* Emergency Contact Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    placeholder="Emergency contact number"
                    className="w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
                  />
                </div>

                {/* Previous School */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Previous School Name
                  </label>
                  <input
                    type="text"
                    name="previousSchool"
                    value={formData.previousSchool}
                    onChange={handleChange}
                    placeholder="Name of last attended school (if any)"
                    className="w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
                  />
                </div>

                {/* Medical Notes */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Medical Notes / Allergies
                  </label>
                  <textarea
                    rows={2}
                    name="medicalNotes"
                    value={formData.medicalNotes}
                    onChange={handleChange}
                    placeholder="Specify any medical conditions or dietary requirements"
                    className="w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
                  />
                </div>

                {/* Remarks */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Remarks / Additional Notes
                  </label>
                  <textarea
                    rows={2}
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    placeholder="Any general remarks or comments"
                    className="w-full px-4 py-3 rounded-2xl text-sm border border-slate-200 bg-slate-50/30 text-slate-900 focus:border-[#FF6B2C] focus:ring-2 focus:ring-orange-100 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* ACTION BUTTONS                             */}
            {/* ========================================== */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-4 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_STUDENTS)}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold text-sm rounded-2xl transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-[#FF6B2C] hover:bg-[#F25A1B] active:bg-[#D94E13] text-white font-semibold text-sm rounded-2xl shadow-md shadow-[#FF6B2C]/20 transition-all cursor-pointer"
              >
                Create Student
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AddStudentPage;
