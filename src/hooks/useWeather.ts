import { useEffect, useRef, useState } from 'react';
import { getWeather, searchCities } from '../services/weatherService';
import type { City, TemperatureUnit, WeatherData } from '../types/weather';

type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

interface WeatherViewState {
  query: string;
  searchStatus: SearchStatus;
  searchResults: City[];
  searchError: string | null;
  selectedCity: City | null;
  weatherStatus: 'idle' | 'loading' | 'success' | 'error';
  weather: WeatherData | null;
  weatherError: string | null;
  unit: TemperatureUnit;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Não foi possível consultar os dados. Tente novamente.';
}

export default function useWeather() {
  const [state, setState] = useState<WeatherViewState>({
    query: '',
    searchStatus: 'idle',
    searchResults: [],
    searchError: null,
    selectedCity: null,
    weatherStatus: 'idle',
    weather: null,
    weatherError: null,
    unit: 'celsius',
  });
  const searchController = useRef<AbortController | null>(null);
  const weatherController = useRef<AbortController | null>(null);
  const lastSearch = useRef('');

  useEffect(
    () => () => {
      searchController.current?.abort();
      weatherController.current?.abort();
      searchController.current = null;
      weatherController.current = null;
    },
    [],
  );

  function setQuery(query: string) {
    searchController.current?.abort();
    searchController.current = null;
    setState((previous) => ({
      ...previous,
      query,
      searchStatus: previous.searchStatus === 'loading' ? 'idle' : previous.searchStatus,
    }));
  }

  function setUnit(unit: TemperatureUnit) {
    setState((previous) => ({ ...previous, unit }));
  }

  async function search(query = state.query) {
    const name = query.trim();
    if (!name) return;
    searchController.current?.abort();
    const controller = new AbortController();
    searchController.current = controller;
    lastSearch.current = name;
    setState((previous) => ({
      ...previous,
      searchStatus: 'loading',
      searchResults: [],
      searchError: null,
    }));
    try {
      const cities = await searchCities(name, controller.signal);
      if (searchController.current !== controller || controller.signal.aborted) return;
      setState((previous) => ({
        ...previous,
        searchStatus: cities.length ? 'success' : 'empty',
        searchResults: cities,
      }));
    } catch (error) {
      if (searchController.current !== controller || controller.signal.aborted) return;
      setState((previous) => ({
        ...previous,
        searchStatus: 'error',
        searchError: errorMessage(error),
      }));
    }
  }

  async function loadWeather(city: City) {
    weatherController.current?.abort();
    const controller = new AbortController();
    weatherController.current = controller;
    setState((previous) => ({
      ...previous,
      selectedCity: city,
      weatherStatus: 'loading',
      weather: null,
      weatherError: null,
    }));
    try {
      const weather = await getWeather(city.latitude, city.longitude, controller.signal);
      if (weatherController.current !== controller || controller.signal.aborted) return;
      setState((previous) => ({ ...previous, weatherStatus: 'success', weather }));
    } catch (error) {
      if (weatherController.current !== controller || controller.signal.aborted) return;
      setState((previous) => ({
        ...previous,
        weatherStatus: 'error',
        weatherError: errorMessage(error),
      }));
    }
  }

  async function selectCity(city: City) {
    searchController.current?.abort();
    searchController.current = null;
    setState((previous) => ({
      ...previous,
      query: '',
      searchStatus: 'idle',
      searchResults: [],
      searchError: null,
    }));
    await loadWeather(city);
  }

  function retrySearch() {
    return search(lastSearch.current);
  }

  function retryWeather() {
    if (state.selectedCity) return loadWeather(state.selectedCity);
  }

  return { ...state, setQuery, setUnit, search, selectCity, retrySearch, retryWeather };
}
