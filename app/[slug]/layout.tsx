import SmartAppHeader from "@/components/SmartAppHeader";

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <>
      <SmartAppHeader />
      <div className="pb-[76px] pt-[64px] sm:pb-[80px] sm:pt-[72px]">
        {children}
      </div>
    </>
  );
}
