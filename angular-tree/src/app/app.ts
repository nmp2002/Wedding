import { Component } from '@angular/core';
import { TreeSceneComponent } from './tree-scene/tree-scene.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TreeSceneComponent],
  template: '<app-tree-scene></app-tree-scene>',
  styleUrl: './app.css',
})
export class App {
}
