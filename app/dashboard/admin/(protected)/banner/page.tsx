import BoardBannerAdmin from "@/components/admin/BoardBannerAdmin";
import { getSiteSettings, HOME_BOARD_IMAGE_KEY, HOME_BOARD_CAPTION_KEY } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function AdminBannerPage() {
  const settings = await getSiteSettings([HOME_BOARD_IMAGE_KEY, HOME_BOARD_CAPTION_KEY]);
  return (
    <BoardBannerAdmin
      currentImageUrl={settings[HOME_BOARD_IMAGE_KEY] ?? null}
      currentCaption={settings[HOME_BOARD_CAPTION_KEY] ?? ""}
    />
  );
}
