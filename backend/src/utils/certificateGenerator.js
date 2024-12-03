import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CertificateGenerator {
  constructor() {
    // Load fonts
    this.regularFont = 'Helvetica';
    this.boldFont = 'Helvetica-Bold';
    
    // Define certificate dimensions (matching frontend width/height ratio)
    this.width = 842;  // A4 Landscape
    this.height = 595;
    
    // Define colors to match frontend exactly
    this.colors = {
      title: 'skyblue',
      text: '#666666',
      score: '#00bcd4'
    };
    
    // Template path
    this.templatePath = path.join(__dirname, '../assets/certificate-template.png');
  }

  async generateCertificate(certificateData) {
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 0
    });

    // Add template background first
    if (fs.existsSync(this.templatePath)) {
      doc.image(this.templatePath, 0, 0, {
        width: this.width,
        height: this.height
      });
    }

    // Add content on top of background
    await this.addMainContent(doc, certificateData);
    await this.addFooter(doc, certificateData);

    return doc;
  }

  async addMainContent(doc, data) {
    const { 
      userName, 
      testTitle, 
      score, 
      totalMarks, 
      completedDate,
      certificateType 
    } = data;

    // Congratulations header - matching frontend styles exactly
    doc.font(this.boldFont)
       .fontSize(45)
       .fillColor(this.colors.title)
       .strokeColor('black')
       .lineWidth(1.5)  // -webkit-text-stroke-width: 1.5px from CSS
       .fillAndStroke('Congratulations!', this.width / 2, 160, { 
         align: 'center'
       });

    // Username - matching h1 style
    doc.font(this.boldFont)
       .fontSize(45)
       .fillColor(this.colors.title)
       .strokeColor('black')
       .lineWidth(1.5)
       .fillAndStroke(userName, this.width / 2, 220, { 
         align: 'center'
       });

    // Changed from "quiz" to dynamic test title
    doc.font(this.regularFont)
       .fontSize(18)
       .fillColor(this.colors.text)
       .text(`You have completed ${testTitle}`, this.width / 2, 280, { 
         align: 'center'
       });

    // Score - matching .score class
    doc.font(this.boldFont)
       .fontSize(20)
       .fillColor(this.colors.score)
       .text(`Your score: ${score} out of ${totalMarks}`, this.width / 2, 320, { 
         align: 'center'
       });

    // Certificate title with type
    doc.font(this.boldFont)
       .fontSize(24)
       .fillColor(this.colors.text)
       .text(`Certificate of ${certificateType}`, this.width / 2, 380, { align: 'center' });

    // Additional text - matching p style
    doc.font(this.regularFont)
       .fontSize(18)
       .fillColor(this.colors.text)
       .text('This certificate is proof of your achievement.', this.width / 2, 420, { 
         align: 'center'
       });

    // Date - matching p style
    const formattedDate = new Date(completedDate).toLocaleDateString();
    doc.font(this.regularFont)
       .fontSize(18)
       .text(`Date: ${formattedDate}`, this.width / 2, 460, { 
         align: 'center'
       });
  }

  async addFooter(doc, data) {
    // Add footer content
  }
} 