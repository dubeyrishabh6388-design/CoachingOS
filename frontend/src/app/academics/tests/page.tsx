'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context/AppContext';
import { db } from '@/lib/db/store';
import { SEED_QUESTIONS } from '@/lib/db/initial-seed';
import { TestResult } from '@/lib/types';
import { 
  FileCheck2, 
  Sparkles, 
  Clock, 
  Award, 
  CheckCircle2, 
  Play, 
  RotateCcw,
  BookOpen,
  Plus,
  HelpCircle,
  AlertTriangle,
  Send,
  Share2,
  X,
  Crown,
  Trophy,
  MessageSquare
} from 'lucide-react';
import TopperPosterModal from '@/components/marketing/TopperPosterModal';

export default function TestsPage() {
  const { currentOrg, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'TESTS' | 'RESULTS' | 'QUESTION_BANK' | 'PRACTICE_EXAM'>('RESULTS');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isCreateTestOpen, setIsCreateTestOpen] = useState(false);
  const [topperModalResult, setTopperModalResult] = useState<TestResult | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(true);

  // New test form
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Physics');

  useEffect(() => {
    fetch(`/api/v1/test-results?organizationId=${currentOrg.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json?.data) setTestResults(json.data);
      })
      .catch((err) => console.error('Failed to fetch test results', err))
      .finally(() => setLoadingResults(false));
  }, [currentOrg.id]);

  const questions = React.useMemo(() => {
    return SEED_QUESTIONS.map(q => {
      const opts = (q.optionsJson || []).map((optStr: string, idx: number) => ({
        optionLabel: String.fromCharCode(65 + idx),
        text: optStr,
      }));
      return {
        ...q,
        subject: (q as any).subject || 'Physics',
        topic: (q as any).topic || q.topicName || 'Mechanics',
        questionText: (q as any).questionText || q.stemLatex || '',
        explanation: (q as any).explanation || q.explanationLatex || '',
        options: opts,
      };
    });
  }, []);
  const [testsList, setTestsList] = useState<any[]>(() => db.getTests(currentOrg.id));

  useEffect(() => {
    setTestsList(db.getTests(currentOrg.id));
  }, [currentOrg.id]);

  const handleSelectOption = (qId: string, option: string) => {
    if (examSubmitted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [qId]: option,
    }));
  };

  const handleSubmitExam = () => {
    let rawScore = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        rawScore += 4;
      } else if (selectedAnswers[q.id]) {
        rawScore -= 1; // Negative marking
      }
    });
    setScore(rawScore);
    setExamSubmitted(true);
    showToast(`Test submitted! Final Score: ${rawScore} / ${questions.length * 4}`);
  };

  const resetExam = () => {
    setSelectedAnswers({});
    setExamSubmitted(false);
    setScore(0);
  };

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestTitle.trim()) return;

    const newTestObj = {
      id: `t-${Date.now().toString().slice(-4)}`,
      organizationId: currentOrg.id,
      title: newTestTitle,
      batch: 'All Batches',
      duration: '60 mins',
      durationMinutes: 60,
      questions: 25,
      totalMarks: 100,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'Scheduled',
    };

    setTestsList(prev => [newTestObj, ...prev]);
    showToast(`Test "${newTestTitle}" scheduled successfully!`, 'success');
    setIsCreateTestOpen(false);
    setNewTestTitle('');
  };

  return (
    <div className="space-y-6 w-full p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-7 h-7 text-[#991b1b]" />
            Tests &amp; Results
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Automatic diagnostic breakdown: Test → Result → Topic performance → Weak areas → Recommended action.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setActiveTab('RESULTS')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'RESULTS' ? 'bg-white text-[#991b1b] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Results &amp; Weak Areas ({testResults.length})
            </button>
            <button
              onClick={() => setActiveTab('TESTS')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'TESTS' ? 'bg-white text-[#991b1b] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Scheduled Tests
            </button>
            <button
              onClick={() => setActiveTab('QUESTION_BANK')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'QUESTION_BANK' ? 'bg-white text-[#991b1b] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Question Bank
            </button>
            <button
              onClick={() => setActiveTab('PRACTICE_EXAM')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'PRACTICE_EXAM' ? 'bg-white text-[#991b1b] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Practice Player
            </button>
          </div>

          <button
            onClick={() => setIsCreateTestOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Test</span>
          </button>
        </div>
      </div>

      {/* Tab 0: Results & Weak Areas */}
      {activeTab === 'RESULTS' && (
        <div className="space-y-4">
          {loadingResults ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
              Loading test results...
            </div>
          ) : testResults.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
              <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No test results found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Complete a practice exam or scheduled test to view diagnostic breakdowns, weak areas, and recommended actions.
              </p>
              <button
                onClick={() => setActiveTab('PRACTICE_EXAM')}
                className="px-4 py-2 bg-[#991b1b] text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Start Practice Exam
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-[#991b1b] shrink-0" />
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block mb-0.5">Automated Academic Diagnostic Engine</span>
                    Every test automatically pinpoints topic deficiencies and suggests customized remediation playbooks for each student.
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#991b1b] bg-red-100/70 px-2.5 py-1 rounded-md shrink-0">
                  {testResults.length} Student Analyses
                </span>
              </div>

              {testResults.map((result) => (
                <div key={result.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                  {/* Top Bar: Student info & Overall Score */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-white bg-[#991b1b] px-2 py-0.5 rounded-md">
                          Rank #{result.rankInBatch}
                        </span>
                        <h2 className="font-bold text-base text-slate-900">{result.studentName || 'Student'}</h2>
                        <span className="text-xs text-slate-400 font-mono font-medium">{result.rollNumber}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>{result.testTitle || 'Monthly Cumulative Test'}</span>
                        <span>&bull;</span>
                        <span>{result.batchName || 'JEE Advanced Batch A'}</span>
                        <span>&bull;</span>
                        <span>Taken on {result.takenAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">
                          {result.scoreObtained} <span className="text-xs font-normal text-slate-400">/ {result.totalMarks}</span>
                        </div>
                        <div className="text-xs font-semibold text-[#991b1b]">{result.percentage}% Score</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTopperModalResult(result)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                          title="Generate 9:16 WhatsApp Status Flyer"
                        >
                          <Crown className="w-3.5 h-3.5 text-amber-200" />
                          <span>Status Poster</span>
                        </button>

                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `*Weekly Test Scorecard from ${currentOrg.tradeName}*\n\n` +
                            `Student: *${result.studentName}* (${result.rollNumber || 'STU-01'})\n` +
                            `Batch: *${result.batchName || 'Foundation Batch'}*\n` +
                            `Test: *${result.testTitle || 'Periodic Assessment'}*\n\n` +
                            `🏆 *Batch Rank:* Rank #${result.rankInBatch}\n` +
                            `📊 *Total Score:* ${result.scoreObtained} / ${result.totalMarks} (${result.percentage}%)\n\n` +
                            `📌 *Subject Breakdown:*\n` +
                            `• Physics: ${result.physicsScore || 0}/100\n` +
                            `• Chemistry: ${result.chemistryScore || 0}/100\n` +
                            `• Mathematics: ${result.mathsScore || 0}/100\n\n` +
                            `Keep encouraging them!\n*${currentOrg.tradeName}*`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>WhatsApp Parent</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Subject Breakdown Badges */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                      <span className="text-[11px] font-semibold text-emerald-800 uppercase block mb-0.5">Physics</span>
                      <span className="text-sm font-bold text-emerald-950">{result.physicsScore || 0} / 100</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                      <span className="text-[11px] font-semibold text-amber-800 uppercase block mb-0.5">Chemistry</span>
                      <span className="text-sm font-bold text-amber-950">{result.chemistryScore || 0} / 100</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                      <span className="text-[11px] font-semibold text-blue-800 uppercase block mb-0.5">Mathematics</span>
                      <span className="text-sm font-bold text-blue-950">{result.mathsScore || 0} / 100</span>
                    </div>
                  </div>

                  {/* Diagnostic Breakdown: Weak Areas vs Strong Areas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Weak Areas */}
                    <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/70 space-y-1.5">
                      <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        Weak Areas (Focus Needed)
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {result.weakTopics?.map((topic, tIdx) => (
                          <span key={tIdx} className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white text-rose-800 border border-rose-200 shadow-2xs">
                            ⚠️ {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Strong Areas */}
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 space-y-1.5">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Strong Mastery Areas
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {result.strongTopics?.map((topic, tIdx) => (
                          <span key={tIdx} className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white text-emerald-800 border border-emerald-200 shadow-2xs">
                            ✓ {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recommended Action Prescription */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-[#991b1b] shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-700">
                      <span className="font-bold text-slate-900">Recommended Action: </span>
                      {result.recommendedAction}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          )}
        </div>
      )}

      {/* Tab 1: Scheduled Tests */}
      {activeTab === 'TESTS' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Upcoming &amp; Past Test Series ({testsList.length})
            </h2>
            <span className="text-xs text-slate-400 font-medium">{currentOrg.tradeName}</span>
          </div>

          {testsList.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="text-base font-bold text-slate-800">
                No tests scheduled yet for {currentOrg.tradeName}
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Schedule chapter tests or full mock exams to benchmark your students, identify weak concept areas, and issue scorecards.
              </p>
              <button
                onClick={() => setIsCreateTestOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule First Test</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {testsList.map(test => (
                <div key={test.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{test.title}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                        test.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                        test.status === 'Scheduled' ? 'bg-red-50 text-[#991b1b] border-red-200/60' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {test.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>{test.batch || 'All Batches'}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {test.duration || '60 mins'}</span>
                      <span>&bull;</span>
                      <span>{test.questions || 25} Questions ({test.totalMarks || 100} Marks)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-500 font-medium">{test.date || 'Today'}</span>
                    <button
                      onClick={() => setActiveTab('PRACTICE_EXAM')}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-red-50 text-[#991b1b] border border-slate-200 rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      Open Player
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Question Bank */}
      {activeTab === 'QUESTION_BANK' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3.5 border border-slate-200 rounded-xl shadow-sm">
            <span className="text-xs text-slate-600 font-medium">
              Showing {questions.length} verified practice questions across Physics, Chemistry, and Mathematics.
            </span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
              JEE Advanced Ready
            </span>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Question #{idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-600">{q.subject} &bull; {q.topic}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    q.difficulty === 'EASY' ? 'bg-emerald-50 text-emerald-700' :
                    q.difficulty === 'MEDIUM' ? 'bg-amber-50 text-amber-700' :
                    'bg-rose-50 text-rose-700'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>

                <p className="text-xs text-slate-800 leading-relaxed font-serif">
                  {q.questionText}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, oIdx) => (
                    <div 
                      key={oIdx} 
                      className={`p-2.5 rounded-lg border text-slate-700 text-[11px] ${
                        opt.optionLabel === q.correctAnswer 
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-medium' 
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <strong>{opt.optionLabel}.</strong> {opt.text}
                      {opt.optionLabel === q.correctAnswer && (
                        <span className="ml-2 text-emerald-600 font-bold text-[10px]">&check; Correct</span>
                      )}
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-600">
                    <strong className="text-slate-800">Explanation: </strong> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Practice Player */}
      {activeTab === 'PRACTICE_EXAM' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Chapter Quiz Player</h2>
              <p className="text-xs text-slate-500">Marking scheme: +4 for correct, -1 for incorrect attempt</p>
            </div>

            {examSubmitted ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-500">Your Score</div>
                  <div className="text-xl font-bold text-emerald-700">{score} / {questions.length * 4}</div>
                </div>
                <button
                  onClick={resetExam}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleSubmitExam}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                Submit Exam &rarr;
              </button>
            )}
          </div>

          {/* Question List */}
          <div className="space-y-6">
            {questions.map((q, qIdx) => {
              const selected = selectedAnswers[q.id];
              const isCorrect = examSubmitted && selected === q.correctAnswer;
              const isWrong = examSubmitted && selected && selected !== q.correctAnswer;

              return (
                <div key={q.id} className="space-y-3 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Question {qIdx + 1} of {questions.length}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{q.subject}</span>
                  </div>

                  <p className="text-xs text-slate-900 font-medium leading-relaxed font-serif">
                    {q.questionText}
                  </p>

                  <div className="space-y-2">
                    {q.options.map(opt => {
                      const isOptionSelected = selected === opt.optionLabel;

                      return (
                        <button
                          key={opt.optionLabel}
                          disabled={examSubmitted}
                          onClick={() => handleSelectOption(q.id, opt.optionLabel)}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex items-center justify-between ${
                            isOptionSelected
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-sm'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span><strong>{opt.optionLabel}.</strong> {opt.text}</span>
                          {isOptionSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {examSubmitted && (
                    <div className={`p-3 rounded-lg text-xs ${isCorrect ? 'bg-emerald-50 text-emerald-800' : isWrong ? 'bg-rose-50 text-rose-800' : 'bg-slate-100 text-slate-600'}`}>
                      {isCorrect && <span>&check; Correct attempt! (+4 Marks)</span>}
                      {isWrong && <span>&cross; Incorrect attempt (-1 Mark). Correct answer is <strong>{q.correctAnswer}</strong>.</span>}
                      {!selected && <span>Not attempted (0 Marks). Correct answer is <strong>{q.correctAnswer}</strong>.</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Test Modal */}
      {isCreateTestOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-semibold text-slate-900 text-base">Schedule New Test</h3>
              <button onClick={() => setIsCreateTestOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Test Title *</label>
                <input
                  type="text"
                  required
                  value={newTestTitle}
                  onChange={e => setNewTestTitle(e.target.value)}
                  placeholder="e.g. Physics Chapter 3 Friction Quiz"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Subject</label>
                  <select
                    value={newSubject}
                    onChange={e => setNewSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    defaultValue={60}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTestOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Schedule Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1-Click Topper WhatsApp Status Poster Modal */}
      {topperModalResult && (
        <TopperPosterModal
          isOpen={Boolean(topperModalResult)}
          onClose={() => setTopperModalResult(null)}
          result={topperModalResult}
          instituteName={currentOrg.tradeName}
        />
      )}
    </div>
  );
}
