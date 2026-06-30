import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button-dark-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './button-dark-toggle-component.html',
  styleUrls: ['./button-dark-toggle-component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonDarkToggleComponent {
  @Input() isDarkMode: boolean = false;
  @Output() toggleDarkMode = new EventEmitter<void>();

  onToggle(): void {
    this.toggleDarkMode.emit();
  }
}
