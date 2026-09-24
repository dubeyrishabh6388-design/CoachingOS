'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { db } from '@/lib/db/store';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Download,
  Sparkles,
  FileText
} from 'lucide-react';

interface ImportedRow {
  studentName: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
  course: string;
  feeAmount: number;
  isDuplicate?: boolean;
  isValid?: boolean;
}

export default function ImportDataPage() {
  const { currentOrg, currentBranch, showToast } = useApp();
  const [previewRows, setPreviewRows] = useState<ImportedRow[]>([]);
  const [importCompleted, setImportCompleted] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingLeads = useMemo(() => db.getLeads(currentOrg.id), [currentOrg.id]);

  const sampleLeadCSV = `studentName,phone,guardianName,guardianPhone,course,feeAmount
Kunal Bansal,+919876500001,Suresh Bansal,+919876500002,JEE Advanced,150000
Meera Joshi,+919876500003,Deepak Joshi,+919876500004,NEET Excellence,120000
Ayush Goel,+919876543210,Rajeev Goel,+919876543211,JEE Advanced,150000
Siddharth Rao,+919876500005,Anand Rao,+919876500006,JEE Advanced,150000`;

  const parseCSVContent = (content: string) => {
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      showToast('CSV file is empty or missing headers');
      return;
    }

    const rows: ImportedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/['"]/g, ''));
      if (cols.length < 2) continue;

      const studentName = cols[0] || `Student #${i}`;
      const phone = cols[1] || '';
      const guardianName = cols[2] || 'Parent / Guardian';
      const guardianPhone = cols[3] || phone;
      const course = cols[4] || 'IIT-JEE 2-Year Integrated';
      const feeAmount = parseFloat(cols[5]) || 125000;

      const isDuplicate = existingLeads.some(
        l => l.phone.replace(/\D/g, '') === phone.replace(/\D/g, '') ||
             l.studentName.toLowerCase() === studentName.toLowerCase()
      );

      const isValid = studentName.length > 2 && phone.length >= 8;

      rows.push({
        studentName,
        phone,
        guardianName,
        guardianPhone,
        course,
        feeAmount,
        isValid,
        isDuplicate,
      });
    }

    setPreviewRows(rows);
    setImportCompleted(false);
    const dupCount = rows.filter(r => r.isDuplicate).length;
    showToast(`Loaded ${rows.length} records (${dupCount} duplicate flagged)`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        parseCSVContent(text);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setFileName('sample_enquiries.csv');
    parseCSVContent(sampleLeadCSV);
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + sampleLeadCSV;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'CoachingOS_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded sample CSV template');
  };

  const handleCommitImport = async () => {
    const validRows = previewRows.filter(r => !r.isDuplicate && r.isValid);
    if (validRows.length === 0) {
      showToast('No clean records to import');
      return;
    }

    for (const r of validRows) {
      db.createLead({
        organizationId: currentOrg.id,
        branchId: currentBranch.id,
        studentName: r.studentName,
        phone: r.phone,
        guardianName: r.guardianName,
        guardianPhone: r.guardianPhone,
        interestedCourseId: 'crs-jee-adv',
        targetCourse: r.course,
        source: 'WALK_IN',
        stage: 'NEW',
        notes: `Imported via spreadsheet on ${new Date().toLocaleDateString('en-IN')}`,
        assignedCounsellorId: 'usr-003',
      });
    }

    setImportCompleted(true);
    showToast(`Imported ${validRows.length} clean records into your enquiries!`);
  };

  const cleanCount = previewRows.filter(r => !r.isDuplicate && r.isValid).length;
  const dupCount = previewRows.filter(r => r.isDuplicate).length;

  return (
    <div className="space-y-6 w-full">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Import Data
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Upload your existing student and enquiry spreadsheets (.csv) to import into CoachingOS.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Template (.csv)</span>
          </button>

          <button
            onClick={handleLoadSample}
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium px-3 py-2 rounded-lg border border-emerald-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Load Sample Data</span>
          </button>
        </div>
      </div>

      {/* Upload Drop Area */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="bg-white border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-xl p-8 text-center transition-all space-y-3 cursor-pointer group shadow-sm"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center group-hover:scale-105 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {fileName ? `Selected: ${fileName}` : 'Click to select or drag & drop your CSV spreadsheet'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard CSV files with student name, phone, parent details, and course.
          </p>
        </div>
      </div>

      {/* Preview Table */}
      {previewRows.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Spreadsheet Preview & Validation</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {previewRows.length} total rows parsed &bull; <strong className="text-emerald-700">{cleanCount} clean records</strong> &bull; <strong className="text-rose-600">{dupCount} duplicate(s) flagged</strong>
              </p>
            </div>

            {!importCompleted ? (
              <button
                onClick={handleCommitImport}
                disabled={cleanCount === 0}
                className="flex items-center gap-2 bg-[#991b1b] hover:bg-[#7f1d1d] disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
              >
                <span>Commit {cleanCount} Clean Records</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-emerald-200/60">
                <CheckCircle2 className="w-4 h-4" />
                Import Committed to Pipeline!
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Student Name</th>
                  <th className="px-4 py-2.5">Phone</th>
                  <th className="px-4 py-2.5">Guardian Details</th>
                  <th className="px-4 py-2.5">Course</th>
                  <th className="px-4 py-2.5">Validation Check</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {previewRows.map((row, idx) => (
                  <tr key={idx} className={row.isDuplicate ? 'bg-rose-50/40' : 'hover:bg-slate-50/60'}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{row.studentName}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{row.phone}</td>
                    <td className="px-4 py-3 text-slate-500">{row.guardianName} ({row.guardianPhone})</td>
                    <td className="px-4 py-3">{row.course}</td>
                    <td className="px-4 py-3">
                      {row.isDuplicate ? (
                        <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200/60 px-2 py-0.5 rounded font-medium flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" /> Duplicate Phone
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded font-medium flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Valid
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
