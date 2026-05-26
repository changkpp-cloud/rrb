import { Suspense } from "react";
import { getMemorial } from "@/lib/memorial";
import ECardClient from "./ECardClient";
import type { Memorial } from "@/lib/supabase/types";

export const revalidate = 60;

export default async function ECardPage() {
  const memorial = await getMemorial();
  if (!memorial) return null;
  return (
    <Suspense>
      <ECardClient memorial={memorial} />
    </Suspense>
  );
}
