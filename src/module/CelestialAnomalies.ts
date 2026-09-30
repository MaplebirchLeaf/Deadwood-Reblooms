// ./src/module/CelestialAnomalies.ts

import Module from './Module';
import SolarEclipse from './CelestialAnomalies/SolarEclipse';
import MeteorShower from './CelestialAnomalies/MeteorShower';
import { DEFAULT_CELESTIAL_ANOMALIES_STATE } from './constants';
import { MacroDefinition } from 'twine-sugarcube';

function formatTime(timestamp: number): string {
  const date = new DateTime(timestamp);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${String(date.year).padStart(4, '0')}-${pad(date.month)}-${pad(date.day)} ${pad(date.hour)}:${pad(date.minute)}`;
}

class CelestialAnomalies extends Module {
  static readonly options = {
    SolarEclipse: true,
    MeteorShower: true
  };

  private readonly solarEclipse: SolarEclipse;
  private readonly meteorShower: MeteorShower;

  public constructor(core: typeof maplebirch) {
    super(core, 'CelestialAnomalies', DEFAULT_CELESTIAL_ANOMALIES_STATE);
    this.solarEclipse = new SolarEclipse(core);
    this.meteorShower = new MeteorShower(core);
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

  get SolarEclipseStored() {
    return this.solarEclipse.stored.map(event => {
      const midnight = new DateTime(event.year, event.month, event.day).timeStamp;
      return { start: formatTime(midnight + event.start), end: formatTime(midnight + event.end) };
    });
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
    return this.meteorShower.stored.map(event => ({ start: formatTime(event.start), end: formatTime(event.end) }));
  }

  public preInit(): void {
    this.solarEclipse.preInit();
    this.meteorShower.preInit();
    this.core.once(':storyready', () => {
      const macro = this.core.SugarCube.Macro.get('weatherIcon') as MacroDefinition | undefined;
      if (!macro) return;
      // 保留原版宏处理普通天气，仅天象活动期间换图，并复用原版 skybox 提示。
      this.core.tool.macro.define('weatherIcon', function (this: any) {
        if (!Weather.solarEclipse && !Weather.meteorShower) {
          macro.handler.call(this);
          return;
        }
        const weatherState = typeof Weather.current.iconType === 'function' ? Weather.current.iconType() : (Weather.current.iconType ?? 'clear');
        const anomaly = Weather.solarEclipse ? 'solar-eclipse' : 'meteor-shower';
        const path = `img/ui/weather/${anomaly}-${weatherState}.png`;
        const iconDiv = $('<div />', { id: 'weatherIcon' });
        const iconImg = $('<img />');
        iconImg.attr('src', path);
        Weather.Tooltips.skybox(iconImg);
        iconDiv.append(iconImg);
        iconDiv.appendTo(this.output);
      });
      $('#weatherIcon').replaceWith(this.core.SugarCube.Wikifier.wikifyEval('<<weatherIcon>>'));
    });
    this.core.var.options.define('CelestialAnomalies', CelestialAnomalies.options);
    super.preInit();
    this.solarEclipse.apply();
    this.meteorShower.apply();
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly CelestialAnomalies: CelestialAnomalies;
  }
}

export default CelestialAnomalies;
