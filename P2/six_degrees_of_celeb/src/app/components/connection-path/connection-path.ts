import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionPath as ConnectionPathModel } from '../../models/celebrity';
import { CelebrityCard } from '../celebrity-card/celebrity-card';

@Component({
  selector: 'app-connection-path',
  templateUrl: './connection-path.html',
  styleUrls: ['./connection-path.css'],
  imports: [CommonModule, CelebrityCard, ConnectionPath]
})
export class ConnectionPath {
  @Input() connectionPath: ConnectionPathModel | null = null;
}