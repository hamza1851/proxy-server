import React from 'react';
import { X, AlertTriangle, Trash2, Clock, ShieldAlert } from 'lucide-react';
import { TacticalButton } from '../common/TacticalButton.js';

interface PurgeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  targetName: string;
  timeframeLabel: string;
  isTotalWipe: boolean;
  isExecuting: boolean;
  recordEstimate?: number;
}

export const PurgeConfirmModal: React.FC<PurgeConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetName,
  timeframeLabel,
  isTotalWipe,
  isExecuting,
  recordEstimate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-cyber-bg border border-cyber-danger/60 rounded-xl p-5 shadow-[0_0_35px_rgba(255,0,85,0.4)] text-xs font-mono">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-cyber-danger/30">
          <div className="flex items-center space-x-2 text-cyber-danger font-hud font-bold text-sm tracking-wider">
            <ShieldAlert className="w-5 h-5 text-cyber-danger animate-pulse" />
            <span>CONFIRM TELEMETRY PURGE PROTOCOL</span>
          </div>
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="text-slate-500 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target & Scope Summary */}
        <div className="space-y-3 mb-5">
          <div className="p-3 bg-cyber-card/90 rounded border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">TARGET SCOPE:</span>
              <span className="text-white font-bold font-hud">{targetName}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">RETENTION HORIZON:</span>
              <span className="text-cyber-cyan font-bold">{timeframeLabel}</span>
            </div>
            {recordEstimate !== undefined && (
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">RECORDS IN TARGET:</span>
                <span className="text-cyber-yellow font-bold">{recordEstimate} records</span>
              </div>
            )}
          </div>

          {/* Warning Banner */}
          <div className="p-3 bg-cyber-danger/15 border border-cyber-danger/50 rounded flex items-start space-x-3 text-cyber-danger text-[11px] leading-relaxed">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">
                {isTotalWipe
                  ? 'IRREVERSIBLE COMPLETE DATA PURGE:'
                  : 'PERMANENT RETENTION EXPIRY CLEANUP:'}
              </p>
              <p className="text-slate-300">
                This action runs a database job to permanently drop matching DNS query logs and monitoring telemetry from DB tables. This operation cannot be rolled back.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
          <TacticalButton
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isExecuting}
          >
            ABORT CANCEL
          </TacticalButton>

          <TacticalButton
            variant="danger"
            size="sm"
            onClick={onConfirm}
            disabled={isExecuting}
            className="shadow-[0_0_15px_rgba(255,0,85,0.4)]"
          >
            {isExecuting ? (
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                PURGING DATA...
              </span>
            ) : (
              <span className="flex items-center">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                CONFIRM & DROP DATA
              </span>
            )}
          </TacticalButton>
        </div>
      </div>
    </div>
  );
};
