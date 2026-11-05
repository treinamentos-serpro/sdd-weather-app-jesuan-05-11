import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import UnitToggle from '../../../src/components/UnitToggle';

describe('UnitToggle — RF4, RNF2, T-25', () => {
  it('anuncia a unidade e alterna nos dois sentidos por teclado uma vez por selecao', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<UnitToggle unit="celsius" onChange={onChange} />);
    expect(screen.getByRole('group', { name: 'Unidade de temperatura' })).toBeVisible();
    const celsius = screen.getByRole('radio', { name: 'Celsius' });
    const fahrenheit = screen.getByRole('radio', { name: 'Fahrenheit' });
    expect(celsius).toBeChecked();
    expect(fahrenheit).not.toBeChecked();
    await user.tab();
    expect(celsius).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('fahrenheit');
    rerender(<UnitToggle unit="fahrenheit" onChange={onChange} />);
    expect(fahrenheit).toBeChecked();
    expect(celsius).not.toBeChecked();
    await user.keyboard('{ArrowLeft}');
    expect(onChange.mock.calls).toEqual([['fahrenheit'], ['celsius']]);
    rerender(<UnitToggle unit="celsius" onChange={onChange} />);
    expect(celsius).toBeChecked();
  });

  it('nao emite mudanca ao selecionar novamente a unidade atual', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);
    await user.click(screen.getByRole('radio', { name: 'Celsius' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
