import boxen from "boxen";
import { styled, icons } from "./theme.js";

/**
 * Logger utility for consistent, calm output
 */

export function heading(title: string): void {
  console.log();
  console.log(styled.brandBold(`[ ${title} ]`));
  console.log();
}

export function line(message?: string): void {
  if (message) {
    console.log(styled.text(message));
  } else {
    console.log();
  }
}

export function success(msg: string): void {
  console.log(`${icons.success} ${styled.success(msg)}`);
}

export function warn(msg: string): void {
  console.log(`${icons.warn} ${styled.warning(msg)}`);
}

export function error(msg: string): void {
  console.log(`${icons.error} ${styled.error(msg)}`);
}

export function info(msg: string): void {
  console.log(`${icons.info} ${styled.info(msg)}`);
}

export function step(msg: string): void {
  console.log(`${styled.muted(icons.arrow)} ${styled.text(msg)}`);
}

export function detail(msg: string): void {
  console.log(`  ${styled.muted(icons.dot)} ${styled.muted(msg)}`);
}

export function summaryBox(title: string, lines: string[]): void {
  const content = [styled.brandBold(title), "", ...lines.map((l) => styled.text(l))].join("\n");

  console.log(
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "magenta",
    })
  );
}

export function nextSteps(lines: string[]): void {
  console.log();
  console.log(styled.brandBold("Next steps:"));
  console.log();
  lines.forEach((line, i) => {
    console.log(`  ${styled.brand((i + 1).toString() + ".")} ${styled.text(line)}`);
  });
  console.log();
}

export function divider(): void {
  console.log(styled.muted("─".repeat(60)));
}

export function phase(number: number, total: number, name: string): void {
  console.log();
  console.log(styled.brandBold(`[ ${number}/${total} ] ${name}`));
  console.log();
}
