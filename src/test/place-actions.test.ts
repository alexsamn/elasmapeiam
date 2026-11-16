import { describe, expect, it, vi } from "vitest";
import { directionsUrl, sharePlace } from "@/lib/place-actions";

const place = { title: "Paraciclo Largo da Batata", address: "Largo da Batata, Pinheiros", position: [-23.5668, -46.6936] as [number, number] };
const url = "https://www.google.com/maps/dir/?api=1&destination=-23.5668,-46.6936&travelmode=bicycling";

describe("Map place actions", () => {
  it("opens cycling directions to the place coordinates", () => {
    expect(directionsUrl(place)).toBe(url);
  });
  it("shares the place name, address and link using Web Share", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    expect(await sharePlace(place, { share, clipboard: { writeText } as unknown as Clipboard })).toBe("shared");
    expect(share).toHaveBeenCalledWith({ title: place.title, text: "Paraciclo Largo da Batata\nLargo da Batata, Pinheiros", url });
    expect(writeText).not.toHaveBeenCalled();
  });
  it("copies the name, address and link when Web Share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await sharePlace(place, { share: undefined, clipboard: { writeText } } as unknown as Navigator)).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(`Paraciclo Largo da Batata\nLargo da Batata, Pinheiros\n${url}`);
  });
  it("does not copy when sharing is cancelled", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("Cancelled", "AbortError"));
    const writeText = vi.fn();
    expect(await sharePlace(place, { share, clipboard: { writeText } as unknown as Clipboard })).toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });
  it("falls back to copying after Web Share fails", async () => {
    const share = vi.fn().mockRejectedValue(new Error("Not supported"));
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await sharePlace(place, { share, clipboard: { writeText } as unknown as Clipboard })).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining(url));
  });
  it("does not report a copy when clipboard access fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Denied"));
    await expect(sharePlace(place, { share: undefined, clipboard: { writeText } } as unknown as Navigator)).rejects.toThrow("Denied");
  });
});