'use client';

import React, { useRef } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Share2, 
  Download, 
  X, 
  Printer, 
  CheckCircle2, 
  Flame, 
  Award,
  Crown
} from 'lucide-react';
import { TestResult } from '@/lib/types';

interface TopperPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: TestResult;
  instituteName: string;
}

export default function TopperPosterModal({
  isOpen,
  onClose,
  result,
  instituteName,
}: TopperPosterModalProps) {
  const posterRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !result) return null;

  const isRankOne = result.rankInBatch === 1;
  const isTopThree = (result.rankInBatch || 1) <= 3;

  const rankBadgeColor = isRankOne
    ? 'from-amber-400 via-yellow-300 to-amber-500 text-amber-950 border-amber-300'
    : (result.rankInBatch || 2) === 2
    ? 'from-slate-200 via-slate-100 to-slate-300 text-slate-900 border-slate-300'
    : 'from-amber-600 via-amber-500 to-amber-700 text-white border-amber-500';

  const shareText = encodeURIComponent(
    `🏆 *CONGRATULATIONS TO OUR TOPPER!*\n\n` +
    `🌟 *${result.studentName}*\n` +
    `secured *Rank #${result.rankInBatch}* in the *${result.testTitle || 'Weekly Cumulative Test'}*!\n\n` +
    `📊 Score: *${result.scoreObtained} / ${result.totalMarks}* (${result.percentage}%)\n` +
    `🎯 Batch: *${result.batchName || 'Foundation Batch'}*\n\n` +
    `Proudly guided by the faculty team at *${instituteName}*.\n\n` +
    `🚀 *ADMISSIONS OPEN FOR NEW BATCHES* - Call us today to begin your journey to top ranks!\n` +
    `#CoachingToppers #${instituteName.replace(/\s+/g, '')} #HardWorkPaysOff`
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full flex flex-col shadow-2xl overflow-hidden my-auto border border-slate-200">
        {/* Top Control Bar */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              1-Click Topper WhatsApp Status Poster
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 9:16 Vertical Mobile Flyer Viewport */}
        <div className="p-4 sm:p-6 bg-slate-100 flex justify-center">
          <div
            ref={posterRef}
            className="w-full max-w-[340px] aspect-[9/15] rounded-3xl bg-gradient-to-b from-[#2c0505] via-[#450a0a] to-[#7f1d1d] text-white p-6 shadow-2xl border-4 border-amber-400/40 flex flex-col justify-between relative overflow-hidden select-none"
          >
            {/* Ambient Gold Glow Backgrounds */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Poster Header */}
            <div className="text-center relative z-10 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-black tracking-widest uppercase">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>WEEKLY TEST STAR PERFORMER</span>
              </div>
              <h2 className="text-base font-black tracking-wider text-amber-200 uppercase mt-1">
                {instituteName}
              </h2>
            </div>

            {/* Central Student & Rank Showcase */}
            <div className="text-center relative z-10 space-y-3 my-auto">
              {/* Rank Shield */}
              <div className="relative inline-block">
                <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br ${rankBadgeColor} flex flex-col items-center justify-center shadow-2xl border-2 transform -rotate-2 hover:rotate-0 transition-transform`}>
                  <Trophy className="w-7 h-7" />
                  <span className="text-xs font-black tracking-tight leading-none mt-1">
                    RANK #{result.rankInBatch}
                  </span>
                </div>
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-md">
                  ★
                </div>
              </div>

              {/* Student Name */}
              <div className="space-y-0.5">
                <div className="text-xl font-black text-white tracking-tight drop-shadow-sm">
                  {result.studentName}
                </div>
                <div className="text-xs text-rose-200/90 font-medium">
                  {result.batchName || 'Regular Batch'} &bull; Roll: {result.rollNumber || 'STU-01'}
                </div>
              </div>

              {/* Score Display Card */}
              <div className="bg-rose-950/60 backdrop-blur-xs border border-amber-400/30 rounded-2xl p-3.5 mx-2 space-y-1">
                <div className="text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                  {result.testTitle || 'Periodic Test Assessment'}
                </div>
                <div className="text-3xl font-black text-amber-100 font-mono tracking-tight">
                  {result.scoreObtained}
                  <span className="text-sm font-normal text-rose-300"> / {result.totalMarks}</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-xs pt-1 border-t border-rose-900/60">
                  <span className="font-bold text-emerald-400">{result.percentage}% Marks</span>
                  <span className="text-rose-400">&bull;</span>
                  <span className="font-semibold text-rose-200">Accuracy: 95%</span>
                </div>
              </div>

              {/* Motivational Tagline */}
              <p className="text-[11px] text-amber-200/80 italic font-serif px-3">
                &ldquo;Dedication, discipline, and daily practice create champions.&rdquo;
              </p>
            </div>

            {/* Poster Footer: Admissions Call to Action */}
            <div className="text-center relative z-10 pt-2 border-t border-amber-400/20 space-y-1">
              <div className="text-[10px] font-black tracking-widest text-amber-300 uppercase">
                🚀 ADMISSIONS OPEN FOR NEW BATCHES
              </div>
              <div className="text-[10px] text-rose-200 font-semibold">
                Visit Campus or Call for Free Career Guidance
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Share directly to WhatsApp Status to showcase your institute&apos;s results!
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/?text=${shareText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Share to WhatsApp Status</span>
            </a>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Poster</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
