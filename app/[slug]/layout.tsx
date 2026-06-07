import SlugBottomNav from "@/components/SlugBottomNav";

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
      {children}
      <SlugBottomNav slug={slug} />
    </>
  );
}
