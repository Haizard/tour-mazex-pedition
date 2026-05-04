import { jsPDF } from "jspdf";
import fs from "fs";

try {
  const doc = new jsPDF();
  doc.text("Hello world!", 10, 10);
  const buffer = doc.output("arraybuffer");
  fs.writeFileSync("scratch/test_jspdf.pdf", Buffer.from(buffer));
  console.log("PDF generated successfully at scratch/test_jspdf.pdf");
} catch (error) {
  console.error("Error generating PDF:", error);
}
