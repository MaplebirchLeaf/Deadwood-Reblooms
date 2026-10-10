// ./src/module/Transport/Catalog.ts

import models from '../../assets/transport/vehicles.json';
import routes from '../../assets/transport/routes.json';

export type VehicleKind = 'bicycle' | 'motorcycle' | 'motor_vehicle';
export type VehicleOutlet = 'bicycle' | 'motorcycle' | 'car';
export type Terrain = 'road' | 'park' | 'forest_trail' | 'moor_track';

export interface VehicleModel {
  id: string;
  kind: VehicleKind;
  name: string;
  outlet: VehicleOutlet;
  learner: boolean;
  price: number;
  travel_ratio: number;
  tank: number;
  fuel_use: number;
  seats: number;
  cargo: number;
  terrain: Terrain[];
}

export interface Vehicle {
  id: number;
  model: string;
  point: string;
  garage: string | null;
  condition: number;
  fuel: number;
}

export default class Catalog {
  public static readonly models = models as VehicleModel[];
  public static readonly routes = routes;
  public static readonly roads = Array.from({ length: 6 }, (_, index) => ({
    id: `farmroad${index + 1}`,
    passage: `Farm Road ${index + 1}`,
    name: `deadwood-reblooms:transport:route:farmroad${index + 1}`,
    position: 5 + index * 30
  }));

  public static point(passage: string): string | null {
    if (passage === 'Forest') return `forest:${V.forest ?? 0}`;
    if (passage === 'Moor') return `moor:${V.moor ?? 0}`;
    return [...this.routes, ...this.roads].find(route => route.passage === passage)?.id ?? null;
  }

  public static name(point: string): string {
    const route = [...this.routes, ...this.roads].find(route => route.id === point);
    if (route) return maplebirch.t(route.name);
    const [area, depth] = point.split(':');
    const section = Number(depth) === 0 ? 'edge' : Number(depth) <= (area === 'forest' ? 50 : 20) ? (area === 'forest' ? 'trail' : 'track') : 'deep';
    return maplebirch.t(`deadwood-reblooms:transport:route:${area}_${section}`);
  }

  public static passage(point: string): string {
    if (point.startsWith('forest:')) return 'Forest';
    if (point.startsWith('moor:')) return 'Moor';
    return [...this.routes, ...this.roads].find(route => route.id === point)?.passage ?? 'Harvest Street';
  }

  /** 道路权重沿用原版步行时间，车辆再按车型换算。 */
  public static distance(from: string, to: string, park = false): number | null {
    const start = this.roads.find(road => road.id === from);
    const end = this.roads.find(road => road.id === to);
    if (start && end) return Math.abs(start.position - end.position);
    if (start || end) {
      const road = (start ?? end)!;
      const other = start ? to : from;
      const town = this.distance('harvest', other, park);
      const farm = this.distance('farmland', other, park);
      return town == null || farm == null ? null : Math.min(road.position + town, 160 - road.position + farm);
    }
    const distances = new Map([[from, 0]]);
    const remaining = new Set(routes.filter(route => park || route.terrain !== 'park').map(route => route.id));
    if (!remaining.has(from) || !remaining.has(to)) return null;
    while (remaining.size) {
      const point = [...remaining].sort((a, b) => (distances.get(a) ?? Infinity) - (distances.get(b) ?? Infinity))[0];
      const distance = distances.get(point);
      if (distance == null) return null;
      if (point === to) return distance;
      remaining.delete(point);
      const edges = routes.find(route => route.id === point)!.edges;
      for (const [next, minutes] of Object.entries(edges)) {
        if (minutes != null && distance + minutes < (distances.get(next) ?? Infinity)) distances.set(next, distance + minutes);
      }
    }
    return null;
  }
}
