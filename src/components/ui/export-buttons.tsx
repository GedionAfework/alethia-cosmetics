import { FileSpreadsheet, FileText } from "lucide-react";
import { ButtonAnchor } from "@/components/ui/button";

export function ExportButtons({ base, labels }: { base: string; labels: { excel: string; pdf: string } }) {
  const join = base.includes("?") ? "&" : "?";
  return (
    <>
      <ButtonAnchor href={`${base}${join}format=xls`} size="sm">
        <FileSpreadsheet />
        {labels.excel}
      </ButtonAnchor>
      <ButtonAnchor href={`${base}${join}format=pdf`} size="sm">
        <FileText />
        {labels.pdf}
      </ButtonAnchor>
    </>
  );
}
