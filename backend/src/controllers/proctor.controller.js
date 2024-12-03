export const recordProctorEvent = async (req, res) => {
  try {
    const { sessionId, eventType, details } = req.body;
    const session = await TestSession.findById(sessionId);
    
    session.proctorNotes.push({
      timestamp: new Date(),
      note: details,
      type: eventType
    });
    
    await session.save();
    res.json({ message: "Proctor event recorded" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 