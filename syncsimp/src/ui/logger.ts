import boxen from 'boxen';
import { icons, styled } from './theme.js';

export function heading(title: string): void {
  console.log('\n' + styled.heading(`[ ${title} ]`) + '\n');
}

export function line(message = ''): void {
  console.log(styled.text(message));
}

export function success(message: string): void {
  console.log(styled.success(`${icons.success} ${message}`));
}

export function warn(message: string): void {
  console.log(styled.warning(`${icons.warn} ${message}`));
}

export function error(message: string): void {
  console.log(styled.error(`${icons.error} ${message}`));
}

export function info(message: string): void {
  console.log(styled.muted(`${icons.info} ${message}`));
}

export function summaryBox(lines: string[]): void {
  const content = lines.join('\n');
  const box = boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: '#8B5CF6',
    title: icons.sparkle + ' SyncSimp',
    titleAlignment: 'center'
  });
  console.log(box);
}

export function nextSteps(lines: string[]): void {
  console.log('\n' + styled.primary('Next steps:'));
  lines.forEach((step, index) => {
    console.log(styled.text(`  ${index + 1}. ${step}`));
  });
  console.log();
}

export function section(title: string): void {
  console.log('\n' + styled.label(`${icons.arrow} ${title}`));
}

export function listItem(message: string, status?: 'success' | 'warn' | 'error'): void {
  let icon = icons.bullet;
  let style = styled.text;

  if (status === 'success') {
    icon = icons.check;
    style = styled.success;
  } else if (status === 'warn') {
    icon = icons.warn;
    style = styled.warning;
  } else if (status === 'error') {
    icon = icons.cross;
    style = styled.error;
  }

  console.log(style(`  ${icon} ${message}`));
}

export function blank(): void {
  console.log();
}
