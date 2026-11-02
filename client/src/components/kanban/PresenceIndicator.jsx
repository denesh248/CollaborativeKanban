// client/src/components/kanban/PresenceIndicator.jsx
// Displays real-time WebSocket connection status and active branch members

import React from 'react';

export default function PresenceIndicator({ socketConnected, onlineUsers = [] }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      {/* Live Socket Status Badge */}
      <div className="inline-flex items-center gap-1.5 text-xs bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/80 w-fit">
        <span
          className={`w-2 h-2 rounded-full ${
            socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
          }`}
        />
        <span className="text-[11px] font-semibold text-slate-600">
          {socketConnected ? 'Live Synced' : 'Reconnecting...'}
        </span>
      </div>

      {/* Online Users List */}
      <div className="flex items-center gap-1.5 text-xs">
        <span className="font-semibold text-slate-600">Online ({onlineUsers.length}):</span>
        <span className="text-slate-500 truncate max-w-xs sm:max-w-md">
          {onlineUsers.length > 0
            ? onlineUsers.map((u) => u.fullName).join(', ')
            : 'Connecting to room...'}
        </span>
      </div>
    </div>
  );
}
