/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

export function SkeletonChat() {
  return (
    <div className="space-y-8 p-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex gap-4 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 animate-pulse shrink-0" />
          <div className={`space-y-2 w-full max-w-[60%] ${i % 2 === 0 ? 'flex flex-col items-end' : ''}`}>
            <div className="h-10 bg-white border border-slate-200 rounded-2xl w-full animate-pulse shadow-sm" />
            <div className="h-3 bg-slate-100 rounded w-16 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonRetrieval() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-sm group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-slate-50 rounded animate-pulse" />
              <div className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-32 animate-pulse" />
                <div className="h-2 bg-slate-50 rounded w-16 animate-pulse" />
              </div>
            </div>
            <div className="w-4 h-4 bg-slate-50 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
