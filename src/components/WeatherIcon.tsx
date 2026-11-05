import {
  CircleHelp,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from 'lucide-react';
import { getWeatherCondition } from '../lib/weatherCodes';

interface WeatherIconProps {
  code: number | null;
  className?: string;
}

const icons = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: CloudSnow,
  storm: CloudLightning,
  unknown: CircleHelp,
};

export default function WeatherIcon({ code, className = 'h-12 w-12' }: WeatherIconProps) {
  const condition = getWeatherCondition(code);
  const Icon = icons[condition.icon];
  const color =
    condition.icon === 'sun' || condition.icon === 'cloud-sun' ? 'text-sun' : 'text-cyan-200';
  return <Icon aria-hidden="true" className={`${color} ${className}`} strokeWidth={1.35} />;
}
