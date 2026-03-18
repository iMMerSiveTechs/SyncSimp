import ora, { Ora } from "ora";
import { colors } from "./theme.js";

/**
 * Create a themed spinner for async operations
 */
export function phase(title: string): Ora {
  return ora({
    text: title,
    color: "magenta",
    spinner: "dots",
  });
}

/**
 * Run an async task with a spinner
 */
export async function withSpinner<T>(title: string, task: () => Promise<T>): Promise<T> {
  const spinner = phase(title);
  spinner.start();

  try {
    const result = await task();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}
