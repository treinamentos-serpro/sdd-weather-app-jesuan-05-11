import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CityResults from '../../../src/components/CityResults';
import { city, otherCity } from '../../fixtures/weather';

describe('CityResults — RF1, T-24', () => {
  it('distingue homonimos por regiao e pais e seleciona o local correto pelo teclado', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const cities = [
      { ...city, name: 'Santa Maria', region: 'Rio Grande do Sul' },
      { ...otherCity, name: 'Santa Maria', region: 'Califórnia', country: 'Estados Unidos' },
    ];
    render(<CityResults cities={cities} onSelect={onSelect} />);
    const results = within(screen.getByRole('region', { name: 'Resultados da busca' }));
    expect(results.getByRole('status')).toHaveTextContent('2 cidades encontradas');
    expect(
      results.getByRole('button', { name: 'Santa Maria, Rio Grande do Sul, Brasil' }),
    ).toBeVisible();
    await user.tab();
    await user.tab();
    expect(
      results.getByRole('button', { name: 'Santa Maria, Califórnia, Estados Unidos' }),
    ).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledExactlyOnceWith(cities[1]);
  });

  it('exibe apenas contexto disponivel, sem null ou separadores vazios', () => {
    render(<CityResults cities={[{ ...city, region: null }]} onSelect={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'São Paulo, Brasil' })).toBeVisible();
    expect(screen.getByRole('status')).toHaveTextContent('1 cidade encontrada');
  });
});
