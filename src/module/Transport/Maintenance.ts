// ./src/module/Transport/Maintenance.ts

import type Transport from '../Transport';

export default class Maintenance {
  public constructor(private readonly transport: Transport) {}

  public settle(day = Math.floor(Time.days)): void {
    if (V.replayScene || V.statFreeze) return;
    const bank = this.transport.core.get('Finance')?.state.bank;
    for (const vehicle of this.transport.state.vehicles) {
      const model = this.transport.catalog.models.find(model => model.id === vehicle.model);
      if (!model) continue;
      vehicle.upkeep_day ??= day;
      const weeks = Math.max(0, Math.floor((day - vehicle.upkeep_day) / 7));
      if (!weeks) continue;
      vehicle.upkeep_day += weeks * 7;
      vehicle.arrears = (vehicle.arrears ?? 0) + weeks * model.weekly_upkeep;
      const payment = bank?.opened ? Math.clamp(bank.balance, 0, vehicle.arrears) : 0;
      if (bank) bank.balance -= payment;
      vehicle.arrears -= payment;
    }
  }

  public pay(method: 'cash' | 'bank' = 'bank'): boolean {
    const vehicle = this.transport.vehicle;
    const bank = this.transport.core.get('Finance')?.state.bank;
    if (
      !['Deadwood Transport Menu', 'Deadwood Transport Sell'].includes(this.transport.core.passage.title) ||
      (this.transport.core.passage.title === 'Deadwood Transport Sell' && !this.transport.dealerOpen) ||
      !this.transport.ready ||
      !vehicle ||
      !this.transport.nearby.includes(vehicle) ||
      (vehicle.arrears ?? 0) <= 0
    )
      return false;
    const amount = vehicle.arrears!;
    if (method === 'cash') {
      if (V.money < amount) return false;
      V.money -= amount;
    } else if (method === 'bank' && bank?.opened && bank.balance >= amount) bank.balance -= amount;
    else return false;
    vehicle.arrears = 0;
    return true;
  }
}
