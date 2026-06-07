import DashboardAppHeader from "@/components/DashboardAppHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pt-[64px] pb-[76px] sm:pt-[72px] sm:pb-[80px]">
      <DashboardAppHeader />
      {children}
    </div>
  );
}
