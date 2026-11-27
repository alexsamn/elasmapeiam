export interface ShareablePlace {
  title: string;
  address: string;
  position: [number, number];
}

export function directionsUrl(place: ShareablePlace): string {
  const [lat, lng] = place.position;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=bicycling`;
}

type SharingBrowser = Pick<Navigator, "share" | "clipboard">;

export async function sharePlace(place: ShareablePlace, browser: SharingBrowser): Promise<"shared" | "copied" | "cancelled"> {
  const url = directionsUrl(place);
  const text = `${place.title}\n${place.address}`;
  if (typeof browser.share === "function") {
    try {
      await browser.share({ title: place.title, text, url });
      return "shared";
    } catch (error) {
      if (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError") return "cancelled";
    }
  }
  if (!browser.clipboard?.writeText) throw new Error("Clipboard unavailable");
  await browser.clipboard.writeText(`${text}\n${url}`);
  return "copied";
}