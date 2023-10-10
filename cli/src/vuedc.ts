#! /usr/bin/env node
import { convertSfc } from "@heatsrc/vue-declassified";
import { Command } from "commander";
import figlet from "figlet";
import Readline from "node:readline/promises";
import pkg from "../package.json";

async function main() {
  console.log(figlet.textSync("VueDc", { font: "Rozzo" }));

  const program = new Command();
  program
    .version(pkg.version)
    .description("Convert Vue Class Components to Vue 3 Composition API")
    .option("-i, --input <file>", "Input Vue file")
    .option("-o, --output <file>", "Output file, if not specified input file will be overwritten")
    .option("-y, --yes", "Overwrite output file without asking")
    .parse(process.argv);

  const options = program.opts();

  if (!options.input) {
    console.error("Input file is required");
    process.exit(1);
  }

  let output = options.output;

  if (!options.output && !options.yes) {
    const readline = Readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const answer = await readline.question(
      "Output file is not specified, do you want to overwrite input file? (y/n) ",
    );

    if (!answer.match(/^[yY]$/)) {
      console.log("Exiting...");
      process.exit(0);
      return;
    }

    console.log(`Overwriting input file: ${options.input}`);
    output = options.input;
    return readline.close();
  }

  console.log(`Converting ${options.input}...`);

  try {
    convertSfc(options.input, output).then(() => {
      console.log(`Converted file written to: ${output}`);
    });
  } catch (err) {
    console.error(err);
  }
}

main();
