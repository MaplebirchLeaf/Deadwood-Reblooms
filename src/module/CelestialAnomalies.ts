// ./src/module/CelestialAnomalies.ts

import { version } from './constants';
import SolarEclipse from './CelestialAnomalies/SolarEclipse';
import { MacroDefinition } from 'twine-sugarcube';

class CelestialAnomalies {
  static readonly options = {
    SolarEclipse: true
  };

  static readonly variables = {
    SolarEclipse: {
      seed: 0,
      stored: []
    }
  };

  public readonly exposed = true;
  private readonly migration: ReturnType<typeof maplebirch.tool.migration.create>;
  private readonly SolarEclipse: SolarEclipse;

  public constructor(readonly core: typeof maplebirch) {
    this.SolarEclipse = new SolarEclipse(core);
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

  public preInit(): void {
    this.core.var.options.define('CelestialAnomalies', CelestialAnomalies.options);
    this.SolarEclipse.apply();
  }
}

declare module '@scml-maplebirch/types/maplebirch' {
  interface Extensions {
    readonly CA: CelestialAnomalies;
  }
}

export default CelestialAnomalies;
