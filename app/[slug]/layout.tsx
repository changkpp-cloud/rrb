import SmartAppHeader from "@/components/SmartAppHeader";
import ForceExternalBrowser from "@/components/ForceExternalBrowser";

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
      <ForceExternalBrowser />
      <SmartAppHeader slug={slug} />
      <div className="pb-[76px] pt-[64px] sm:pb-[80px] sm:pt-[72px]">
        {children}
      </div>
    </>
  );
}
