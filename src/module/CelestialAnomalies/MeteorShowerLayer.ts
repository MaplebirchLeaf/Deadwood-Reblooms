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
        return Math.min(1, Math.max(0.05, 1 - Weather.overcast * 0.8 - Math.max(0, Weather.precipitationIntensity - 1) * 0.15));
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
        const frameDuration = 50;

        this.stop = (): void => {
          if (this.frame != null) cancelAnimationFrame(this.frame);
          this.frame = null;
          this.emitter?.destroy();
          this.emitter = null;
        };

        this.start = (): void => {
          if (this.frame != null) return;

          const width = this.canvas.element.width;
          const height = this.canvas.element.height;
          this.emitter = new Weather.Renderer.ParticleEmitter(this.canvas.ctx, {
            origin: { x: 0, y: 0 },
            maxParticles: Math.max(8, Math.ceil(this.rate * 4)),
            spawnRate: 0,
            initialSettings: {
              shape: 'line',
              size: { w: 18, h: 1 },
              color: '#e7edff',
              alpha: 0.9,
              lifetime: 2,
              fade: true,
              fadeStart: 0.15,
              fadeTime: 0.65,
              shrinkDuration: 0.5
            },
            generator: () => {
              const speed = 90 + Math.random() * 60;
              const angle = 0.42 + Math.random() * 0.18;
              const fromTop = Math.random() < width / (width + height);
              return {
                position: fromTop ? { x: Math.random() * width, y: -4 } : { x: -4, y: Math.random() * height * 0.55 },
                velocity: {
                  x: Math.cos(angle) * speed,
                  y: Math.sin(angle) * speed
                },
                size: {
                  w: 14 + Math.random() * 18,
                  h: Math.random() < 0.2 ? 2 : 1
                },
                color: Math.random() < 0.25 ? '#b9d8ff' : '#f4f1df',
                lifetime: 1.2 + Math.random() * 1.1,
                fadeStart: 0.1 + Math.random() * 0.25
              };
            }
          });

          let previous = performance.now();
          const tick = (now: number): void => {
            this.frame = requestAnimationFrame(tick);
            const elapsed = now - previous;
            if (elapsed < frameDuration || document.hidden) return;
            previous = now;
            this.emitter.spawnRate = this.rate * this.strength * this.visibility;
            this.emitter.update(Math.min(elapsed / 1000, 0.1));
            void this.parentLayer.renderInstance.drawLayers(this.parentLayer.name);
          };
          this.frame = requestAnimationFrame(tick);
        };

        if (Weather.meteorShower) this.start();
      },

      onEnable(this: any): void {
        this.start();
      },

      onDisable(this: any): void {
        this.stop();
      },

      draw(this: any): void {
        this.canvas.clear();
        this.emitter?.draw();
      }
    });
  });

  weather.addLayer('starField', { effects: [meteorEffect(2.5)] }, 'concat');
  weather.addLayer('bannerStarField', { effects: [meteorEffect(7)] }, 'concat');
}
