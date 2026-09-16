// ./src/module/CelestialAnomalies.ts

import { version } from './constants';
import SolarEclipse from './CelestialAnomalies/SolarEclipse';
import MeteorShower from './CelestialAnomalies/MeteorShower';
import { MacroDefinition } from 'twine-sugarcube';

class CelestialAnomalies {
  static readonly options = {
    SolarEclipse: true,
    MeteorShower: true
  };

  static readonly variables = {
    solarEclipse: {
      seed: 0,
      stored: []
    },
    meteorShower: {
      seed: 0,
      stored: []
    }
  };

  public readonly exposed = true;
  private readonly migration: ReturnType<typeof maplebirch.tool.migration.create>;
  private readonly solarEclipse: SolarEclipse;
  private readonly meteorShower: MeteorShower;

  public constructor(readonly core: typeof maplebirch) {
    this.solarEclipse = new SolarEclipse(core);
    this.meteorShower = new MeteorShower(core);
    this.migration = this.core.tool.migration.create();
    this.migration.add('*', version, (data, utils) => utils.fill(data, clone(CelestialAnomalies.variables)));
    this.core.once(':storyready', () => {
      const macro = this.core.SugarCube.Macro.get('weatherIcon') as MacroDefinition | undefined;
      if (!macro) return;
      this.core.tool.macro.define('weatherIcon', function (this: any) {
        if (!Weather.solarEclipse) {
          macro.handler.call(this);
          return;
        }
        const weatherState = typeof Weather.current.iconType === 'function' ? Weather.current.iconType() : (Weather.current.iconType ?? 'clear');
        const path = `img/ui/weather/solar-eclipse-${weatherState}.png`;
        const iconDiv = $('<div />', { id: 'weatherIcon' });
        const iconImg = $('<img />');
        iconImg.attr('src', path);
        Weather.Tooltips.skybox(iconImg);
        iconDiv.append(iconImg);
        iconDiv.appendTo(this.output);
      });
      $('#weatherIcon').replaceWith(this.core.SugarCube.Wikifier.wikifyEval('<<weatherIcon>>'));
    });
  }

  get SolarEclipsePhase() {
    return this.solarEclipse.phase;
  }

  get SolarEclipseStageIndex() {
    return this.solarEclipse.stageIndex;
  }

  get SolarEclipseActive() {
    return this.solarEclipse.active;
  }

  get MeteorShowerActive() {
    return this.meteorShower.active;
  }

  get MeteorShowerPhase() {
    return this.meteorShower.phase;
  }

  get MeteorShowerStrength() {
    return this.meteorShower.strength;
  }

  get MeteorShowerStored() {
    return this.meteorShower.stored;
  }

  public preInit(): void {
    this.core.var.options.define('CelestialAnomalies', CelestialAnomalies.options);
    this.solarEclipse.apply();
    this.meteorShower.apply();
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly CA: CelestialAnomalies;
  }
}

export default CelestialAnomalies;
