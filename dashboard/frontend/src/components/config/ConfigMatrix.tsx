import React, { useState } from 'react';
import {
  Sliders,
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock,
  ShieldAlert,
  X
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext.js';
import { TacticalButton } from '../common/TacticalButton.js';
import { SystemConfigItem } from '../../types/index.js';

type CategoryFilter = 'ALL' | 'Network' | 'WireGuard' | 'DNS' | 'Security' | 'System' | 'General';

export const ConfigMatrix: React.FC = () => {
  const { systemConfigs, saveConfig, deleteConfig, playBeep } = useDashboard();

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<SystemConfigItem | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editCategory, setEditCategory] = useState<SystemConfigItem['category']>('General');
  const [editDescription, setEditDescription] = useState<string>('');

  // Add Modal State
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [newKey, setNewKey] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');
  const [newCategory, setNewCategory] = useState<SystemConfigItem['category']>('General');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newIsSecret, setNewIsSecret] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  const categories: CategoryFilter[] = ['ALL', 'Network', 'WireGuard', 'DNS', 'Security', 'System', 'General'];

  const filteredConfigs = systemConfigs.filter((item) => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
      return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchKey = item.key.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchVal = item.value?.toLowerCase().includes(q);
      return matchKey || matchDesc || matchVal;
    }
    return true;
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    playBeep(900, 0.04);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleReveal = (key: string) => {
    setRevealedSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openEditModal = (item: SystemConfigItem) => {
    playBeep(850, 0.04);
    setEditingItem(item);
    setEditValue(item.value);
    setEditCategory(item.category);
    setEditDescription(item.description);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    await saveConfig({
      key: editingItem.key,
      value: editValue,
      category: editCategory,
      description: editDescription,
      isSecret: editingItem.isSecret
    });

    setEditingItem(null);
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const key = newKey.trim().toUpperCase();

    if (!key) {
      setAddError('Directives Key is required');
      return;
    }

    try {
      await saveConfig({
        key,
        value: newValue,
        category: newCategory,
        description: newDescription || 'Operator custom directive',
        isSecret: newIsSecret
      });

      setIsAddOpen(false);
      setNewKey('');
      setNewValue('');
      setNewDescription('');
      setNewIsSecret(false);
    } catch (err: any) {
      setAddError(err?.message || 'Failed to save configuration');
    }
  };

  const handleDelete = async (key: string) => {
    if (window.confirm(`Confirm deletion of directive [${key}]?`)) {
      await deleteConfig(key);
    }
  };

  return (
    <div className="bg-cyber-card/90 rounded-lg p-5 border border-cyber-border/80 space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyber-cyan animate-pulse" />
            <h2 className="font-hud font-bold text-sm tracking-wider text-white">
              SYSTEM CONFIG MATRIX // RUNTIME DIRECTIVES
            </h2>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Dynamic directives persisted in MongoDB and environment. Powers client endpoints, WireGuard profiles, and core network filtering.
          </p>
        </div>

        <TacticalButton
          size="sm"
          variant="cyan"
          onClick={() => {
            playBeep(900, 0.05);
            setIsAddOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          ADD DIRECTIVE
        </TacticalButton>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playBeep(800, 0.03);
                setCategoryFilter(cat);
              }}
              className={`text-[10px] font-mono px-2.5 py-1 rounded border transition-all ${
                categoryFilter === cat
                  ? 'bg-cyber-cyan/20 border-cyber-cyan text-cyber-cyan font-bold shadow-[0_0_8px_rgba(0,243,255,0.3)]'
                  : 'bg-black/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search key, desc, value..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/50 border border-slate-700 pl-8 pr-3 py-1.5 rounded text-xs font-mono text-cyber-cyan outline-none focus:border-cyber-cyan placeholder:text-slate-600 transition-colors"
          />
        </div>
      </div>

      {/* Configuration Table */}
      <div className="overflow-x-auto rounded border border-slate-800/80">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="bg-black/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">Directive Key</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Configured Value</th>
              <th className="py-2.5 px-3">Operational Explanation</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredConfigs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500 font-mono">
                  No configuration directives matching search or category.
                </td>
              </tr>
            ) : (
              filteredConfigs.map((item) => {
                const isSecret = Boolean(item.isSecret);
                const isRevealed = Boolean(revealedSecrets[item.key]);
                const displayVal = item.value
                  ? (isSecret && !isRevealed ? '••••••••••••' : item.value)
                  : <span className="text-slate-600 italic">[UNCONFIGURED]</span>;

                return (
                  <tr
                    key={item.key}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Key */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-hud font-bold text-cyber-cyan tracking-wider">
                          {item.key}
                        </span>
                        {item.isSystem && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700" title="Core System Directive">
                            CORE
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-black/60 border border-slate-700 text-slate-300">
                        {item.category}
                      </span>
                    </td>

                    {/* Value */}
                    <td className="py-3 px-3 font-mono">
                      <div className="flex items-center space-x-2 max-w-xs sm:max-w-sm">
                        <span className="truncate text-slate-200 bg-black/40 px-2 py-1 rounded border border-slate-800/90 flex-1">
                          {displayVal}
                        </span>

                        {isSecret && (
                          <button
                            type="button"
                            onClick={() => toggleReveal(item.key)}
                            className="text-slate-400 hover:text-white transition-colors"
                            title={isRevealed ? 'Mask' : 'Reveal'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {item.value && (
                          <button
                            type="button"
                            onClick={() => handleCopy(item.value, item.key)}
                            className="text-slate-400 hover:text-cyber-green transition-colors"
                            title="Copy Value"
                          >
                            {copiedKey === item.key ? (
                              <Check className="w-3.5 h-3.5 text-cyber-green" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Explanation */}
                    <td className="py-3 px-3 text-slate-300 text-[11px] leading-relaxed max-w-md">
                      {item.description || 'No documentation provided.'}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <TacticalButton
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(item)}
                          title="Edit Directive"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          EDIT
                        </TacticalButton>

                        {!item.isSystem && (
                          <TacticalButton
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(item.key)}
                            title="Delete Custom Directive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </TacticalButton>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-cyber-bg border border-cyber-cyan/50 rounded-xl p-5 shadow-[0_0_35px_rgba(0,243,255,0.3)] font-mono text-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-cyber-cyan font-hud font-bold text-sm tracking-wider">
                <Edit2 className="w-4 h-4" />
                <span>MODIFY DIRECTIVE // [{editingItem.key}]</span>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">
                  Operational Directive Description
                </label>
                <div className="p-2.5 rounded bg-black/60 border border-slate-800 text-slate-300 text-[11px] leading-relaxed">
                  {editingItem.description}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">
                  Configured Directive Value
                </label>
                <input
                  type={editingItem.isSecret ? 'password' : 'text'}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Enter configuration value..."
                  className="w-full bg-black/50 border border-slate-700 focus:border-cyber-cyan text-cyber-cyan px-3 py-2 rounded text-xs outline-none font-mono"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full bg-black/50 border border-slate-700 text-slate-200 px-3 py-2 rounded text-xs outline-none font-mono"
                >
                  <option value="Network">Network</option>
                  <option value="WireGuard">WireGuard</option>
                  <option value="DNS">DNS</option>
                  <option value="Security">Security</option>
                  <option value="System">System</option>
                  <option value="General">General</option>
                </select>
              </div>

              {!editingItem.isSystem && (
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 mb-1">
                    Custom Operational Explanation
                  </label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full bg-black/50 border border-slate-700 text-slate-200 px-3 py-2 rounded text-xs outline-none font-mono"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <TacticalButton
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingItem(null)}
                >
                  CANCEL
                </TacticalButton>
                <TacticalButton
                  type="submit"
                  size="sm"
                  variant="cyan"
                >
                  APPLY DIRECTIVE
                </TacticalButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DIRECTIVE MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-cyber-bg border border-cyber-cyan/50 rounded-xl p-5 shadow-[0_0_35px_rgba(0,243,255,0.3)] font-mono text-xs">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-cyber-cyan font-hud font-bold text-sm tracking-wider">
                <Plus className="w-4 h-4" />
                <span>NEW RUNTIME DIRECTIVE</span>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mb-3 p-2.5 bg-cyber-danger/20 border border-cyber-danger rounded text-cyber-danger flex items-center space-x-2 text-[11px]">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateNew} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">
                  Directive Key (Uppercase Identifier)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SECONDARY_DNS_SERVER, CDN_FALLBACK_URL..."
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 focus:border-cyber-cyan text-cyber-cyan px-3 py-2 rounded text-xs outline-none font-mono"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">
                  Directive Value
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1.1.1.1, https://endpoint.internal..."
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 focus:border-cyber-cyan text-slate-200 px-3 py-2 rounded text-xs outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-black/50 border border-slate-700 text-slate-200 px-3 py-2 rounded text-xs outline-none font-mono"
                >
                  <option value="Network">Network</option>
                  <option value="WireGuard">WireGuard</option>
                  <option value="DNS">DNS</option>
                  <option value="Security">Security</option>
                  <option value="System">System</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-slate-400 mb-1">
                  Operational Explanation / Documentation
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain what this configuration directs, its impact, and syntax requirements..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-black/50 border border-slate-700 text-slate-200 px-3 py-2 rounded text-xs outline-none font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="secret-checkbox"
                  checked={newIsSecret}
                  onChange={(e) => setNewIsSecret(e.target.checked)}
                  className="rounded bg-black border-slate-700 text-cyber-cyan focus:ring-0 cursor-pointer"
                />
                <label htmlFor="secret-checkbox" className="text-[11px] text-slate-400 cursor-pointer flex items-center">
                  <Lock className="w-3 h-3 mr-1 text-cyber-green" />
                  Sensitive Directive (Mask value in table view)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <TacticalButton
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                >
                  CANCEL
                </TacticalButton>
                <TacticalButton
                  type="submit"
                  size="sm"
                  variant="cyan"
                >
                  COMMIT DIRECTIVE
                </TacticalButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
