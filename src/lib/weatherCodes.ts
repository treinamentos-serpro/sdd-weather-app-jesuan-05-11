export type WeatherIconName =
  | 'sun'
  | 'cloud-sun'
  | 'cloud'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'storm'
  | 'unknown';

export function getWeatherCondition(code: number | null): { label: string; icon: WeatherIconName } {
  switch (code) {
    case 0:
      return { label: 'Céu limpo', icon: 'sun' };
    case 1:
      return { label: 'Predominantemente ensolarado', icon: 'cloud-sun' };
    case 2:
      return { label: 'Parcialmente nublado', icon: 'cloud-sun' };
    case 3:
      return { label: 'Nublado', icon: 'cloud' };
    case 45:
    case 48:
      return { label: 'Nevoeiro', icon: 'fog' };
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return { label: 'Garoa', icon: 'drizzle' };
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return { label: 'Chuva', icon: 'rain' };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return { label: 'Neve', icon: 'snow' };
    case 95:
    case 96:
    case 99:
      return { label: 'Trovoadas', icon: 'storm' };
    default:
      return { label: 'Condição indisponível', icon: 'unknown' };
  }
}
