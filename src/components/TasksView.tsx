import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Sparkles,
  Search,
  Menu,
} from 'lucide-react';
import { TaskItem } from '../types';

interface TasksViewProps {
  tasks: TaskItem[];
  onAddTask: (task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onAskMayra: (prompt: string) => void;
  onToggleSidebarMobile: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onAskMayra,
  onToggleSidebarMobile,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'high'>('pending');
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('');

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending' && task.completed) return false;
    if (filter === 'completed' && !task.completed) return false;
    if (filter === 'high' && task.priority !== 'high') return false;
    if (search.trim() && !task.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      priority,
      completed: false,
      dueDate: dueDate || undefined,
      category: category.trim() || undefined,
    });

    setTitle('');
    setDueDate('');
    setCategory('');
    setIsAdding(false);
  };

  const handleConsultMayra = () => {
    const pending = tasks.filter((t) => !t.completed);
    if (pending.length === 0) {
      onAskMayra('I currently have no pending tasks. Can you suggest 3 high-impact habits or strategic planning activities to advance my goals?');
      return;
    }
    const taskSummary = pending
      .map((t, idx) => `${idx + 1}. [${t.priority.toUpperCase()}] ${t.title}${t.dueDate ? ` (Due: ${t.dueDate})` : ''}`)
      .join('\n');

    onAskMayra(
      `Mayra, please audit my current active tasks and organize them into an optimal execution sequence for maximum efficiency:\n\n${taskSummary}`
    );
  };

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto">
      {/* Header */}
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
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <h1 className="text-sm font-semibold text-neutral-100">Action Items & Tasks</h1>
            <span className="text-xs font-mono text-neutral-400 tabular-nums">
              ({pendingCount} pending)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleConsultMayra}
            title="Ask Mayra to audit and prioritize your tasks"
            className="px-3 py-1.5 rounded-lg bg-neutral-800 text-amber-300 hover:bg-neutral-750 text-xs font-medium border border-neutral-700 flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Ask Mayra to Prioritize</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-950 hover:bg-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-5">
        {/* Inline Add Task Form */}
        {isAdding && (
          <form
            onSubmit={handleCreate}
            className="p-4 rounded-xl border border-neutral-700/80 bg-neutral-900/90 shadow-md space-y-3"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-xs font-semibold text-neutral-200">Create New Action Item</span>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <div>
              <input
                type="text"
                placeholder="What needs to be accomplished?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
                >
                  <option value="high">High (Urgent)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="low">Low (Someday)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Category / Tag</label>
                <input
                  type="text"
                  placeholder="e.g. Work, Personal, Strategy"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 placeholder-neutral-600 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-amber-500 text-neutral-950 hover:bg-amber-400 font-semibold text-xs"
              >
                Save Task
              </button>
            </div>
          </form>
        )}

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Segmented Filter Control */}
          <div className="flex items-center p-1 bg-neutral-900 rounded-lg border border-neutral-800 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('high')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filter === 'high'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              High Priority
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 outline-none focus:border-neutral-700"
            />
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-neutral-850 bg-neutral-900/30 space-y-2">
              <CheckSquare className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-sm font-medium text-neutral-300">
                {tasks.length === 0 ? 'No action items yet' : 'No matching tasks'}
              </p>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                {tasks.length === 0
                  ? 'Keep track of daily goals, or ask Mayra during chat to add tasks for you.'
                  : 'Try changing your filter or clearing the search query.'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  task.completed
                    ? 'bg-neutral-900/40 border-neutral-850/80 opacity-60'
                    : 'bg-neutral-900/80 border-neutral-800 hover:border-neutral-750'
                }`}
              >
                <div className="flex items-center gap-3 truncate pr-3">
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className="text-neutral-400 hover:text-amber-400 transition-colors shrink-0"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  <div className="truncate">
                    <p
                      className={`text-sm font-medium truncate ${
                        task.completed
                          ? 'line-through text-neutral-500'
                          : 'text-neutral-200'
                      }`}
                    >
                      {task.title}
                    </p>

                    {/* Metadata line with subtle typographic separators */}
                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                      <span
                        className={`font-medium ${
                          task.priority === 'high'
                            ? 'text-red-400'
                            : task.priority === 'medium'
                            ? 'text-amber-400'
                            : 'text-blue-400'
                        }`}
                      >
                        {task.priority.toUpperCase()}
                      </span>

                      {task.dueDate && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 tabular-nums">
                            <Calendar className="w-3 h-3 text-neutral-500" />
                            <span>{task.dueDate}</span>
                          </span>
                        </>
                      )}

                      {task.category && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{task.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDeleteTask(task.id)}
                  title="Delete task"
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
