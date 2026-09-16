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
  private readonly SolarEclipse: SolarEclipse;
  private readonly MeteorShower: MeteorShower;

  public constructor(readonly core: typeof maplebirch) {
    this.SolarEclipse = new SolarEclipse(core);
    this.MeteorShower = new MeteorShower(core);
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

  get Phase() {
    return this.SolarEclipse.phase;
  }

  get StageIndex() {
    return this.SolarEclipse.stageIndex;
  }

  get Active() {
    return this.SolarEclipse.active;
  }

  get MeteorActive() {
    return this.MeteorShower.active;
  }

  get MeteorPhase() {
    return this.MeteorShower.phase;
  }

  get MeteorStrength() {
    return this.MeteorShower.strength;
  }

  get MeteorStored() {
    return this.MeteorShower.stored;
  }

  public preInit(): void {
    this.core.var.options.define('CelestialAnomalies', CelestialAnomalies.options);
    this.SolarEclipse.apply();
    this.MeteorShower.apply();
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly CA: CelestialAnomalies;
  }
}

export default CelestialAnomalies;
