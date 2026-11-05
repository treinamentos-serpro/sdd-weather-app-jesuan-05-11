import { ArrowUpRight, MapPin } from 'lucide-react';
import type { City } from '../types/weather';

interface CityResultsProps {
  cities: City[];
  onSelect: (city: City) => void;
}

export default function CityResults({ cities, onSelect }: CityResultsProps) {
  return (
    <section aria-label="Resultados da busca" className="border-b border-white/10 py-5">
      <p role="status" aria-atomic="true" className="mb-3 text-sm text-slate-300">
        {cities.length} {cities.length === 1 ? 'cidade encontrada' : 'cidades encontradas'}
      </p>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <li key={`${city.latitude}:${city.longitude}`}>
            <button
              type="button"
              aria-label={[city.name, city.region, city.country].filter(Boolean).join(', ')}
              onClick={() => onSelect(city)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-400 bg-white/5 p-4 text-left backdrop-blur-md transition-colors hover:border-cyan-300 hover:bg-white/10"
            >
              <MapPin size={18} className="shrink-0 text-cyan-200" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block break-words font-medium">{city.name}</span>
                <span className="block break-words text-xs text-slate-300">
                  {[city.region, city.country].filter(Boolean).join(', ')}
                </span>
              </span>
              <ArrowUpRight size={18} aria-hidden="true" className="shrink-0 text-slate-400" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
