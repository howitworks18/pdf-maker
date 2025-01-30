import { useState } from "react";
import QRCode from "qrcode";
import Papa from "papaparse";
import jsPDF from "jspdf";
import { Button, Typography, Box, Paper, Divider, Badge } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CreateIcon from "@mui/icons-material/AddCircleOutline";

export default function PdfView() {
  const [entries, setEntries] = useState([]);
  const [uploadedImages, setUploadedImages] = useState({});
  const [imageCount, setImageCount] = useState(0);
  const [flyersGenerated, setFlyersGenerated] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setEntries(results.data);
          setFlyersGenerated(false); // Reset flyers when new CSV is uploaded
        },
      });
    }
  };

  const handleImageUpload = (e) => {
    const files = e.target.files;
    const newImages = { ...uploadedImages };

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (event) => {
        newImages[file.name] = event.target.result;
        setUploadedImages({ ...newImages });
      };
      reader.readAsDataURL(file);
    }
    setImageCount(files.length);
  };

  const generateFlyerCanvas = async (entry, canvas) => {
    const { logo, phone, message } = entry;
    const ctx = canvas.getContext("2d");

    const template = new Image();
    template.src = "/template.png";
    await new Promise((resolve) => (template.onload = resolve));

    canvas.width = template.width;
    canvas.height = template.height;
    ctx.drawImage(template, 0, 0);

    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(phone, 300, 398);

    const smsLink = `sms:${phone}?&body=${encodeURIComponent(message)}`;
    const qrCodeCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCodeCanvas, smsLink);
    ctx.drawImage(qrCodeCanvas, 280, 460, 250, 250);

    const logoImg = new Image();
    logoImg.src = uploadedImages[logo] || `/logos/${logo}`;
    await new Promise((resolve) => (logoImg.onload = resolve));
    ctx.drawImage(logoImg, 60, 350, 125, 48);

    const footerLogo = new Image();
    footerLogo.src = uploadedImages[logo] || `/logos/${logo}`;
    await new Promise((resolve) => (footerLogo.onload = resolve));
    ctx.drawImage(footerLogo, 460, 730, 125, 48);
  };

  const saveCanvasAsPdf = (canvas, fileName) => {
    const image = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(image, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(fileName);
  };

  const saveAllAsPdf = async () => {
    for (const entry of entries) {
      const flyerCanvas = document.createElement("canvas");
      await generateFlyerCanvas(entry, flyerCanvas);
      const customerName = entry.customer || `Flyer`;
      saveCanvasAsPdf(flyerCanvas, `${customerName}.pdf`);
    }
  };

  return (
    <Box sx={{ textAlign: "center", padding: "30px", maxWidth: "800px", margin: "auto" }}>
      <Typography variant="h4" sx={{ marginBottom: "20px", fontWeight: "bold" }}>
        Matts Cool Batch PDF Generator
      </Typography>

      <Paper sx={{ padding: "20px", boxShadow:'none',border:'none', marginBottom: "20px", background: "transparent" }}>
        {/* CSV Upload */}
        <Box sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" sx={{ marginBottom: "10px" }}>
            Upload CSV File
          </Typography>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadFileIcon />}
            sx={{ backgroundColor: "#007bff", color: "white", "&:hover": { backgroundColor: "#0056b3" } }}
          >
            Select CSV
            <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
          </Button>
        </Box>


        {/* Image Upload */}
        <Box sx={{ marginBottom: "20px" }}>
          <Typography variant="h6" sx={{ marginBottom: "10px" }}>
            Upload Images
          </Typography>
          <Badge badgeContent={imageCount} color="primary">
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadFileIcon />}
              sx={{ backgroundColor: "#28a745", color: "white", "&:hover": { backgroundColor: "#218838" } }}
            >
              Select Images
              <input type="file" accept="image/png, image/jpeg" multiple hidden onChange={handleImageUpload} />
            </Button>
          </Badge>
        </Box>
      </Paper>

      {/* "Create Flyers" Button (Only visible after CSV is uploaded) */}
      {entries.length > 0 && !flyersGenerated && (
        <Button
          variant="contained"
          startIcon={<CreateIcon />}
          sx={{
            marginBottom: "20px",
            backgroundColor: "#6200ea",
            color: "white",
            "&:hover": { backgroundColor: "#4b00b3" },
            fontSize: "16px",
            fontWeight: "bold",
            padding: "12px 20px",
          }}
          onClick={() => setFlyersGenerated(true)}
        >
          Create Flyers
        </Button>
      )}

      {/* Show "Save All PDFs" Button Only When Flyers Are Generated */}
      {flyersGenerated && (
        <Button
          variant="contained"
          startIcon={<PictureAsPdfIcon />}
          sx={{
            marginBottom: "20px",
            backgroundColor: "#ff9800",
            color: "white",
            "&:hover": { backgroundColor: "#e68900" },
            fontSize: "16px",
            fontWeight: "bold",
            padding: "12px 20px",
          }}
          onClick={saveAllAsPdf}
        >
          Save All as PDFs
        </Button>
      )}

      {/* Display Generated Flyers */}
      {flyersGenerated && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {entries.map((entry, index) => (
            <Paper key={index} sx={{ padding: "20px", borderRadius: "10px", marginBottom: "20px" }}>
              <canvas
                ref={async (canvas) => {
                  if (canvas) {
                    await generateFlyerCanvas(entry, canvas);
                  }
                }}
                style={{ border: "1px solid #ccc", width: "100%", maxWidth: "600px" }}
              ></canvas>

              <Button
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                sx={{
                  marginTop: "10px",
                  backgroundColor: "#007bff",
                  color: "white",
                  "&:hover": { backgroundColor: "#0056b3" },
                }}
                onClick={() => {
                  const flyerCanvas = document.createElement("canvas");
                  generateFlyerCanvas(entry, flyerCanvas).then(() => {
                    const customerName = entry.customer || `Flyer_${index + 1}`;
                    saveCanvasAsPdf(flyerCanvas, `${customerName}.pdf`);
                  });
                }}
              >
                Save as PDF
              </Button>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}
