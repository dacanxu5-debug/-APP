
import React from 'react';

export const SkeletonRow = () => (
  <div className="animate-pulse flex items-center space-x-4 p-4 border-b border-slate-200">
    <div className="flex-1 space-y-3 py-1">
      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
      <div className="flex space-x-4">
        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
        <div className="h-3 bg-slate-200 rounded w-1/4"></div>
      </div>
    </div>
    <div className="h-8 w-20 bg-slate-200 rounded"></div>
  </div>
);
