import {DOCUMENT, inject, Injectable, OnDestroy} from '@angular/core';

interface ParticleData {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  age: number;
}

interface Particle {
  el: HTMLElement;
  data: ParticleData;
}

/**
 * Angular-Portierung der frueher als Inline-Script in index.html eingebetteten
 * Fireworks-Engine (urspruenglich (c) 2017 Dominik Scholz / go4u.de Webdesign).
 * Ersetzt das globale `window.fireworks`-Objekt durch einen injizierbaren Service.
 *
 * Nutzung: `configure(...)` setzt Intensitaet/Frequenz, `start()`/`stop()` steuern
 * die Animationsschleife (z. B. gebunden an den Lebenszyklus der Guest-Ansicht).
 */
@Injectable({providedIn: 'root'})
export class FireworksService implements OnDestroy {

  private readonly document = inject(DOCUMENT);

  // Konfiguration (Konstanten wie im Original)
  private readonly colors = ['#D0D0D0', '#FF0000', '#FFFF00', '#22FF00', '#2040FF', '#00CCFF', '#FF00FF', '#A319D6'];
  private readonly gravity = 0.07;
  private readonly resistance = 0.975;
  private readonly zIndex = 20000;
  private readonly maxAge = 4000;
  private readonly speed = 5;
  private readonly minSize = 8;
  private readonly maxSize = 12;

  // Zur Laufzeit steuerbar (ersetzt fireworks._interval / fireworks._particlesPerExplosion)
  private interval: [number, number] = [200, 1500];
  private particlesPerExplosion = 0;

  // Interner Zustand
  private particles: Particle[] = [];
  private bodyWidth = 0;
  private bodyHeight = 0;
  private lastInterval = 0;
  private running = false;
  private animationFrameId: number | null = null;
  private explosionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly resizeHandler = () => this.resize();

  /** Setzt Intensitaet (Partikel pro Explosion) und Frequenzintervall in ms. */
  public configure(particlesPerExplosion: number, interval: [number, number]): void {
    this.particlesPerExplosion = particlesPerExplosion;
    this.interval = interval;
  }

  /** Startet die Animationsschleife. Idempotent. */
  public start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.resize();
    this.document.defaultView?.addEventListener('resize', this.resizeHandler, false);
    this.lastInterval = this.now();
    this.scheduleFrame();
    this.addExplosion();
  }

  /** Stoppt die Schleife und raeumt alle Partikel ab. */
  public stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      this.document.defaultView?.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.explosionTimeoutId !== null) {
      clearTimeout(this.explosionTimeoutId);
      this.explosionTimeoutId = null;
    }
    this.document.defaultView?.removeEventListener('resize', this.resizeHandler, false);
    this.particles.forEach(particle => particle.el.remove());
    this.particles = [];
  }

  public ngOnDestroy(): void {
    this.stop();
  }

  private scheduleFrame(): void {
    const view = this.document.defaultView;
    if (view?.requestAnimationFrame) {
      this.animationFrameId = view.requestAnimationFrame(() => this.move());
    } else {
      this.animationFrameId = setTimeout(() => this.move(), 1000 / 60) as unknown as number;
    }
  }

  private move(): void {
    if (!this.running) {
      return;
    }
    this.scheduleFrame();

    const dif = this.now() - this.lastInterval;
    this.lastInterval = this.now();

    const delta = dif / 20;
    const r = Math.pow(this.resistance, delta);
    const g = this.gravity * delta;
    const a = dif / this.maxAge;

    for (const particle of this.particles) {
      const d = particle.data;
      if (d.age > 1) {
        continue;
      }

      d.age += a;
      d.dy += g;
      d.dx *= r;
      d.dy *= r;
      d.x += d.dx * delta;
      d.y += d.dy * delta;

      if (d.x < 0) {
        d.dx *= -1;
        d.x = 0;
      } else if (d.x > this.bodyWidth) {
        d.dx *= -1;
        d.x = this.bodyWidth;
      }
      if (d.y < 0) {
        d.dy *= -1;
        d.y = 0;
      } else if (d.y > this.bodyHeight) {
        d.dy *= -1;
        d.y = this.bodyHeight;
      }

      if (d.age > 1) {
        d.x = d.y = 0;
      }

      particle.el.style.left = d.x + 'px';
      particle.el.style.top = d.y + 'px';
      particle.el.style.opacity = (1 - d.age).toString();
      particle.el.style.color = (Math.random() * .5 + d.age >= 1) ? 'transparent' : d.color;
      particle.el.style.fontSize = Math.max(this.minSize, (1 - d.age) * this.maxSize) + 'px';
    }
  }

  private addExplosion(): void {
    if (!this.running) {
      return;
    }

    const x = Math.floor(this.random(this.bodyWidth));
    const y = Math.floor((this.random(.5) + .1) * this.bodyHeight);
    const dx = this.random(10) - 5;
    const dy = this.random(-2) - 1;
    const c1 = this.randomArray(this.colors);
    const c2 = this.randomArray(this.colors);

    for (let i = 0; i < this.particlesPerExplosion; i++) {
      this.createParticle(
        x,
        y,
        dx,
        dy,
        i / (this.particlesPerExplosion - 1) * 180 * Math.PI,
        this.random(this.speed),
        this.random(1) > .5 ? c1 : c2,
      );
    }

    this.explosionTimeoutId = setTimeout(
      () => this.addExplosion(),
      this.random(this.interval[1] - this.interval[0]) + this.interval[0],
    );
  }

  private createParticle(x: number, y: number, dx: number, dy: number, rot: number, speed: number, color: string): void {
    // Alte, "abgestorbene" Partikel wiederverwenden (Pooling wie im Original).
    let particle = this.particles.find(p => p.data.age > 1);
    const reused = !!particle;

    if (!particle) {
      const el = this.document.createElement('div');
      el.className = 'particle';
      el.style.position = 'absolute';
      el.style.fontSize = '2px';
      el.style.zIndex = String(this.zIndex);
      el.style.width = '3px';
      el.style.height = '3px';
      el.style.borderRadius = '50%';
      el.style.textAlign = 'center';
      el.style.overflow = 'hidden';
      particle = {el, data: {x, y, dx, dy, color, age: 0}};
    }

    particle.el.style.left = x + 'px';
    particle.el.style.top = y + 'px';
    particle.el.style.backgroundColor = color;
    particle.el.style.boxShadow = '0 0 10px 1px ' + color;
    particle.data = {
      x,
      y,
      dx: Math.cos(rot) * speed + dx,
      dy: Math.sin(rot) * speed + dy,
      color,
      age: Math.random() * .25,
    };

    if (!reused) {
      this.document.body.appendChild(particle.el);
      this.particles.push(particle);
    }
  }

  private resize(): void {
    this.bodyWidth = this.getWindowWidth() - this.maxSize;
    this.bodyHeight = this.getWindowHeight() - this.maxSize - 10;
  }

  private getWindowWidth(): number {
    return this.document.body?.offsetWidth ?? 0;
  }

  private getWindowHeight(): number {
    const view = this.document.defaultView;
    let h = Math.max(view?.innerHeight || 0, 0);
    const docEl = this.document.documentElement;
    if (docEl) {
      h = Math.max(h, docEl.clientHeight || 0);
    }
    if (this.document.body) {
      h = Math.max(h, this.document.body.clientHeight || 0);
      h = Math.max(h, this.document.body.scrollHeight || 0);
      h = Math.max(h, this.document.body.offsetHeight || 0);
    }
    return h;
  }

  private now(): number {
    return Date.now();
  }

  private random(value: number): number {
    return Math.random() * value;
  }

  private randomArray<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
