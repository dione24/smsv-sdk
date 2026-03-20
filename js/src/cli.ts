#!/usr/bin/env node
/**
 * SMSv CLI — debug & scripts (API key auth).
 *
 * Env: SMSV_API_KEY (or SMSV_API_KEY), SMSV_BASE_URL (default https://smsv.tech/api)
 */
import { Command } from "commander";
import { SmsvClient } from "./index";

function client(): SmsvClient {
  const apiKey = process.env.SMSV_API_KEY || process.env.SMSV_APP_API_KEY;
  if (!apiKey) {
    console.error("Missing SMSV_API_KEY (or SMSV_APP_API_KEY) in environment.");
    process.exit(1);
  }
  const baseUrl = process.env.SMSV_BASE_URL || "https://smsv.tech/api";
  return new SmsvClient({ apiKey, baseUrl });
}

async function main() {
  const program = new Command();
  program.name("smsv").description("SMSv API CLI").version("0.2.0");

  program
    .command("send")
    .description("Send a text (WhatsApp/SMS via /v1/text)")
    .requiredOption("--to <e164>", "Recipient E.164, e.g. +22370000000")
    .option("--message <text>", "Message body")
    .option("-m <text>", "Shorthand for --message")
    .option("--channel <ch>", "whatsapp | sms | auto", "whatsapp")
    .option("--sender-id <id>", "Sender UUID")
    .action(async (opts) => {
      const text = opts.message || opts.m;
      if (!text) {
        console.error("Provide --message or -m");
        process.exit(1);
      }
      const res = await client().sendText({
        to: opts.to,
        message: text,
        channel: opts.channel,
        ...(opts.senderId && { senderId: opts.senderId }),
      });
      console.log(JSON.stringify(res, null, 2));
    });

  program
    .command("senders")
    .description("List senders (GET /v1/senders)")
    .action(async () => {
      const res = await client().listSenders();
      console.log(JSON.stringify(res, null, 2));
    });

  program
    .command("campaigns")
    .description("Campaign helpers")
    .addCommand(
      new Command("list")
        .option("--limit <n>", "passed as query if API supports")
        .action(async () => {
          const res = await client().apiKeyListCampaigns();
          console.log(JSON.stringify(res, null, 2));
        }),
    )
    .addCommand(
      new Command("stats")
        .argument("<id>", "Campaign id")
        .action(async (id: string) => {
          const res = await client().apiKeyCampaignStats(id);
          console.log(JSON.stringify(res, null, 2));
        }),
    )
    .addCommand(
      new Command("send")
        .argument("<id>", "Campaign id")
        .action(async (id: string) => {
          const res = await client().apiKeySendCampaign(id);
          console.log(JSON.stringify(res, null, 2));
        }),
    );

  program
    .command("batch")
    .description("POST /v1/batch with one text message (smoke test)")
    .requiredOption("--to <e164>", "Recipient")
    .requiredOption("--message <text>", "Message")
    .action(async (opts) => {
      const res = await client().sendBatch([
        { to: opts.to, type: "text", message: opts.message },
      ]);
      console.log(JSON.stringify(res, null, 2));
    });

  await program.parseAsync(process.argv);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
