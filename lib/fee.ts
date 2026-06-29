// ค่าดำเนินการระบบหรีดร่วมบุญ = 10% ของยอดร่วมบุญรวม → เจ้าภาพได้สุทธิ 90%
// อ้างอิงแก่นโครงการ: เงิน 90% ถึงเจ้าภาพโดยตรง, 10% เข้าศูนย์เป็นค่าดำเนินการ
// (วัสดุ/กระดาษ/หมึกพิมพ์/ดูแลอุปกรณ์/กองทุนจิตอาสา) — เทศบาลไม่รับเงินจากระบบนี้
// สูตรเดียวกันทั้งฝั่งเจ้าภาพและฝั่งศูนย์ ห้ามคิดแยก
export const FEE_RATE = 0.1;

/** ค่าดำเนินการ = ปัดเศษ 10% ของยอดร่วมบุญรวม */
export function systemFee(totalAmount: number): number {
  return Math.round(totalAmount * FEE_RATE);
}

/** ยอดสุทธิที่โอนให้เจ้าภาพ = ยอดรวม − ค่าดำเนินการ (รับประกัน fee + net = total) */
export function netToHost(totalAmount: number): number {
  return Math.max(0, totalAmount - systemFee(totalAmount));
}
