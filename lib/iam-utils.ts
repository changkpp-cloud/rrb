export type AppRole = "super_admin" | "center_manager" | "center_staff" | "center_viewer";

export function roleLabel(role: AppRole | string | null) {
  switch (role) {
    case "super_admin":    return "แอดมินกลาง";
    case "center_manager": return "ผู้จัดการศูนย์";
    case "center_staff":   return "เจ้าหน้าที่ศูนย์";
    case "center_viewer":  return "ผู้ดูข้อมูล";
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
  return role === "super_admin" || role === "center_manager" || role === "center_staff";
}
