import React, { useState } from 'react';
import {
  X,
  Users,
  Phone,
  Plus,
  Trash2,
  Smartphone,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Contact } from '../types';
import { isNativeAndroidAvailable, AndroidActionBridge } from '../services/androidBridge';

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, 'id'>) => void;
  onDeleteContact: (id: string) => void;
}

export const ContactsModal: React.FC<ContactsModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onAddContact,
  onDeleteContact,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nicknames, setNicknames] = useState('');
  const [relationship, setRelationship] = useState('');

  if (!isOpen) return null;

  const isNative = isNativeAndroidAvailable();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const nickArray = nicknames
      .split(',')
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean);

    onAddContact({
      name: name.trim(),
      phone: phone.trim(),
      nicknames: nickArray,
      relationship: relationship.trim() || undefined,
    });

    setName('');
    setPhone('');
    setNicknames('');
    setRelationship('');
    setIsAdding(false);
  };

  const handleTestCall = (contact: Contact) => {
    AndroidActionBridge.callContact(contact.name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-purple-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl shadow-purple-950/40 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-pink-400" />
            <h2 className="text-sm font-semibold text-neutral-100">
              Address Book & Android Action Bridge
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Status Banner */}
        <div className="p-3.5 bg-neutral-950/80 border-b border-neutral-800 shrink-0 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="font-medium text-neutral-200">
                  {isNative
                    ? 'Native Android Bridge Active'
                    : 'Web Browser Deep Link Mode'}
                </span>
                <p className="text-[11px] text-neutral-400">
                  {isNative
                    ? 'Calls and apps launch directly via Android Intent wrapper.'
                    : 'Phone calls and WhatsApp open via tel: and wa.me deep links.'}
                </p>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                isNative
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              }`}
            >
              {isNative ? 'APK BRIDGE' : 'WEB FALLBACK'}
            </span>
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300">
              Saved Contacts ({contacts.length})
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdding ? 'Cancel' : 'Add Contact'}</span>
            </button>
          </div>

          {/* Add Contact Form */}
          {isAdding && (
            <form
              onSubmit={handleCreate}
              className="p-3.5 rounded-xl border border-neutral-700 bg-neutral-950 space-y-2.5 text-xs"
            >
              <div>
                <label className="text-neutral-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma or Mummy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-neutral-400 block mb-1">
                  Nicknames / Speech Variations (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. mummy, mom, maa"
                  value={nicknames}
                  onChange={(e) => setNicknames(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-neutral-950 font-semibold text-xs hover:bg-amber-400"
                >
                  Save Contact
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-neutral-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-200">
                      {c.name}
                    </span>
                    {c.relationship && (
                      <span className="text-[10px] text-neutral-400">
                        ({c.relationship})
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-amber-300/90 mt-0.5 tabular-nums">
                    {c.phone}
                  </p>
                  {c.nicknames && c.nicknames.length > 0 && (
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Spoken aliases: {c.nicknames.join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleTestCall(c)}
                    title="Initiate call"
                    className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors text-xs flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteContact(c.id)}
                    title="Delete contact"
                    className="p-2 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-850 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/90 text-[11px] text-neutral-400 flex items-center gap-1.5 shrink-0">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Say &ldquo;Call Mom&rdquo; or &ldquo;Mummy ko call karo&rdquo; and Arushi will look up the number and initiate the call.
          </span>
        </div>
      </div>
    </div>
  );
};
