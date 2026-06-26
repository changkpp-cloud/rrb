"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Users } from "lucide-react";

export type MemorialPerson = {
  id: string;
  display_name: string;
  relationship: string;
  role_in_photo: string;
  photo_url: string | null;
  is_primary: boolean;
  allow_in_sim?: boolean;
};

interface Props {
  memorialId: string;
  selectedId: string | null;
  onChange: (person: MemorialPerson | null) => void;
}

export default function HostPersonPicker({ memorialId, selectedId, onChange }: Props) {
  const [persons, setPersons] = useState<MemorialPerson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/memorials/${memorialId}/persons`)
      .then(r => r.json())
      .then(d => setPersons(d.persons ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [memorialId]);

  if (loading) return (
    <div className="flex items-center gap-2 py-3 text-gold-400">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-xs">กำลังโหลดข้อมูลบุคคล...</span>
    </div>
  );

  return (
    <div className="space-y-2">
      {persons.length === 0 ? null : (
        <div className="space-y-2">
          {/* ไม่เลือก */}
          <button
            type="button"
            onClick={() => onChange(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
              selectedId === null
                ? "border-gold-400 bg-gold-50"
                : "border-gold-200 bg-white"
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-cream-100 border border-gold-200 flex items-center justify-center shrink-0">
              <span className="text-lg">—</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gold-700">ไม่เลือกบุคคลในภาพ</p>
              <p className="text-[10px] text-gold-400">ภาพจะมีเฉพาะผู้มอบเท่านั้น</p>
            </div>
            {selectedId === null && <Check className="w-4 h-4 text-gold-500 shrink-0" />}
          </button>

          {persons.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${
                selectedId === p.id
                  ? "border-gold-400 bg-gold-50"
                  : "border-gold-200 bg-white"
              }`}
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-gold-300 shrink-0 bg-cream-100">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.display_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gold-400 text-sm font-bold">
                    {p.display_name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-gold-800 truncate">{p.display_name}</p>
                  {p.is_primary && (
                    <span className="shrink-0 text-[9px] bg-gold-100 text-gold-700 px-1.5 py-0.5 rounded-full font-semibold">
                      เจ้าภาพหลัก
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gold-500">{p.relationship} · {p.role_in_photo}</p>
              </div>
              {selectedId === p.id && <Check className="w-4 h-4 text-gold-500 shrink-0" />}
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
