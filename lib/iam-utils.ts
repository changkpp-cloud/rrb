export type AppRole = "super_admin" | "center_manager" | "center_staff" | "center_viewer" | "lgo_observer";

export function roleLabel(role: AppRole | string | null) {
  switch (role) {
    case "super_admin":    return "แอดมินกลาง";
    case "center_manager": return "แอดมินศูนย์";
    case "center_staff":   return "เจ้าหน้าที่ศูนย์";
    case "center_viewer":  return "ผู้ดูข้อมูล";
    case "lgo_observer":   return "ตัวแทน อปท. ประจำศูนย์ (ดูอย่างเดียว)";
    default:               return "ไม่ระบุ";
  }
}

export function canManageCenterUsers(role: AppRole | string | null) {
  return role === "super_admin" || role === "center_manager";
}

export function canManageCenterSettings(role: AppRole | string | null) {
  return role === "super_admin" || role === "center_manager";
}

export function canEditCenterWork(role: AppRole | string | null) {
  return role === "super_admin" || role === "center_manager";
}

/** ดึง/ส่งออกรายงานได้ — ทุก role ที่เข้าถึงศูนย์ได้ (รวมตัวแทนเทศบาล) */
export function canExportReports(role: AppRole | string | null) {
  return canEditCenterWork(role) || role === "center_viewer" || role === "lgo_observer";
}
