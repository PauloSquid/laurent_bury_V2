import { Pipe, PipeTransform } from '@angular/core';
import { isUpcoming } from '../core/dates';

/** `livre.date | upcoming` : vrai pour un titre annoncé mais pas encore paru. */
@Pipe({ name: 'upcoming' })
export class UpcomingPipe implements PipeTransform {
  transform(date: string): boolean {
    return isUpcoming(date);
  }
}
