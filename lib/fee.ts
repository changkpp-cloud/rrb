// ค่าดำเนินการระบบหรีดร่วมบุญ = 5% ของยอดร่วมบุญรวม → เจ้าภาพได้สุทธิ 95%
// อ้างอิงแก่นโครงการ: เงิน 95% ถึงเจ้าภาพโดยตรง, 5% เป็นค่าดำเนินการ
// (วัสดุ/กระดาษ/หมึกพิมพ์/ดูแลอุปกรณ์/กองทุนจิตอาสา) — เทศบาลไม่รับเงินจากระบบนี้
// สูตรเดียวกันทั้งฝั่งเจ้าภาพและฝั่งศูนย์ ห้ามคิดแยก
export const FEE_RATE = 0.05;

/** ค่าดำเนินการ = ปัดเศษ 5% ของยอดร่วมบุญรวม */
export function systemFee(totalAmount: number): number {
  return Math.round(totalAmount * FEE_RATE);
}

/** ยอดสุทธิที่โอนให้เจ้าภาพ = ยอดรวม − ค่าดำเนินการ (รับประกัน fee + net = total) */
export function netToHost(totalAmount: number): number {
  return Math.max(0, totalAmount - systemFee(totalAmount));
}
