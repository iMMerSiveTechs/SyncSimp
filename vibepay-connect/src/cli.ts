#!/usr/bin/env node

import { Command } from "commander";
import { init } from "./commands/init.js";
import { check } from "./commands/check.js";
import { run } from "./commands/run.js";

const program = new Command();

program
  .name("vibepay")
  .description("✨ VibePay Connect – Sync simple: calm engineering for in-app purchases")
  .version("0.1.0");

program
  .command("init")
  .description("Interactive setup wizard for Apple + RevenueCat")
  .action(async () => {
    try {
      await init();
    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}\n`);
      process.exit(1);
    }
  });

program
  .command("check")
  .description("Run preflight diagnostics")
  .action(async () => {
    try {
      await check();
    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}\n`);
      process.exit(1);
    }
  });

program
  .command("run")
  .description("Sync vibepay.yml with Apple and RevenueCat")
  .action(async () => {
    try {
      await run();
    } catch (error: any) {
      console.error(`\n❌ Error: ${error.message}\n`);
      process.exit(1);
    }
  });

program.parse();
