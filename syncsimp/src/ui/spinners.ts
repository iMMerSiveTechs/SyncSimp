import ora, { type Ora } from 'ora';
import { colors } from './theme.js';

export function phase(title: string): Ora {
  return ora({
    text: title,
    color: 'magenta',
    spinner: 'dots'
  });
}

export function createSpinner(text: string): Ora {
  return ora({
    text,
    color: 'cyan',
    spinner: 'dots'
  });
}
