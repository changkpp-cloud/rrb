import { Suspense } from "react";
import { getMemorial } from "@/lib/memorial";
import CertificateClient from "./CertificateClient";

export const revalidate = 60;

export default async function CertificatePage() {
  const memorial = await getMemorial();
  return (
    <Suspense>
      <CertificateClient memorial={memorial} />
    </Suspense>
  );
}
