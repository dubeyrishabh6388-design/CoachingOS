'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import {
  X,
  ClipboardPaste,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Download,
  Sparkles,
  ArrowRight,
  Layers,
  GraduationCap,
  Users
} from 'lucide-react';

interface ParsedStudent {
  id: string;
  fullName: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  grade: string;
  targetExam: string;
  gender: string;
  feeAmount?: number;
  isValid: boolean;
  error?: string;
}

interface QuickAddStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingBatches: Array<{ id: string; name: string }>;
}

export default function QuickAddStudentsModal({
  isOpen,
  onClose,
  onSuccess,
  existingBatches,
}: QuickAddStudentsModalProps) {
  const { currentOrg, currentBranch, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'grid'>('paste');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    existingBatches[0]?.id || 'NEW_BATCH'
  );
  const [newBatchName, setNewBatchName] = useState<string>('Foundation Batch 2026-27');
  const [rawText, setRawText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample data for 1-click test
  const sampleData = `Aman Verma\t9829011122\tSuresh Verma\t9829011123\tClass 11\tJEE_NEET\nMukesh Patel\t9829022233\tDinesh Patel\t9829022234\tClass 12\tJEE_NEET\nSneha Sen\t9829033344\tPradeep Sen\t9829033345\tClass 11\tJEE_NEET\nRohan Roy\t9829044455\tSunil Roy\t9829044456\tClass 10\tFOUNDATION\nAnanya Das\t9829055566\tTarun Das\t9829055567\tClass 12\tJEE_NEET`;

  // Manual grid rows
  const [gridRows, setGridRows] = useState<ParsedStudent[]>([
    {
      id: 'row-1',
      fullName: '',
      phone: '',
      guardianName: '',
      guardianPhone: '',
      grade: 'Class 11',
      targetExam: 'JEE_NEET',
      gender: 'MALE',
      isValid: false,
    },
  ]);

  // Real-time Parser for Smart Paste & Upload
  const parsedFromText = useMemo<ParsedStudent[]>(() => {
    if (!rawText.trim()) return [];

    const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const results: ParsedStudent[] = [];

    lines.forEach((line, index) => {
      // Split by tab (Excel/Google Sheets) or comma
      const parts = line.includes('\t')
        ? line.split('\t').map((p) => p.trim())
        : line.split(',').map((p) => p.trim());

      // Remove quotation marks
      const cleanParts = parts.map((p) => p.replace(/^["']|["']$/g, ''));

      // Skip header line if detected
      if (
        index === 0 &&
        (cleanParts[0]?.toLowerCase().includes('name') ||
          cleanParts[1]?.toLowerCase().includes('phone'))
      ) {
        return;
      }

      const fullName = cleanParts[0] || '';
      const phone = cleanParts[1] || '';
      const guardianName = cleanParts[2] || (fullName ? `${fullName.split(' ')[0]}'s Guardian` : 'Guardian');
      const guardianPhone = cleanParts[3] || phone;
      const grade = cleanParts[4] || 'Class 11';
      const targetExam = cleanParts[5] || 'JEE_NEET';
      const feeAmount = cleanParts[6] ? parseFloat(cleanParts[6]) : undefined;

      const isValid = fullName.length >= 2;
      let error = '';
      if (!isValid) error = 'Name too short';

      results.push({
        id: `parsed-${index}`,
        fullName,
        phone,
        guardianName,
        guardianPhone,
        grade,
        targetExam,
        gender: 'MALE',
        feeAmount,
        isValid,
        error,
      });
    });

    return results;
  }, [rawText]);

  // Active student list based on active tab
  const activeStudentsList = useMemo(() => {
    if (activeTab === 'grid') {
      return gridRows.filter((r) => r.fullName.trim().length > 0);
    }
    return parsedFromText;
  }, [activeTab, gridRows, parsedFromText]);

  const validCount = useMemo(
    () => activeStudentsList.filter((s) => s.isValid).length,
    [activeStudentsList]
  );

  // Paste from clipboard handler
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawText(text);
        showToast('Pasted students from clipboard!', 'success');
      } else {
        showToast('Clipboard is empty', 'info');
      }
    } catch {
      showToast('Please press Ctrl+V into the text area', 'info');
    }
  };

  // Load sample data
  const handleLoadSample = () => {
    setRawText(sampleData);
    showToast('Loaded 5 sample students! Click Confirm to save.', 'info');
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setRawText(text);
        showToast(`Loaded ${file.name} successfully!`, 'success');
      }
    };
    reader.readAsText(file);
  };

  // Download template
  const handleDownloadTemplate = () => {
    const csvContent =
      'Full Name,Phone,Guardian Name,Guardian Phone,Grade,Target Exam,Annual Fee\n' +
      'Aman Sharma,9829012345,Suresh Sharma,9829012346,Class 11,JEE_NEET,75000\n' +
      'Priya Patel,9829023456,Ramesh Patel,9829023457,Class 12,JEE_NEET,85000\n' +
      'Rahul Verma,9829034567,Sunil Verma,9829034568,Class 10,FOUNDATION,60000\n';

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'CoachingOS_Student_Roster_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded sample CSV template', 'success');
  };

  // Grid row management
  const handleAddGridRow = () => {
    setGridRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}`,
        fullName: '',
        phone: '',
        guardianName: '',
        guardianPhone: '',
        grade: 'Class 11',
        targetExam: 'JEE_NEET',
        gender: 'MALE',
        isValid: false,
      },
    ]);
  };

  const handleUpdateGridRow = (
    index: number,
    field: keyof ParsedStudent,
    value: string
  ) => {
    setGridRows((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
        isValid: field === 'fullName' ? value.trim().length >= 2 : next[index].isValid,
      };
      return next;
    });
  };

  const handleDeleteGridRow = (index: number) => {
    setGridRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit to Backend
  const handleSubmit = async () => {
    const validStudents = activeStudentsList.filter((s) => s.isValid);

    if (validStudents.length === 0) {
      showToast('Please enter at least one student name', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        organizationId: currentOrg.id,
        branchId: currentBranch.id,
        defaultBatchId: selectedBatchId !== 'NEW_BATCH' ? selectedBatchId : undefined,
        defaultBatchName: selectedBatchId === 'NEW_BATCH' ? newBatchName : undefined,
        students: validStudents.map((s) => ({
          fullName: s.fullName,
          phone: s.phone || undefined,
          guardianName: s.guardianName || undefined,
          guardianPhone: s.guardianPhone || undefined,
          grade: s.grade,
          targetExam: s.targetExam,
          gender: s.gender,
          feeAmount: s.feeAmount,
        })),
        actorName: 'Director',
      };

      const res = await fetch('http://localhost:4000/api/v1/students/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();

      if (!res.ok) {
        throw new Error(resJson.error?.message || 'Failed to import students');
      }

      showToast(
        `🎉 Successfully enrolled ${validStudents.length} students into your database!`,
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      showToast(err.message || 'Import failed. Please retry.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-red-50/50 via-white to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#991b1b] text-white flex items-center justify-center shadow-sm">
              <ClipboardPaste className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Quick Add Multiple Students
                </h2>
                <span className="bg-red-100 text-[#991b1b] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Fastest Way
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Paste directly from Excel / WhatsApp or upload a spreadsheet in seconds.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Batch Target Assignment Strip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Layers className="w-3.5 h-3.5 text-[#991b1b]" />
            <span>Target Classroom Batch:</span>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#991b1b] focus:outline-none"
            >
              {existingBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
              <option value="NEW_BATCH">+ Auto-Create New Batch</option>
            </select>

            {selectedBatchId === 'NEW_BATCH' && (
              <input
                type="text"
                value={newBatchName}
                onChange={(e) => setNewBatchName(e.target.value)}
                placeholder="Batch Name (e.g. JEE 2026 Morning)"
                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#991b1b] focus:outline-none"
              />
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2">
          <button
            onClick={() => setActiveTab('paste')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-[#991b1b] text-[#991b1b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>1. Smart Paste (Excel / WhatsApp)</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-[#991b1b] text-[#991b1b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>2. Upload CSV / Excel</span>
          </button>

          <button
            onClick={() => setActiveTab('grid')}
            className={`py-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'grid'
                ? 'border-[#991b1b] text-[#991b1b]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>3. Fast Table Grid</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: SMART PASTE */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Copy rows from Excel, Google Sheets, or WhatsApp and paste them below:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-[#991b1b] text-[11px] font-bold rounded-md border border-red-200 transition"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Paste from Clipboard</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-md transition"
                  >
                    <Sparkles className="w-3 h-3 text-[#991b1b]" />
                    <span>Load 5 Demo Students</span>
                  </button>
                  {rawText && (
                    <button
                      type="button"
                      onClick={() => setRawText('')}
                      className="text-slate-400 hover:text-slate-600 text-[11px] font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Example 1 (Tab separated from Excel):&#10;Aman Sharma	9829012345	Suresh Sharma	9829012346	Class 11&#10;Priya Patel	9829023456	Ramesh Patel	9829023457	Class 12&#10;&#10;Example 2 (Comma separated):&#10;Rohit Verma, 9829034567, Sunil Verma, Class 10"
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#991b1b] focus:border-[#991b1b] focus:outline-none transition"
              />

              <div className="text-[11px] text-slate-400">
                💡 <span className="font-semibold text-slate-600">Pro-tip:</span> In
                Excel or Google Sheets, just highlight your columns (Name, Mobile,
                Parent, Phone), press <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-300">Ctrl+C</kbd>, click inside the box and press <kbd className="bg-slate-100 px-1 py-0.5 rounded border border-slate-300">Ctrl+V</kbd>.
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD CSV / EXCEL */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-[#991b1b] bg-slate-50/50 hover:bg-red-50/20 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 text-[#991b1b] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {fileName ? fileName : 'Click to upload or drag & drop CSV file'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Supports .csv, .txt spreadsheets with student rosters
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.txt"
                  className="hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 font-medium">
                  Need a pre-formatted Excel template?
                </span>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5 text-[#991b1b]" />
                  <span>Download Sample CSV Template</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FAST TABLE GRID */}
          {activeTab === 'grid' && (
            <div className="space-y-3">
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">Student Name *</th>
                        <th className="p-2.5">Mobile Phone</th>
                        <th className="p-2.5">Guardian Name</th>
                        <th className="p-2.5">Guardian Phone</th>
                        <th className="p-2.5">Class/Grade</th>
                        <th className="p-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {gridRows.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.fullName}
                              onChange={(e) =>
                                handleUpdateGridRow(idx, 'fullName', e.target.value)
                              }
                              placeholder="e.g. Rahul Sharma"
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-medium focus:ring-1 focus:ring-[#991b1b] focus:outline-none"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.phone}
                              onChange={(e) =>
                                handleUpdateGridRow(idx, 'phone', e.target.value)
                              }
                              placeholder="+91 98290..."
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#991b1b] focus:outline-none"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.guardianName}
                              onChange={(e) =>
                                handleUpdateGridRow(idx, 'guardianName', e.target.value)
                              }
                              placeholder="Father / Mother"
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#991b1b] focus:outline-none"
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={row.guardianPhone}
                              onChange={(e) =>
                                handleUpdateGridRow(idx, 'guardianPhone', e.target.value)
                              }
                              placeholder="+91 98290..."
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#991b1b] focus:outline-none"
                            />
                          </td>
                          <td className="p-1.5">
                            <select
                              value={row.grade}
                              onChange={(e) =>
                                handleUpdateGridRow(idx, 'grade', e.target.value)
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#991b1b] focus:outline-none"
                            >
                              <option value="Class 11">Class 11</option>
                              <option value="Class 12">Class 12</option>
                              <option value="Class 10">Class 10</option>
                              <option value="Dropper / Repeater">Dropper</option>
                            </select>
                          </td>
                          <td className="p-1.5 text-center">
                            {gridRows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeleteGridRow(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddGridRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Another Row</span>
              </button>
            </div>
          )}

          {/* REAL-TIME PREVIEW OF PARSED STUDENTS */}
          {activeStudentsList.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Ready to Enroll: {validCount} of {activeStudentsList.length} Students
                  </span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Target: {selectedBatchId === 'NEW_BATCH' ? newBatchName : (existingBatches.find(b => b.id === selectedBatchId)?.name || 'Classroom Batch')}
                </span>
              </div>

              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                {activeStudentsList.map((s, idx) => (
                  <div
                    key={s.id}
                    className="p-2.5 flex items-center justify-between text-xs hover:bg-white transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#991b1b] text-white flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{s.fullName}</div>
                        <div className="text-[10px] text-slate-500">
                          {s.phone || 'No phone'} • Guardian: {s.guardianName} ({s.guardianPhone || 'N/A'})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                        {s.grade}
                      </span>
                      {s.feeAmount && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded">
                          ₹{s.feeAmount.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {validCount > 0 ? (
              <span className="text-emerald-700 font-semibold">
                ✓ {validCount} students validated and ready to save.
              </span>
            ) : (
              <span>Add or paste students above to continue</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || validCount === 0}
              className="px-5 py-2.5 rounded-xl bg-[#991b1b] hover:bg-[#7f1d1d] active:bg-[#600f0f] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Enrolling into Database...</span>
                </>
              ) : (
                <>
                  <span>Enroll {validCount > 0 ? `${validCount} Students` : 'Students'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
