import { CloudSun } from 'lucide-react';
import { useEffect, useRef } from 'react';
import CityResults from './components/CityResults';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import useWeather from './hooks/useWeather';

export default function App() {
  const {
    query,
    setQuery,
    unit,
    setUnit,
    searchStatus,
    searchResults,
    searchError,
    search,
    selectedCity,
    selectCity,
    weatherStatus,
    weather,
    weatherError,
    retrySearch,
    retryWeather,
  } = useWeather();
  const contentRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedCity) contentRef.current?.focus();
  }, [selectedCity]);

  return (
    <div className="app-shell min-h-screen text-white">
      <a
        href="#weather-content"
        className="sr-only z-50 rounded-md bg-white p-3 text-night-900 focus:not-sr-only focus:absolute focus:left-4 focus:top-4"
      >
        Ir para o conteúdo
      </a>
      <header className="border-b border-white/10 bg-night-900/60 backdrop-blur-md">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-5 px-5 py-5 sm:px-8 md:grid-cols-[1fr_minmax(240px,380px)_auto] md:gap-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <CloudSun aria-hidden="true" className="h-7 w-7 shrink-0 text-sun sm:h-8 sm:w-8" />
            <span className="text-base font-semibold sm:text-xl">
              Weather<span className="text-cyan-200">View</span>
            </span>
          </div>
          <div className="col-span-2 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1">
            <SearchBar
              inputRef={searchInputRef}
              value={query}
              onChange={setQuery}
              onSearch={() => {
                void search();
              }}
              isLoading={searchStatus === 'loading'}
            />
          </div>
          <div className="col-start-2 row-start-1 md:col-start-3">
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>
        </div>
      </header>
      <main
        ref={contentRef}
        id="weather-content"
        aria-label={selectedCity ? `Tempo em ${selectedCity.name}` : 'Consulta do tempo'}
        tabIndex={-1}
        className="mx-auto max-w-6xl px-5 outline-none sm:px-8"
      >
        {searchStatus === 'loading' && <LoadingState message="Buscando cidades…" />}
        {searchStatus === 'success' && (
          <CityResults
            cities={searchResults}
            onSelect={(city) => {
              void selectCity(city);
            }}
          />
        )}
        {searchStatus === 'empty' && <EmptyState message="Nenhuma cidade encontrada." />}
        {searchStatus === 'error' && (
          <ErrorState
            message={searchError ?? 'Não foi possível buscar cidades.'}
            retryLabel="Tentar buscar novamente"
            onRetry={() => {
              searchInputRef.current?.focus();
              void retrySearch();
            }}
          />
        )}
        {!selectedCity ? (
          <section className="min-h-64 py-14">
            <h1 className="text-3xl font-semibold">Previsão do tempo</h1>
            <EmptyState message="Nenhuma cidade selecionada." />
          </section>
        ) : (
          <div>
            {!(weatherStatus === 'success' && weather?.current) && (
              <div className="pt-10">
                <h1 className="break-words text-3xl font-semibold">{selectedCity.name}</h1>
                <p className="mt-2 break-words text-sm text-slate-300">
                  {[selectedCity.region, selectedCity.country].filter(Boolean).join(' · ')}
                </p>
              </div>
            )}
            {weatherStatus === 'loading' && <LoadingState />}
            {weatherStatus === 'error' && (
              <ErrorState
                message={weatherError ?? 'Não foi possível consultar o tempo.'}
                retryLabel="Tentar consultar o tempo novamente"
                onRetry={() => {
                  contentRef.current?.focus();
                  void retryWeather();
                }}
              />
            )}
            {weatherStatus === 'success' && weather && (
              <>
                {weather.current ? (
                  <CurrentWeather city={selectedCity} weather={weather.current} unit={unit} />
                ) : (
                  <EmptyState message="Clima atual indisponível." />
                )}
                <ForecastList days={weather.forecast} unit={unit} />
              </>
            )}
          </div>
        )}
      </main>
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-6 text-xs leading-5 text-slate-300 sm:px-8">
        <p>WeatherView</p>
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 hover:text-white"
        >
          Dados meteorológicos por Open-Meteo
        </a>
      </footer>
    </div>
  );
}
