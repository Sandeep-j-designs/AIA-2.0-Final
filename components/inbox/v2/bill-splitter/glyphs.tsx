import { FileText, FilePlus2 } from "@/components/icons";

export const PdfGlyph = ({ size = 16 }: { size?: number }) => (
  <FileText size={size} />
);
export const DropFileGlyph = () => <FilePlus2 size={40} />;
