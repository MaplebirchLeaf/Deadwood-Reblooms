function meteorEffect(rate: number) {
  return {
    effect: 'meteorShower',
    drawCondition(this: any): boolean {
      return Weather.meteorShower && this.renderInstance.orbitals.sun.factor < 0.2 && !this.renderInstance.sidebarSkyDisabled;
    },
    params: { rate },
    bindings: {
      strength(): number {
        return maplebirch.CA.MeteorShowerStrength;
      },
      visibility(): number {
        return Math.min(1, Math.max(0.35, 1 - Weather.overcast * 0.4 - Math.max(0, Weather.precipitationIntensity - 1) * 0.1));
      }
    }
  };
}

export default function applyMeteorShowerLayer(): void {
  const weather = maplebirch.dynamic.Weather;

  maplebirch.once(':modifyWeather', () => {
    Weather.Renderer.Effects.add({
      name: 'meteorShower',
      defaultParameters: {
        rate: 3,
        strength: 0,
        visibility: 1
      },

      init(this: any): void {
        this.emitter?.destroy();
        this.emitter = null;

        this.stop = (): void => {
          this.emitter?.destroy();
          this.emitter = null;
        };

        this.start = (): void => {
          if (this.emitter || !this.drawCondition()) return;

          const width = this.canvas.element.width;
          const height = this.canvas.element.height;
          const scale = Math.min(2, Math.max(1, Math.sqrt(width / 256)));
          this.emitter = new Weather.Renderer.ParticleEmitter(this.canvas.ctx, {
            origin: { x: 0, y: 0 },
            maxParticles: Math.min(32, Math.max(8, Math.ceil(this.rate * 4))),
            spawnRate: this.rate * this.strength * this.visibility,
            animationGroup: this.parentLayer.animationGroup,
            initialSettings: {
              shape: 'line',
              size: { w: 24 * scale, h: 1 },
              color: '#e7edff',
              alpha: 1,
              lifetime: 2,
              fade: true,
              fadeStart: 0.35,
              fadeTime: 0.65,
              shrinkDuration: 0.5
            },
            generator: () => {
              const speed = 90 + Math.random() * 60;
              const angle = 0.42 + Math.random() * 0.18;
              return {
                position: { x: Math.random() * width * 0.95, y: Math.random() * height * 0.5 },
                velocity: {
                  x: Math.cos(angle) * speed,
                  y: Math.sin(angle) * speed
                },
                size: {
                  w: (24 + Math.random() * 24) * scale,
                  h: Math.random() < 0.2 ? 2 : 1
                },
                color: Math.random() < 0.25 ? '#b9d8ff' : '#f4f1df',
                lifetime: 1.4 + Math.random() * 0.8,
                fadeStart: 0.35 + Math.random() * 0.25
              };
            }
          });

          for (let step = 0; step < 12; step++) this.emitter.update(0.1);
        };

        this.start();
      },

      onEnable(this: any): void {
        this.start();
      },

      onDisable(this: any): void {
        this.stop();
      },

      draw(this: any): void {
        this.canvas.clear();
        if (this.emitter) this.emitter.spawnRate = this.rate * this.strength * this.visibility;
        this.emitter?.draw();
      }
    });
  });

  weather.addLayer('starField', { animation: { updateRate: 50 }, effects: [meteorEffect(3.5)] }, 'concat');
  weather.addLayer('bannerStarField', { animation: { updateRate: 50 }, effects: [meteorEffect(9)] }, 'concat');
}
