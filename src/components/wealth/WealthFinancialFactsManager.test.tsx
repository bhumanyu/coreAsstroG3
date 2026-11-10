import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { WealthFinancialFactsManager } from './WealthFinancialFactsManager';
import { WealthFinancialFactsService, type WealthFinancialFactsStorage } from '../../domain/wealth/wealthFinancialFactsService';

class MemoryStorage implements WealthFinancialFactsStorage {
  private values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

describe('WealthFinancialFactsManager', () => {
  it('creates, edits and deletes user-reported facts with local-only privacy disclosure', () => {
    const service = new WealthFinancialFactsService(new MemoryStorage(), () => new Date('2026-11-10T05:00:00Z'), () => 'fact-1');
    render(<WealthFinancialFactsManager service={service} />);

    expect(screen.getByText(/stored only in this browser\/device/i)).toBeInTheDocument();
    expect(screen.getByText(/do not change chart calculations, confidence, financial suitability or predictions/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Amount / value'), { target: { value: '125000' } });
    fireEvent.change(screen.getByLabelText('Reference date'), { target: { value: '2026-11-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save financial fact' }));

    expect(screen.getByRole('status')).toHaveTextContent('Financial fact saved');
    expect(service.listFacts()).toMatchObject({ ok: true, value: [{ concept: 'INCOME', value: 125000, currency: 'INR' }] });

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Amount / value'), { target: { value: '140000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update financial fact' }));
    expect(service.listFacts()).toMatchObject({ ok: true, value: [{ id: 'fact-1', value: 140000 }] });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete financial fact?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(service.listFacts()).toMatchObject({ ok: true, value: [{ id: 'fact-1' }] });

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete financial fact' }));
    expect(service.listFacts()).toMatchObject({ ok: true, value: [] });
  });

  it('supports descriptive ownership records without showing amount or currency inputs', () => {
    const service = new WealthFinancialFactsService(new MemoryStorage(), () => new Date('2026-11-10T05:00:00Z'), () => 'asset-1');
    render(<WealthFinancialFactsManager service={service} />);
    fireEvent.change(screen.getByLabelText('Financial concept'), { target: { value: 'ASSET_OWNERSHIP' } });
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.queryByLabelText('Currency')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'One jointly owned residential property' } });
    fireEvent.change(screen.getByLabelText('Reference date'), { target: { value: '2026-11-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save financial fact' }));
    expect(service.listFacts()).toMatchObject({ ok: true, value: [{ concept: 'ASSET_OWNERSHIP', value: 'One jointly owned residential property' }] });
  });

  it('shows a recoverable storage quota error and never displays a save-success state', () => {
    const storage: WealthFinancialFactsStorage = {
      getItem: () => null,
      setItem: () => { throw new DOMException('quota', 'QuotaExceededError'); }
    };
    render(<WealthFinancialFactsManager service={new WealthFinancialFactsService(storage)} />);
    fireEvent.change(screen.getByLabelText('Amount / value'), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText('Reference date'), { target: { value: '2026-11-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save financial fact' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Browser storage is full');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
