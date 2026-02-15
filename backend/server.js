import { app, connectDB } from './app.js';
import { testEmailConfig } from './utils/emailService.js';
import { testPinataConnection } from './utils/pinataService.js';
import { runEvidenceIntegritySweep } from './routes/evidenceController.js';
const PORT = process.env.PORT || 5000;

/* -------------------- Boot -------------------- */
const startServer = async () => {
  app.listen(PORT, async () => {
    console.log(`🚀 Justice Chain running on http://localhost:${PORT}`);

    try {
      await connectDB();
    } catch (error) {
      process.exit(1);
    }

    const emailOK = await testEmailConfig();
    if (emailOK) console.log('✅ Email service verified');
    else console.warn('⚠️ Email service failed');

    const pinataOK = await testPinataConnection();
    if (pinataOK) console.log('✅ Pinata connected');
    else console.warn('⚠️ Pinata not connected');

    const intervalMs = Number(process.env.EVIDENCE_MONITOR_INTERVAL_MS || 300000);
    setInterval(runEvidenceIntegritySweep, intervalMs);
  });
};

startServer();

