import React, { useState } from 'react';
import {
  Wrench,
  Mail,
  CheckCircle,
  FileCheck,
  Scale,
  Sparkles,
  Copy,
  Check,
  ArrowUpRight,
  Menu,
} from 'lucide-react';
import { runExecutiveTool } from '../services/api';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ToolsViewProps {
  onAskMayra: (prompt: string) => void;
  onToggleSidebarMobile: () => void;
}

export const ToolsView: React.FC<ToolsViewProps> = ({
  onAskMayra,
  onToggleSidebarMobile,
}) => {
  const [activeTool, setActiveTool] = useState<'email' | 'polish' | 'tasks' | 'decision'>('email');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExecute = async () => {
    if (!input.trim() || isLoading) return;

    try {
      setIsLoading(true);
      let actionType = '';
      if (activeTool === 'email') actionType = 'draft_email';
      else if (activeTool === 'polish') actionType = 'refine_tone';
      else if (activeTool === 'tasks') actionType = 'extract_tasks';
      else actionType = 'summarize_notes';

      const result = await runExecutiveTool(actionType, input);
      setOutput(result);
    } catch (err) {
      console.error('Tool execution error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToChat = () => {
    if (!output) return;
    onAskMayra(
      `Mayra, here is the result from the executive tool:\n\n${output}\n\nCan we refine this further or discuss the next steps?`
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto">
      {/* Top Header */}
      <header className="h-14 border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebarMobile}
            className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            <h1 className="text-sm font-semibold text-neutral-100">Mayra’s Executive Tools</h1>
          </div>
        </div>
      </header>

      {/* Main Tool Container */}
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6">
        {/* Tool Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTool('email');
              setOutput('');
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTool === 'email'
                ? 'bg-neutral-900 border-amber-500/40 text-white shadow-xs'
                : 'bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200'
            }`}
          >
            <Mail className="w-4 h-4 text-amber-400 mb-1.5" />
            <p className="text-xs font-semibold">Draft Executive Email</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Polished & persuasive</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool('polish');
              setOutput('');
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTool === 'polish'
                ? 'bg-neutral-900 border-amber-500/40 text-white shadow-xs'
                : 'bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200'
            }`}
          >
            <FileCheck className="w-4 h-4 text-amber-400 mb-1.5" />
            <p className="text-xs font-semibold">Polish & Elevate Text</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Clarity & cadence</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool('tasks');
              setOutput('');
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTool === 'tasks'
                ? 'bg-neutral-900 border-amber-500/40 text-white shadow-xs'
                : 'bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-amber-400 mb-1.5" />
            <p className="text-xs font-semibold">Extract Action Items</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">From notes or chat</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTool('decision');
              setOutput('');
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeTool === 'decision'
                ? 'bg-neutral-900 border-amber-500/40 text-white shadow-xs'
                : 'bg-neutral-900/40 border-neutral-800 text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200'
            }`}
          >
            <Scale className="w-4 h-4 text-amber-400 mb-1.5" />
            <p className="text-xs font-semibold">Strategic Decisions</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Pros, cons & risks</p>
          </button>
        </div>

        {/* Input Box */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 space-y-3">
          <label className="text-xs font-semibold text-neutral-200 block">
            {activeTool === 'email' && 'Email Objective & Rough Outline'}
            {activeTool === 'polish' && 'Draft Text to Refine'}
            {activeTool === 'tasks' && 'Meeting Notes or Message to Extract Tasks From'}
            {activeTool === 'decision' && 'Decision or Dilemma Context'}
          </label>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            placeholder={
              activeTool === 'email'
                ? 'e.g. Follow up with Sarah regarding the Q3 product roadmap. Thank her for the review, confirm our sync on Thursday 2pm, and ask for the final budget sheet.'
                : activeTool === 'polish'
                ? 'Paste raw draft text to polish with executive clarity...'
                : activeTool === 'tasks'
                ? 'Paste notes, transcripts, or updates to distill into a clean action checklist...'
                : 'Describe the two or more options you are weighing, key trade-offs, and your primary criteria...'
            }
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-amber-500/60 leading-relaxed"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleExecute}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Mayra is generating...' : 'Run with Mayra'}</span>
            </button>
          </div>
        </div>

        {/* Output Box */}
        {output && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Mayra’s Output
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs flex items-center gap-1 border border-neutral-700/80"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSendToChat}
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-300 text-xs flex items-center gap-1 border border-neutral-700/80"
                >
                  <span>Discuss in Chat</span>
                  <ArrowUpRight className="w-3 h-3 text-amber-400" />
                </button>
              </div>
            </div>

            <div className="text-neutral-200">
              <MarkdownRenderer content={output} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
