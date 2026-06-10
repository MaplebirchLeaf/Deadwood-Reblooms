// ./src/module/reblooms/solarEclipseLayer.ts

type SkyColors = {
  colorMin: { close: string; far: string };
  colorMed: { close: string; far: string };
  colorMax: { close: string; far: string };
};

function eclipseStrength(): number {
  const phase = Math.max(0, Math.min(1, maplebirch.rebloom.solarEclipse.phase));
  const progress = phase * 25;
  if (progress < 1) return progress * 0.25;
  if (progress < 4) return 0.25 + ((progress - 1) / 3) * 0.25;
  if (progress < 9) return 0.5 + ((progress - 4) / 5) * 0.5;
  if (progress < 16) return 1;
  if (progress < 21) return 1 - ((progress - 16) / 5) * 0.5;
  if (progress < 24) return 0.5 - ((progress - 21) / 3) * 0.25;
  return Math.max(0, 0.25 - (progress - 24) * 0.25);
}

function skyColors(): SkyColors {
  const normal: SkyColors = {
    colorMin: { close: '#14145200', far: '#00001c00' },
    colorMed: { close: '#d47d12', far: '#6c6d94' },
    colorMax: { close: '#d4d7ff', far: '#4692d4' }
  };

  const eclipse: SkyColors = {
    colorMin: { close: '#2d1f0000', far: '#1a120000' },
    colorMed: { close: '#2d1f00', far: '#1a1200' },
    colorMax: { close: '#2d1f00', far: '#1a1200' }
  };

  const strength = eclipseStrength();

  return {
    colorMin: {
      close: ColourUtils.interpolateColor(normal.colorMin.close, eclipse.colorMin.close, strength),
      far: ColourUtils.interpolateColor(normal.colorMin.far, eclipse.colorMin.far, strength)
    },
    colorMed: {
      close: ColourUtils.interpolateColor(normal.colorMed.close, eclipse.colorMed.close, strength),
      far: ColourUtils.interpolateColor(normal.colorMed.far, eclipse.colorMed.far, strength)
    },
    colorMax: {
      close: ColourUtils.interpolateColor(normal.colorMax.close, eclipse.colorMax.close, strength),
      far: ColourUtils.interpolateColor(normal.colorMax.far, eclipse.colorMax.far, strength)
    }
  };
}

