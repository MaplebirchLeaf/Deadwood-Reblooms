// ./src/module/Transport/Repairs.ts

import terms from '../../assets/transport/repairs.json';
import type Transport from '../Transport';

type RepairKind = 'bicycle' | 'motor';

export default class Repairs {
  public readonly terms = terms;

  public constructor(private readonly transport: Transport) {}

  public get kind(): RepairKind {
    return this.transport.model?.kind === 'bicycle' ? 'bicycle' : 'motor';
  }

  public get amount(): number {
    const vehicle = this.transport.vehicle;
    if (
      !this.transport.ready ||
      !vehicle ||
      !this.transport.model ||
      !this.transport.nearby.includes(vehicle) ||
      !this.transport.state.repair_tools[this.kind] ||
      this.transport.state.repair_parts[this.kind] <= 0
    )
      return 0;
    const bonus = Math.floor((Math.clamp(window.currentSkillValue('housekeeping'), 0, 1000) / 1000) * terms.skill_bonus);
    return Math.clamp(terms.condition_limit - vehicle.condition, 0, terms.base_repair + bonus);
  }

  public price(kind: RepairKind): number {
    return this.transport.state.repair_tools[kind]
      ? Math.ceil((terms[kind].parts_price * (terms.parts_capacity - this.transport.state.repair_parts[kind])) / terms.parts_capacity)
      : terms[kind].tools_price;
  }

  public buy(kind: RepairKind): boolean {
    const transport = this.transport;
    if (!transport.ready || !transport.shopOpen || (transport.core.passage.title !== 'Deadwood Transport Dealer' && transport.core.passage.title !== 'Deadwood Transport Service')) return false;
    if (kind === 'motor' ? !['motorcycle', 'garage'].includes(transport.state.shop!) : !['bicycle', 'garage'].includes(transport.state.shop!)) return false;
    const owned = transport.state.repair_tools[kind];
    if (owned && transport.state.repair_parts[kind] >= terms.parts_capacity) return false;
    const price = this.price(kind);
    if (!transport.canPay(price)) return false;
    transport.core.SugarCube.Wikifier.wikifyEval(`<<money -${price} 'transport'>>`);
    transport.state.repair_tools[kind] = true;
    transport.state.repair_parts[kind] = terms.parts_capacity;
    transport.state.notice = owned ? 'parts' : 'tools';
    return true;
  }

  public use(): boolean {
    if (this.transport.core.passage.title !== 'Deadwood Transport Menu') return false;
    const amount = this.amount;
    if (amount <= 0) return false;
    this.transport.vehicle!.condition = Math.round((this.transport.vehicle!.condition + amount) * 100) / 100;
    this.transport.state.repair_parts[this.kind]--;
    this.transport.state.notice = 'patched';
    this.transport.core.SugarCube.Wikifier.wikifyEval(`<<pass ${terms[this.kind].minutes}>>`);
    return true;
  }
}
