import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../../src/components/SearchBar';

describe('SearchBar — RF1, T-24', () => {
  it.each(['', '   '])('valida "%s" e associa a orientacao ao campo', async (value) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar value={value} onChange={vi.fn()} onSearch={onSearch} />);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    const input = screen.getByRole('searchbox', { name: 'Buscar cidade' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveFocus();
    expect(input).toHaveAccessibleDescription('Informe o nome de uma cidade.');
    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome de uma cidade.');
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('remove a validacao ao editar e envia nomes com acentos e caracteres especiais', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onSearch = vi.fn();
    const { rerender } = render(<SearchBar value="" onChange={onChange} onSearch={onSearch} />);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    const input = screen.getByRole('searchbox', { name: 'Buscar cidade' });
    await user.type(input, 'S');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('S');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    rerender(<SearchBar value="São Paulo & região" onChange={onChange} onSearch={onSearch} />);
    await user.keyboard('{Enter}');
    expect(onSearch).toHaveBeenCalledOnce();
  });
});
