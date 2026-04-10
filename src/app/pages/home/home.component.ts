import { Component, signal, effect, OnDestroy, inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import { title } from 'process';

@Component({
  selector: 'app-home',
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnDestroy {
  private platformId = inject(PLATFORM_ID);
  
  // Estado del slider
  currentIndex = signal(0);
  private intervalId: any;

  services = signal([
    { 
      title: 'Traccionamiento', 
      desc: 'Optimización de sistemas AWD y 4WD con tecnología de vanguardia para garantizar estabilidad total en cualquier terreno.',
      img: 'assets/images/traccionamiento.jpg' 
    },
    { 
      title: 'Planchado', 
      desc: 'Recuperación de la geometría original de la carrocería mediante bancadas electrónicas que aseguran precisión milimétrica.',
      img: 'assets/images/planchado.jpg' 
    },
    { 
      title: 'Pintura Premium', 
      desc: 'Cabinas de pintura presurizadas y laboratorio de colorimetría para un acabado espejo idéntico al de fábrica.',
      img: 'assets/images/pintura.jpg' 
    },
    { 
      title: 'Mantenimiento', 
      desc: 'Servicio integral preventivo que maximiza la vida útil de su motor bajo los estándares más exigentes del mercado.',
      img: 'assets/images/mantenimiento.jpg' 
    }
  ]);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.startAutoPlay();
    }
  }

  startAutoPlay() {
    this.intervalId = setInterval(() => this.next(), 4000);
  }

  next() {
    this.currentIndex.update(i => (i + 1) % this.services().length);
  }

  prev() {
    this.currentIndex.update(i => (i - 1 + this.services().length) % this.services().length);
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
