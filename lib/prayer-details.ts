const SCHEDULE_PREFIX = "กำหนดการสวด:";
const LOCATION_PREFIX = "สถานที่สวด:";

export function parsePrayerDetails(prayerDate?: string | null, prayerLocation?: string | null) {
  const raw = prayerLocation ?? "";
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const scheduleLine = lines.find((line) => line.startsWith(SCHEDULE_PREFIX));
  const locationLine = lines.find((line) => line.startsWith(LOCATION_PREFIX));

  return {
    schedule: scheduleLine
      ? scheduleLine.slice(SCHEDULE_PREFIX.length).trim()
      : prayerDate ?? "",
    location: locationLine
      ? locationLine.slice(LOCATION_PREFIX.length).trim()
      : raw,
    isStructured: Boolean(scheduleLine || locationLine),
  };
}

export function serializePrayerDetails(schedule?: string | null, location?: string | null) {
  const cleanSchedule = schedule?.trim();
  const cleanLocation = location?.trim();

  if (cleanSchedule) {
    return [
      `${SCHEDULE_PREFIX} ${cleanSchedule}`,
      cleanLocation ? `${LOCATION_PREFIX} ${cleanLocation}` : "",
    ].filter(Boolean).join("\n");
  }

  return cleanLocation || null;
}
