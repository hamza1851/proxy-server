import React, { useState, useRef, useEffect } from 'react';
import { Terminal, X, CornerDownLeft } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';

interface CliTerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CliTerminal: React.FC<CliTerminalProps> = ({ isOpen, onClose }) => {
  const {
    devices,
    toggleKillswitch,
    toggleDeviceBypass,
    freezeDevice,
    toggleUniversalService,
    refreshAll,
    playBeep
  } = useDashboard();

  const [input, setInput] = useState<string>('');
  const [history, setHistory] = useState<string[]>([
    'CYBER-COMMAND PROXY SHELL v2.4 initialized.',
    'Type "help" to display operational directives.'
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isOpen]);

  if (!isOpen) return null;

  const handleCommand = async (cmdStr: string) => {
    const raw = cmdStr.trim();
    if (!raw) return;

    playBeep(1100, 0.04);
    const newHistory = [...history, `$ ${raw}`];
    const parts = raw.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        newHistory.push(
          'Directives:',
          '  help                         - List available commands',
          '  killswitch                   - Toggle global DNS emergency killswitch',
          '  devices                      - Display configured proxy clients',
          '  bypass <device_id> [0|1]     - Toggle carrier bypass for target',
          '  freeze <device_id> <mins>    - Enforce curfew lockdown on target',
          '  block <service_id>           - Toggle universal block on service (tiktok, instagram, etc)',
          '  refresh                      - Sync telemetry state from proxy core',
          '  clear                        - Clear terminal buffer'
        );
        break;

      case 'clear':
        setHistory([]);
        setInput('');
        return;

      case 'killswitch':
        await toggleKillswitch();
        newHistory.push('>> Master Killswitch toggled.');
        break;

      case 'devices':
        devices.forEach((d) => {
          newHistory.push(`  [${d.id}] ${d.name} | IP: ${d.ip} | Bypass: ${d.bypassed ? 'ON' : 'OFF'} | Curfew: ${d.curfew?.active ? 'LOCKED' : 'PASS'}`);
        });
        break;

      case 'bypass':
        if (args.length < 1) {
          newHistory.push('Usage: bypass <device_id> [0|1]');
        } else {
          const dev = devices.find((d) => d.id === args[0]);
          if (!dev) {
            newHistory.push(`Device [${args[0]}] not recognized.`);
          } else {
            const nextBypass = args[1] !== undefined ? args[1] === '1' : !dev.bypassed;
            await toggleDeviceBypass(dev.id, nextBypass);
            newHistory.push(`>> Device [${dev.name}] bypass updated to: ${nextBypass ? 'CARRIER DIRECT' : 'PROXY SHIELD'}`);
          }
        }
        break;

      case 'freeze':
        if (args.length < 2) {
          newHistory.push('Usage: freeze <device_id> <minutes>');
        } else {
          const dev = devices.find((d) => d.id === args[0]);
          const mins = parseInt(args[1], 10);
          if (!dev) {
            newHistory.push(`Device [${args[0]}] not recognized.`);
          } else if (isNaN(mins)) {
            newHistory.push('Minutes must be a valid integer.');
          } else {
            await freezeDevice(dev.id, mins);
            newHistory.push(`>> Lockdown active on [${dev.name}] for ${mins} minutes.`);
          }
        }
        break;

      case 'block':
        if (args.length < 1) {
          newHistory.push('Usage: block <service_id>');
        } else {
          await toggleUniversalService(args[0].toLowerCase());
          newHistory.push(`>> Target service [${args[0]}] toggled.`);
        }
        break;

      case 'refresh':
        await refreshAll();
        newHistory.push('>> Core telemetry re-synced.');
        break;

      default:
        newHistory.push(`Command unrecognized: "${command}". Enter "help" for syntax.`);
    }

    setHistory(newHistory);
    setInput('');
  };

  return (
    <div className="border-b border-cyber-border bg-cyber-bg/95 font-mono text-xs px-4 py-3 shadow-2xl relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400">
          <div className="flex items-center space-x-2 text-cyber-green font-bold">
            <Terminal className="w-4 h-4" />
            <span>OPERATOR CLI TERMINAL // ROOT LEVEL ACCESS</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-40 overflow-y-auto py-2 space-y-1 text-slate-300">
          {history.map((line, idx) => (
            <div
              key={idx}
              className={line.startsWith('$') ? 'text-cyber-cyan font-bold' : line.startsWith('>>') ? 'text-cyber-green' : ''}
            >
              {line}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCommand(input);
          }}
          className="flex items-center space-x-2 mt-1 pt-2 border-t border-slate-800"
        >
          <span className="text-cyber-green font-bold">root@cyberproxy:~#</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type directive (e.g., help, killswitch, devices)..."
            className="flex-1 bg-transparent text-cyber-cyan outline-none border-none placeholder:text-slate-600 font-mono text-xs"
            autoFocus
          />
          <button type="submit" className="text-slate-500 hover:text-cyber-cyan">
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
