export type BrowserLocation = {
  lat: number;
  lng: number;
  accuracy?: number;
};

export function formatSecondsLeft(ms: number): string {
  const total = Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 1000)) : 0;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function checkInPathForToken(token: string): string {
  return `/attendance/check-in?t=${encodeURIComponent(token)}`;
}

export function requestBrowserLocation(): Promise<BrowserLocation | null> {
  return new Promise((resolve) => {
    try {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        resolve(null);
        return;
      }
      let settled = false;
      const done = (value: BrowserLocation | null) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const timer = window.setTimeout(() => done(null), 8000);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          window.clearTimeout(timer);
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            done(null);
            return;
          }
          done(
            Number.isFinite(accuracy)
              ? { lat, lng, accuracy }
              : { lat, lng },
          );
        },
        () => {
          window.clearTimeout(timer);
          done(null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
      );
    } catch {
      resolve(null);
    }
  });
}