function applySolarEclipseLayer(): void {
  const weather = maplebirch.dynamic.Weather;

  const overlayPatch = (color: string) => ({
    params: {
      dayStateColors: {
        solarEclipse: color
      }
    },
    bindings: {
      solarEclipse(): boolean {
        return Weather.solarEclipse;
      },
      sunFactor(this: any): number {
        return this.renderInstance.orbitals.sun.factor;
      },
      moonFactor(this: any): number {
        return this.renderInstance.moonBrightnessFactor;
      },
      bloodMoon(): boolean {
        return Weather.bloodMoon;
      }
    }
  });

  // 1. 覆盖新版 colorOverlay。新版只使用 dayStateColors，不再读 this.color。
  weather.addEffect(
    'colorOverlay',
    {
      draw(this: any): void {
        const colors = this.dayStateColors;
        const darkenFactor = this.darkenFactor;
        const darkenTarget = this.darkenTarget;

        const baseDay = this.solarEclipse && colors.solarEclipse ? colors.solarEclipse : colors.day;

        const nightDark = darkenFactor > 0 ? ColourUtils.interpolateColor(colors.nightDark, darkenTarget, darkenFactor) : colors.nightDark;
        const nightBright = darkenFactor > 0 ? ColourUtils.interpolateColor(colors.nightBright, darkenTarget, darkenFactor) : colors.nightBright;
        const dawnDusk = darkenFactor > 0 ? ColourUtils.interpolateColor(colors.dawnDusk, darkenTarget, darkenFactor) : colors.dawnDusk;
        const day = darkenFactor > 0 ? ColourUtils.interpolateColor(baseDay, darkenTarget, darkenFactor) : baseDay;
        const bloodMoon = darkenFactor > 0 ? ColourUtils.interpolateColor(colors.bloodMoon, darkenTarget, darkenFactor) : colors.bloodMoon;

        const nightColor = this.bloodMoon ? bloodMoon : ColourUtils.interpolateColor(nightDark, nightBright, this.moonFactor);
        const mixFactor = this.solarEclipse && this.sunFactor > 0 ? Math.min(this.sunFactor * 0.05, 0.05) : this.sunFactor;
        const color = ColourUtils.interpolateTripleColor(nightColor, dawnDusk, day, mixFactor);

        this.canvas.ctx.fillStyle = color;
        this.canvas.fillRect();
      }
    },
    'replace'
  );

  // 2. 地点图与反射层染色。新版字段是 dayStateColors。
  const locationTint = {
    effects: [{}, overlayPatch('#1a1508d9')]
  };

  weather.addEffect('locationImage', locationTint, 'merge');
  weather.addEffect('locationReflective', locationTint, 'merge');

  // 3. 日蚀期间隐藏原版太阳。
  weather.addLayer(
    'sun',
    {
      effects: [
        {
          drawCondition(this: any): boolean {
            return !Weather.solarEclipse && this.renderInstance.orbitals.sun.factor > -0.5 && !this.renderInstance.sidebarSkyDisabled;
          }
        }
      ]
    },
    'merge'
  );

  // 4. 追加 7 张日蚀太阳图。
  weather.addLayer(
    'sun',
    {
      effects: Array.from({ length: 7 }, (_, index) => ({
        effect: 'skyOrbital',
        drawCondition(this: any): boolean {
          return Weather.solarEclipse && this.renderInstance.orbitals.sun.factor > -0.5 && !this.renderInstance.sidebarSkyDisabled && maplebirch.rebloom.solarEclipse.stageIndex === index;
        },
        params: {
          images: {
            orbital: `img/misc/sky/solar-eclipse-${index}.png`
          }
        },
        bindings: {
          position(this: any): any {
            return this.renderInstance.orbitals.sun.position;
          }
        }
      }))
    },
    'concat'
  );

  // 5. 日蚀天空渐变。
  const skyGradient = {
    effect: 'skyGradiant',
    drawCondition(this: any): boolean {
      return Weather.solarEclipse && !this.renderInstance.sidebarSkyDisabled;
    },
    params: {
      radius: 384
    },
    bindings: {
      color: skyColors,
      position(this: any): any {
        return this.renderInstance.orbitals.sun.position;
      },
      factor(this: any): number {
        return this.renderInstance.orbitals.sun.factor;
      }
    }
  };

  ['bannerSky', 'sky'].forEach(layer => {
    weather.addLayer(
      layer,
      {
        effects: [
          {},
          {},
          {
            drawCondition(this: any): boolean {
              return !Weather.solarEclipse && !this.renderInstance.sidebarSkyDisabled;
            }
          }
        ]
      },
      'merge'
    );

    weather.addLayer(layer, { effects: [skyGradient] }, 'concat');
  });

  // 6. 日蚀太阳光晕。
  [
    {
      layer: 'bannerSunGlow',
      radius: 100,
      diameter: 28,
      factor(this: any): number {
        return this.renderInstance.orbitals.sun.factor;
      }
    },
    {
      layer: 'sunGlow',
      radius: 82,
      diameter: 24,
      factor(): number {
        return Math.max(0.3, eclipseStrength());
      }
    }
  ].forEach(({ layer, radius, diameter, factor }) => {
    weather.addLayer(
      layer,
      {
        effects: [
          {
            drawCondition(this: any): boolean {
              return !Weather.solarEclipse && this.renderInstance.orbitals.sun.factor > -0.7 && !Weather.isOvercast && !this.renderInstance.sidebarSkyDisabled;
            }
          }
        ]
      },
      'merge'
    );

    weather.addLayer(
      layer,
      {
        effects: [
          {
            effect: 'outerRadialGlow',
            drawCondition(this: any): boolean {
              return Weather.solarEclipse && this.renderInstance.orbitals.sun.factor > -0.7 && !Weather.isOvercast && !this.renderInstance.sidebarSkyDisabled;
            },
            params: {
              outerRadius: radius,
              colorInside: {
                dark: '#f0e5d944',
                med: '#f0e5d944',
                bright: '#f0e5d944'
              },
              colorOutside: {
                dark: '#2d1f0000',
                med: '#2d1f0000',
                bright: '#2d1f0000'
              },
              cutCenter: false,
              diameter
            },
            bindings: {
              position(this: any): any {
                return this.renderInstance.orbitals.sun.position;
              },
              factor
            }
          }
        ]
      },
      'concat'
    );
  });

  // 7. 日蚀期间提前显示星空。
  ['bannerStarField', 'starField'].forEach(layer => {
    weather.addLayer(
      layer,
      {
        effects: [
          {
            drawCondition(this: any): boolean {
              return (this.renderInstance.orbitals.sun.factor < 0.75 || Weather.solarEclipse) && !this.renderInstance.sidebarSkyDisabled;
            }
          }
        ]
      },
      'merge'
    );
  });

  // 8. 云、雾等图层增加独立的日蚀染色层。
  const eclipseTint = (color: string) => ({
    effect: 'colorOverlay',

    drawCondition(this: any): boolean {
      return Weather.solarEclipse && !this.renderInstance.sidebarSkyDisabled;
    },

    compositeOperation: 'source-atop',

    params: {
      dayStateColors: {
        nightDark: color,
        nightBright: color,
        day: color,
        dawnDusk: color,
        bloodMoon: color
      },
      darkenFactor: 0,
      darkenTarget: '#000000'
    },

    bindings: {
      solarEclipse(): boolean {
        return Weather.solarEclipse;
      },

      sunFactor(this: any): number {
        return this.renderInstance.orbitals.sun.factor;
      },

      moonFactor(this: any): number {
        return this.renderInstance.moonBrightnessFactor;
      },

      bloodMoon(): boolean {
        return Weather.bloodMoon;
      }
    }
  });

  [
    { name: 'bannerClouds', color: '#5d4f20aa' },
    { name: 'bannerOvercastClouds', color: '#5d4f20aa' },
    { name: 'bannerCirrusClouds', color: '#5d4f20aa' },

    { name: 'clouds', color: '#5d4f20aa' },
    { name: 'overcastClouds', color: '#5d4f20aa' },
    { name: 'cirrusClouds', color: '#5d4f20aa' },

    { name: 'fog', color: '#3d2e10cc' },
    { name: 'fogOverlay', color: '#3d2e10cc' }
  ].forEach(({ name, color }) => {
    weather.addLayer(
      name,
      {
        effects: [eclipseTint(color)]
      },
      'concat'
    );
  });

  // 9. 降水层。新版降水主要由 particleRain / particleSnow 控制颜色，不再使用旧的 params.color。
  weather.addLayer(
    'bannerPrecipitation',
    {
      effects: [
        {
          params: {
            sunTint: '#2a1a4aaa',
            groundDayTint: '#2a1a4aaa',
            dawnDuskTint: '#2a1a4aaa',
            groundDawnDuskTint: '#2a1a4aaa'
          }
        },
        {
          params: {
            sunTint: '#2a1a4aaa',
            groundDayTint: '#2a1a4aaa',
            dawnDuskTint: '#2a1a4aaa',
            groundDawnDuskTint: '#2a1a4aaa'
          }
        },
        {},
        {
          params: {
            sunTint: '#d8c58aaa',
            groundDayTint: '#d8c58aaa',
            dawnDuskTint: '#d8c58aaa',
            groundDawnDuskTint: '#d8c58aaa'
          }
        },
        {
          params: {
            sunTint: '#d8c58aaa',
            groundDayTint: '#d8c58aaa',
            dawnDuskTint: '#d8c58aaa',
            groundDawnDuskTint: '#d8c58aaa'
          }
        }
      ]
    },
    'merge'
  );

  weather.addLayer(
    'precipitation',
    {
      effects: [
        {
          params: {
            sunTint: '#2a1a4aaa',
            groundDayTint: '#2a1a4aaa',
            dawnDuskTint: '#2a1a4aaa',
            groundDawnDuskTint: '#2a1a4aaa'
          }
        },
        {},
        {
          params: {
            sunTint: '#d8c58aaa',
            groundDayTint: '#d8c58aaa',
            dawnDuskTint: '#d8c58aaa',
            groundDawnDuskTint: '#d8c58aaa'
          }
        },
        {
          params: {
            sunTint: '#d8c58aaa',
            groundDayTint: '#d8c58aaa',
            dawnDuskTint: '#d8c58aaa',
            groundDawnDuskTint: '#d8c58aaa'
          }
        }
      ]
    },
    'merge'
  );
}

export default applySolarEclipseLayer;
