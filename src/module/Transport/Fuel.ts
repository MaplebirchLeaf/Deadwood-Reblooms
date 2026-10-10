// ./src/module/Transport/Fuel.ts

import terms from '../../assets/transport/fuel.json';
import type Transport from '../Transport';
import type { Property } from '../Finance/PropertyCatalog';

export default class Fuel {
  public readonly terms = terms;

  public constructor(private readonly transport: Transport) {}

  public get garages(): readonly Property[] {
    const estate = this.transport.core.get('Finance')?.realEstate;
    if (!estate) return [];
    return estate.properties.filter(property => {
      if (!estate.owns(property.id) || estate.isFrozen(property.id)) return false;
      const management = estate.managementFor(property.id);
      return !management.rented && property.extensions.some(extension => extension.id === 'garage' && (extension.cost === 0 || management.upgrades.includes(extension.id)));
    });
  }

  public get current(): Property | null {
    const property = this.transport.core.get('Finance')?.realEstate.current;
    return this.transport.atGarage && property && this.garages.some(garage => garage.id === property.id) ? property : null;
  }

  public get store(): { cans: number; litres: number } {
    return (this.current && this.transport.state.fuel_stores?.[this.current.id]) || { cans: 0, litres: 0 };
  }

  public get refill_amount(): number {
    const vehicle = this.transport.vehicle;
    const model = this.transport.model;
    if (!this.current || !vehicle || !model || vehicle.garage !== this.current.id || !this.transport.nearby.includes(vehicle)) return 0;
    return Math.max(0, Math.round(Math.min(this.store.litres, model.tank - vehicle.fuel) * 100) / 100);
  }

  public quote(id: string, new_can: boolean): { litres: number; price: number } | null {
    if (!this.garages.some(property => property.id === id)) return null;
    const store = this.transport.state.fuel_stores?.[id] ?? { cans: 0, litres: 0 };
    if (new_can && store.cans >= terms.garage_cans) return null;
    const litres = new_can ? terms.can_capacity : Math.round((store.cans * terms.can_capacity - store.litres) * 100) / 100;
    if (litres <= 0) return null;
    return { litres, price: Math.ceil(litres * terms.price_per_litre) + terms.delivery_fee + (new_can ? terms.can_price : 0) };
  }

  public deliver(id: string, new_can: boolean): boolean {
    if (this.transport.core.passage.title !== 'Deadwood Transport Petrol' || this.transport.state.shop !== 'petrol' || !this.transport.ready || !this.transport.shopOpen) return false;
    const order = this.quote(id, new_can);
    if (!order || !this.transport.canPay(order.price)) return false;
    this.transport.core.SugarCube.Wikifier.wikifyEval(`<<money -${order.price} 'transport'>>`);
    const store = ((this.transport.state.fuel_stores ??= {})[id] ??= { cans: 0, litres: 0 });
    if (new_can) store.cans++;
    store.litres = Math.round((store.litres + order.litres) * 100) / 100;
    this.transport.state.notice = 'delivered';
    this.transport.core.SugarCube.Wikifier.wikifyEval(`<<pass ${terms.delivery_minutes}>>`);
    return true;
  }

  public refill(): boolean {
    if (this.transport.core.passage.title !== 'Deadwood Transport Menu' || !this.transport.ready) return false;
    const amount = this.refill_amount;
    if (amount <= 0) return false;
    const store = this.transport.state.fuel_stores[this.current!.id];
    this.transport.vehicle!.fuel = Math.round((this.transport.vehicle!.fuel + amount) * 100) / 100;
    store.litres = Math.max(0, Math.round((store.litres - amount) * 100) / 100);
    this.transport.state.notice = 'refilled';
    this.transport.core.SugarCube.Wikifier.wikifyEval(`<<pass ${terms.refill_minutes}>>`);
    return true;
  }
}
