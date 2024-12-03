import { CertificateGenerator } from '../utils/certificateGenerator.js';
import Certificate from '../models/certificate.model.js';
import User from '../models/user.model.js';
import Submission from '../models/submission.model.js';

export const downloadCertificate = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user._id;

    // Find the test submission with populated test data
    const submission = await Submission.findOne({
      test: testId,
      user: userId,
      status: 'completed'
    }).populate({
      path: 'test',
      select: 'title totalMarks passingMarks'
    });

    if (!submission) {
      return res.status(404).json({ message: "Test submission not found" });
    }

    if (!submission.test) {
      return res.status(404).json({ message: "Test details not found" });
    }

    // Determine certificate type based on score
    const isPassing = submission.totalScore >= submission.test.passingMarks;
    const certificateType = isPassing ? 'ACHIEVEMENT' : 'PARTICIPATION';

    // Find or create certificate
    let certificate = await Certificate.findOne({ 
      test: testId, 
      user: userId 
    });
    
    if (!certificate) {
      certificate = await Certificate.create({
        user: userId,
        test: testId,
        score: submission.totalScore,
        type: certificateType,
        issueDate: new Date()
      });
    } else {
      // Update certificate type if score has changed
      certificate.type = certificateType;
      certificate.score = submission.totalScore;
      await certificate.save();
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare certificate data
    const certificateData = {
      userName: user.name,
      testTitle: submission.test.title,
      score: submission.totalScore,
      totalMarks: submission.test.totalMarks,
      completedDate: certificate.issueDate,
      certificateId: certificate.certificateNumber,
      verificationUrl: `${process.env.FRONTEND_URL}/verify-certificate/${certificate.certificateNumber}`,
      certificateType,
      passingScore: submission.test.passingMarks,
      isPassing
    };

    // Generate PDF
    const generator = new CertificateGenerator();
    const doc = await generator.generateCertificate(certificateData);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificateType.toLowerCase()}-${certificate.certificateNumber}.pdf`);

    // Pipe the PDF to the response
    doc.pipe(res);
    doc.end();

  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ 
      message: "Error generating certificate", 
      error: error.message 
    });
  }
};

// Add certificate verification endpoint
export const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber } = req.params;

    const certificate = await Certificate.findOne({ certificateNumber })
      .populate('user', 'name')
      .populate('test', 'title');

    if (!certificate) {
      return res.status(404).json({ 
        message: "Certificate not found",
        valid: false 
      });
    }

    res.json({
      valid: true,
      certificate: {
        number: certificate.certificateNumber,
        issuedTo: certificate.user.name,
        testTitle: certificate.test.title,
        issueDate: certificate.issueDate,
        score: certificate.score
      }
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Error verifying certificate",
      error: error.message 
    });
  }
}; 