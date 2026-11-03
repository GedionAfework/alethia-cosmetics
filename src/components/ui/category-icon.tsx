import { Gift, Package, SprayCan, Sparkles, type LucideIcon } from "lucide-react";
import { IconTile } from "@/components/ui/list";

const icons: Record<string, LucideIcon> = {
  COSMETICS: Sparkles,
  PERFUMES: SprayCan,
  GIFTS: Gift,
};

export function CategoryIcon({ category, muted = false }: { category: string; muted?: boolean }) {
  return <IconTile icon={icons[category] ?? Package} tone={muted ? "muted" : "accent"} />;
}
