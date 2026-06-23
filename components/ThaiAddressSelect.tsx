"use client";

import { useEffect, useState } from "react";

export interface ThaiAddressValue {
  provinceCode?: number;
  provinceName?: string;
  districtCode?: number;
  districtName?: string;
  subdistrictCode?: number;
  subdistrictName?: string;
  postalCode?: number;
}

interface Province { code: number; name: string }
interface Amphure { code: number; provinceCode: number; name: string }
interface Tambon { code: number; districtCode: number; name: string; zip: number }

interface Props {
  value: ThaiAddressValue;
  onChange: (v: ThaiAddressValue) => void;
  required?: boolean;
}

const sel =
  "w-full px-3 py-2.5 rounded-xl gold-border bg-white text-gold-800 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 appearance-none disabled:bg-cream-100 disabled:text-gold-300 disabled:cursor-not-allowed";

/**
 * Cascading จังหวัด → อำเภอ → ตำบล → รหัสไปรษณีย์ (อัตโนมัติ)
 * จังหวัด/อำเภอ โหลดครั้งเดียว, ตำบล lazy-load ต่อจังหวัดตอนเลือกจังหวัด
 */
export default function ThaiAddressSelect({ value, onChange, required }: Props) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [amphures, setAmphures] = useState<Amphure[]>([]);
  const [tambons, setTambons] = useState<Tambon[]>([]);
  const [loadingTambons, setLoadingTambons] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/data/geo/provinces.json").then((r) => r.json()),
      fetch("/data/geo/amphures.json").then((r) => r.json()),
    ])
      .then(([p, a]) => { setProvinces(p); setAmphures(a); })
      .catch(() => {});
  }, []);

  // lazy-load ตำบลของจังหวัดที่เลือก
  useEffect(() => {
    if (!value.provinceCode) { setTambons([]); return; }
    setLoadingTambons(true);
    fetch(`/data/geo/tambons/${value.provinceCode}.json`)
      .then((r) => r.json())
      .then((t: Tambon[]) => setTambons(t))
      .catch(() => setTambons([]))
      .finally(() => setLoadingTambons(false));
  }, [value.provinceCode]);

  const districtsInProvince = amphures.filter((a) => a.provinceCode === value.provinceCode);
  const tambonsInDistrict = tambons.filter((t) => t.districtCode === value.districtCode);

  function selectProvince(code: number) {
    const p = provinces.find((x) => x.code === code);
    // เปลี่ยนจังหวัด → รีเซ็ตอำเภอ/ตำบล/ไปรษณีย์ทั้งหมด
    onChange({ provinceCode: code || undefined, provinceName: p?.name });
  }
  function selectDistrict(code: number) {
    const a = amphures.find((x) => x.code === code);
    // เปลี่ยนอำเภอ → รีเซ็ตตำบล/ไปรษณีย์
    onChange({
      provinceCode: value.provinceCode,
      provinceName: value.provinceName,
      districtCode: code || undefined,
      districtName: a?.name,
    });
  }
  function selectTambon(code: number) {
    const t = tambons.find((x) => x.code === code);
    onChange({ ...value, subdistrictCode: code || undefined, subdistrictName: t?.name, postalCode: t?.zip });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gold-600">จังหวัด{required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <select className={sel} value={value.provinceCode ?? ""} required={required}
            onChange={(e) => selectProvince(Number(e.target.value))}>
            <option value="">เลือกจังหวัด</option>
            {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gold-600">อำเภอ / เขต{required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <select className={sel} value={value.districtCode ?? ""} required={required} disabled={!value.provinceCode}
            onChange={(e) => selectDistrict(Number(e.target.value))}>
            <option value="">{value.provinceCode ? "เลือกอำเภอ / เขต" : "เลือกจังหวัดก่อน"}</option>
            {districtsInProvince.map((a) => <option key={a.code} value={a.code}>{a.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gold-600">ตำบล / แขวง{required && <span className="text-red-400 ml-0.5">*</span>}</label>
          <select className={sel} value={value.subdistrictCode ?? ""} required={required} disabled={!value.districtCode || loadingTambons}
            onChange={(e) => selectTambon(Number(e.target.value))}>
            <option value="">{loadingTambons ? "กำลังโหลด..." : value.districtCode ? "เลือกตำบล / แขวง" : "เลือกอำเภอก่อน"}</option>
            {tambonsInDistrict.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-gold-600">รหัสไปรษณีย์</label>
          <input type="text" className={`${sel} font-mono text-center`} value={value.postalCode ?? ""} readOnly placeholder="อัตโนมัติ" />
        </div>
      </div>
    </div>
  );
}
