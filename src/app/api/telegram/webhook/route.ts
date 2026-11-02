import { NextRequest, NextResponse } from "next/server";
import { defineAbilityFor, type AppAbility } from "@/lib/auth/ability";
import { escapeHtml } from "@/lib/utils";
import { linkTelegramAccount, stockAlertLists } from "@/services/inventory.service";
import { miniAppKeyboard, sendTelegramMessage } from "@/services/telegram.service";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat: { id: number };
    from?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
};

async function replyLowStock(chatId: number) {
  const { out, low } = await stockAlertLists();
  const lines = ["<b>Stock alerts</b>", ""];
  if (out.length === 0 && low.length === 0) {
    lines.push("Every active item is above its reorder level.");
  }
  if (out.length) {
    lines.push("Out of stock:");
    for (const item of out) lines.push(`• ${item.name} (${item.sku})`);
    lines.push("");
  }
  if (low.length) {
    lines.push("Low stock:");
    for (const item of low) {
      lines.push(`• ${item.name}: ${item.stockOnHand} left (reorder at ${item.reorderLevel})`);
    }
  }
  await sendTelegramMessage({
    chatId,
    text: lines.join("\n"),
    replyMarkup: miniAppKeyboard([{ text: "Open alerts", path: "/admin/alerts" }]),
  });
}

const destinations: Record<string, { text: string; path: string }> = {
  Dashboard: { text: "Dashboard", path: "/admin" },
  Inventory: { text: "Inventory", path: "/admin/inventory" },
  "Daily sales": { text: "Daily sales", path: "/admin/sales" },
  "Monthly report": { text: "Monthly report", path: "/admin/reports" },
  "Low stock": { text: "Low stock", path: "/admin/alerts" },
  Sell: { text: "Sell", path: "/pos" },
  "My sales": { text: "My sales", path: "/pos/sales" },
};

function shortcuts(ability: AppAbility) {
  const labels: string[] = [];
  if (ability.can("read", "Dashboard")) labels.push("Dashboard");
  if (ability.can("read", "Inventory")) labels.push("Inventory");
  if (ability.can("read", "SalesLedger")) labels.push("Daily sales");
  if (ability.can("read", "Report")) labels.push("Monthly report");
  if (ability.can("read", "Alert")) labels.push("Low stock");
  if (ability.can("create", "Sale")) labels.push("Sell");
  if (ability.can("read", "Sale") && !ability.can("read", "SalesLedger")) labels.push("My sales");
  return labels;
}

function replyKeyboard(labels: string[]) {
  const rows: { text: string }[][] = [];
  for (let i = 0; i < labels.length; i += 2) {
    rows.push(labels.slice(i, i + 2).map((text) => ({ text })));
  }
  if (rows.length === 0) return undefined;
  return { keyboard: rows, resize_keyboard: true };
}

export async function POST(req: NextRequest) {
  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
  const message = update?.message;
  if (!message?.from || !message.text) return NextResponse.json({ ok: true });

  const user = await linkTelegramAccount({
    id: message.from.id,
    first_name: message.from.first_name,
    last_name: message.from.last_name,
    username: message.from.username,
    language_code: message.from.language_code,
  });
  const text = message.text.trim();
  const chatId = message.chat.id;

  if (!user) {
    await sendTelegramMessage({
      chatId,
      text: "This Telegram account is not on the Aletheia staff list. Ask an admin to add your username, then send /start again.",
    });
    return NextResponse.json({ ok: true });
  }

  const ability = defineAbilityFor({
    id: user.id,
    permissions: user.role.permissions.map((row) => row.permission),
    isSuperAdmin: user.isSuperAdmin,
  });
  const labels = shortcuts(ability);
  const start = text.startsWith("/start") || text === "Start";

  if (start) {
    await sendTelegramMessage({
      chatId,
      text: `<b>Aletheia Cosmo &amp; Gift</b>\nSigned in as ${escapeHtml(user.name)} (${escapeHtml(user.role.name)}).`,
      replyMarkup: replyKeyboard(labels),
    });
    if (labels.length > 0) {
      await sendTelegramMessage({
        chatId,
        text: "Open the shop:",
        replyMarkup: miniAppKeyboard(labels.map((label) => destinations[label])),
      });
    }
    return NextResponse.json({ ok: true });
  }

  if (text === "Low stock" && ability.can("read", "Alert")) {
    await replyLowStock(chatId);
    return NextResponse.json({ ok: true });
  }

  const target = destinations[text];
  if (target && labels.includes(text)) {
    await sendTelegramMessage({
      chatId,
      text: target.text,
      replyMarkup: miniAppKeyboard([target]),
    });
    return NextResponse.json({ ok: true });
  }

  await sendTelegramMessage({
    chatId,
    text: labels.length ? "Choose a shortcut, or send /start." : "This account does not have a page to open yet.",
    replyMarkup: replyKeyboard(labels),
  });
  return NextResponse.json({ ok: true });
}
