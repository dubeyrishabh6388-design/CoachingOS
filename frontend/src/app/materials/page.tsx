'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { StudyMaterial, Batch } from '@/lib/types';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  FileText,
  Download,
  Video,
  FileSpreadsheet,
  Share2,
  Clock,
  User,
  X,
  CheckCircle2,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function StudyMaterialsPage() {
  const { currentOrg, showToast } = useApp();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [fileType, setFileType] = useState<StudyMaterial['fileType']>('PDF');
  const [batchId, setBatchId] = useState('');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  const fetchMaterials = async () => {
    try {
      const res = await fetch(`/api/v1/materials?organizationId=${currentOrg.id}`);
      const json = await res.json();
      if (json?.data) setMaterials(json.data);
    } catch (err) {
      console.error('Failed to load study materials', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await fetch(`/api/v1/batches?organizationId=${currentOrg.id}`);
      const json = await res.json();
      if (json?.data) {
        setBatches(json.data);
        if (json.data.length > 0 && !batchId) {
          setBatchId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load batches', err);
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchBatches();
  }, [currentOrg.id]);

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject) {
      showToast('Please enter both title and subject', 'error');
      return;
    }

    try {
      const selectedBatch = batches.find(b => b.id === batchId);
      const res = await fetch('/api/v1/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrg.id,
          courseId: selectedBatch?.courseId || 'general',
          batchId: batchId || null,
          subject,
          title,
          description,
          fileType,
          fileUrl: fileUrl || `/materials/${title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
          fileSizeKb: Math.floor(Math.random() * 3000) + 500,
          uploadedBy: 'Faculty Member',
        }),
      });

      const json = await res.json();
      if (json.data) {
        setMaterials([json.data, ...materials]);
        setIsUploadModalOpen(false);
        setTitle('');
        setDescription('');
        setFileUrl('');
        showToast('Study material shared with students & parents successfully!', 'success');
      }
    } catch (err) {
      showToast('Error uploading study material', 'error');
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === 'ALL' || m.subject.toUpperCase() === selectedSubject.toUpperCase();
      const matchesType = selectedType === 'ALL' || m.fileType === selectedType;
      return matchesSearch && matchesSubject && matchesType;
    });
  }, [materials, searchQuery, selectedSubject, selectedType]);

  const getSubjectColor = (subj: string) => {
    switch (subj.toLowerCase()) {
      case 'physics':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'chemistry':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'mathematics':
      case 'maths':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="w-5 h-5 text-rose-500" />;
      case 'DPP':
      case 'ASSIGNMENT':
        return <FileSpreadsheet className="w-5 h-5 text-indigo-500" />;
      default:
        return <FileText className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-[#991b1b]" />
            Study Materials &amp; Notes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Share formula sheets, DPPs, handwritten notes, and recorded video lectures directly with students and parents.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Upload New Material
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by topic, chapter, or formula..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium text-slate-600">
            {['ALL', 'Physics', 'Chemistry', 'Mathematics'].map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  selectedSubject.toLowerCase() === sub.toLowerCase()
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:outline-hidden"
          >
            <option value="ALL">All Types</option>
            <option value="PDF">PDF Sheets</option>
            <option value="NOTES">Class Notes</option>
            <option value="DPP">Daily DPPs</option>
            <option value="VIDEO">Video Lectures</option>
            <option value="ASSIGNMENT">Mock Papers</option>
          </select>
        </div>
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading study materials...</div>
      ) : filteredMaterials.length === 0 ? (
        <div className="p-12 bg-white rounded-xl border border-dashed border-slate-200 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No study materials found</p>
          <p className="text-xs text-slate-400 mt-1">Upload formula sheets, handwritten notes, or DPP assignments for this batch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${getSubjectColor(mat.subject)}`}>
                    {mat.subject}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {mat.fileType} • {mat.fileSizeKb > 1024 ? `${(mat.fileSizeKb / 1024).toFixed(1)} MB` : `${mat.fileSizeKb} KB`}
                  </span>
                </div>

                <div className="flex items-start gap-3 mb-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg shrink-0 mt-0.5">
                    {getTypeIcon(mat.fileType)}
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-slate-900 line-clamp-2 leading-snug">
                      {mat.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {mat.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{mat.uploadedBy}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      showToast(`WhatsApp link copied for "${mat.title}"`, 'success');
                    }}
                    title="Share with Parents via WhatsApp"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#991b1b] hover:bg-red-50 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <a
                    href={mat.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#991b1b] hover:text-[#7f1d1d] bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Open
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-[#991b1b]" />
                <h2 className="font-bold text-base text-slate-900">Upload Study Material</h2>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rotational Dynamics & Center of Mass Summary"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991b1b]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                    Subject *
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                    Target Batch
                  </label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  >
                    <option value="ALL">All Batches (Global)</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                    Document Category
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  >
                    <option value="NOTES">Notes / Formula Sheet</option>
                    <option value="ASSIGNMENT">DPP / Daily Practice</option>
                    <option value="FORMULA_SHEET">Formula Handbook</option>
                    <option value="SYLLABUS">Syllabus Breakdown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                    Direct File / Drive URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">
                  Short Description / Student Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Recommended solving time 45 mins. Contains 25 MCQs."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-xl text-sm font-semibold shadow-sm"
                >
                  Publish &amp; Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
