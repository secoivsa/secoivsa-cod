import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, CloudSun, CloudFog, Snowflake, Zap } from "lucide-react";

type W = { temp: number; code: number } | null;

function iconFor(code: number) {
  if ([0].includes(code)) return Sun;
  if ([1, 2].includes(code)) return CloudSun;
  if ([3].includes(code)) return Cloud;
  if ([45, 48].includes(code)) return CloudFog;
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return CloudRain;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return Snowflake;
  if ([95, 96, 99].includes(code)) return Zap;
  return Cloud;
}

export function WeatherTime() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [w, setW] = useState<W>(null);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=22.2553&longitude=-97.8686&current=temperature_2m,weather_code&timezone=America%2FMexico_City"
    )
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const c = d?.current;
        if (c) setW({ temp: Math.round(c.temperature_2m), code: c.weather_code });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!mounted) return null;

  const Icon = iconFor(w?.code ?? 3);
  const time = now
    ? now.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Mexico_City",
      })
    : "--:--";

  return (
    <div className="hidden md:flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-white/55">
      <Icon className="w-3 h-3 text-[#7dc4ff]" strokeWidth={1.6} />
      {w ? <span className="text-white/80">{w.temp}°</span> : <span>--°</span>}
      <span className="w-px h-2.5 bg-white/15" />
      <span className="text-white/75 tabular-nums">{time}</span>
    </div>
  );
}
