import React from 'react'

const STATUS_COLORS = {
  complete: 'bg-emerald/20 text-emerald border-emerald/40',
  processing: 'bg-amber/20 text-amber border-amber/40',
  failed: 'bg-danger/20 text-danger border-danger/40',
}

export default function HistoryPanel({ isOpen, onClose, history, onSelectAnalysis, loading }) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      </div>
      <div
        className={`fixed left-0 top-0 bottom-0 w-full max-w-md bg-[#111111] border-r border-[#2a2a2a] z-50 shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex justify-between items-center border-b border-[#2a2a2a]">
          <h2 className="text-lg font-bold text-white tracking-tight">Analysis History</h2>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-[#1a1a1a] text-[#9ca3af] hover:text-white transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
            aria-label="Close history"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 rounded-xl shimmer" />
              ))}
            </div>
          ) : !history?.length ? (
            <div className="py-16 text-center">
              <p className="text-[#6b7280] mb-2">No past analyses yet.</p>
              <p className="text-sm text-[#4b5563]">Run your first analysis to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, idx) => (
                <button
                  key={item.analysis_id}
                  onClick={() => onSelectAnalysis(item.analysis_id)}
                  className="w-full text-left p-4 rounded-2xl bg-[#141414] border border-[#2a2a2a] border-l-4 border-l-transparent hover:border-[#3a3a3a] hover:border-l-primary transition-all duration-200 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
                >
                  <p className="font-semibold text-white truncate group-hover:text-primary transition-colors">
                    {item.topic}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-[#6b7280]">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${STATUS_COLORS[item.status] || 'bg-[#2a2a2a] text-[#9ca3af] border-[#3a3a3a]'}`}>
                      {item.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
