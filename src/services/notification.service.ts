import { prisma } from "@/lib/db/prisma";
import { escapeHtml } from "@/lib/utils";
import { miniAppKeyboard, sendTelegramMessage } from "@/services/telegram.service";

type StockAlertProduct = {
  id: string;
  name: string;
  sku: string;
  stockOnHand: number;
  reorderLevel: number;
  alertedBelowReorder: boolean;
};

export async function notifyStockLevel(product: StockAlertProduct) {
  const low = product.stockOnHand <= product.reorderLevel;
  if (!low) {
    if (product.alertedBelowReorder) {
      await prisma.product.update({
        where: { id: product.id },
        data: { alertedBelowReorder: false },
      });
    }
    return;
  }
  if (product.alertedBelowReorder) return;

  await prisma.product.update({
    where: { id: product.id },
    data: { alertedBelowReorder: true },
  });

  const recipients = await prisma.user.findMany({
    where: {
      isActive: true,
      telegramId: { not: null },
      OR: [{ isSuperAdmin: true }, { role: { permissions: { some: { permission: "alert:read" } } } }],
    },
  });
  if (recipients.length === 0) return;

  const text =
    product.stockOnHand <= 0
      ? `<b>Out of stock</b>\n${escapeHtml(product.name)} (${escapeHtml(product.sku)}) has sold out.`
      : `<b>Low stock</b>\n${escapeHtml(product.name)} (${escapeHtml(product.sku)}) has ${product.stockOnHand} left. Reorder level is ${product.reorderLevel}.`;

  await Promise.all(
    recipients.map((admin) =>
      admin.telegramId
        ? sendTelegramMessage({
            chatId: admin.telegramId,
            text,
            replyMarkup: miniAppKeyboard([{ text: "Open alerts", path: "/admin/alerts" }]),
          })
        : Promise.resolve()
    )
  );
}

export async function clearStockAlertIfRecovered(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;
  if (product.stockOnHand > product.reorderLevel && product.alertedBelowReorder) {
    await prisma.product.update({
      where: { id: product.id },
      data: { alertedBelowReorder: false },
    });
  }
}
