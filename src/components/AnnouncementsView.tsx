/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Megaphone,
  Pin,
  X
} from "lucide-react";
import { SystemUpdate } from "../types";

interface AnnouncementsViewProps {
  updates: SystemUpdate[];
  onAddUpdate: (update: SystemUpdate) => void;
  onTogglePinUpdate: (id: string) => void;
  onDeleteUpdate: (id: string) => void;
}

export default function AnnouncementsView({
  updates,
  onAddUpdate,
  onTogglePinUpdate,
  onDeleteUpdate
}: AnnouncementsViewProps) {
  // Announcement Form States
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");
  const [updateCategory, setUpdateCategory] = useState<"Umum" | "Sistem" | "Ujian">("Umum");
  const [isPinned, setIsPinned] = useState(false);

  const handleAddUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateTitle.trim() || !updateContent.trim()) {
      alert("Judul dan konten tidak boleh kosong!");
      return;
    }
    onAddUpdate({
      id: `up-id-${Date.now()}`,
      title: updateTitle,
      content: updateContent,
      date: new Date().toISOString().split("T")[0],
      category: updateCategory,
      isPinned: isPinned
    });
    setUpdateTitle("");
    setUpdateContent("");
    setIsPinned(false);
    setIsAddingUpdate(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Upper Tab Info */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 font-heading">Pengumuman Sistem Sekolah</h2>
        <p className="text-xs text-slate-500">
          Kelola berita dan pengumuman penting yang disiarkan di dasbor peserta CBT SDN 14 Singkawang.
        </p>
      </div>

      {/* SINGLE COLUMN: SYSTEM NOTIFICATIONS */}
      <div className="space-y-5 bg-white p-6 rounded-xl border border-slate-150 shadow-sm">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Megaphone size={16} className="text-red-600" />
            Siaran Update Pengumuman
          </h3>
          {!isAddingUpdate && (
            <button
              onClick={() => setIsAddingUpdate(true)}
              className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} /> Buat Siaran
            </button>
          )}
        </div>

        {/* Form Create Announcement */}
        {isAddingUpdate && (
          <form onSubmit={handleAddUpdateSubmit} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-700">Form Siaran Baru</span>
              <button type="button" onClick={() => setIsAddingUpdate(false)} className="text-slate-400 hover:text-slate-600">
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">JUDUL PENGUMUMAN *</label>
                <input
                  type="text"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  required
                  placeholder="Contoh: Jadwal Ujian Susulan Matematika"
                  className="w-full text-xs border border-slate-200 p-2 rounded-lg outline-none bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">KATEGORI *</label>
                <select
                  value={updateCategory}
                  onChange={(e) => setUpdateCategory(e.target.value as any)}
                  className="w-full text-xs border border-slate-200 p-2 rounded-lg outline-none bg-white font-sans"
                >
                  <option value="Umum">Umum</option>
                  <option value="Sistem">Sistem</option>
                  <option value="Ujian">Ujian</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block">KONTEN BULETIN *</label>
                <textarea
                  value={updateContent}
                  onChange={(e) => setUpdateContent(e.target.value)}
                  required
                  rows={3}
                  placeholder="Ketikkan perincian berita / pengumuman penting bagi siswa..."
                  className="w-full text-xs border border-slate-200 p-2 rounded-lg outline-none bg-white resize-none"
                ></textarea>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded border-slate-200 text-red-600 focus:ring-red-500 w-3.5 h-3.5"
                />
                <label htmlFor="isPinned" className="text-xs text-slate-600 font-semibold cursor-pointer">
                  Sematkan pengumuman (Sematkan di atas)
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg cursor-pointer"
            >
              Siarkan Sekarang
            </button>
          </form>
        )}

        {/* List of announcements */}
        <div className="space-y-4">
          {updates.map((upd) => (
            <div
              key={upd.id}
              className="p-4 rounded-xl border border-slate-100 hover:border-red-50 bg-slate-50/50 hover:bg-white transition relative group"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      upd.category === "Sistem"
                        ? "bg-slate-900 text-slate-200"
                        : upd.category === "Ujian"
                        ? "bg-red-100 text-red-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {upd.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{upd.date}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onTogglePinUpdate(upd.id)}
                      className={`p-1 hover:bg-slate-150 rounded cursor-pointer ${upd.isPinned ? "text-amber-500" : "text-slate-300 hover:text-slate-500"}`}
                      title={upd.isPinned ? "Lepas semat" : "Sematkan di atas"}
                    >
                      <Pin size={12} className={upd.isPinned ? "fill-amber-500" : ""} />
                    </button>
                    <button
                      onClick={() => onDeleteUpdate(upd.id)}
                      className="p-1 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded cursor-pointer"
                      title="Hapus Pengumuman"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                  {upd.isPinned && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                  {upd.title}
                </h4>
                <p className="text-slate-500 text-xs leading-relaxed">{upd.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
