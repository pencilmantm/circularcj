export const copyToClipboard = async (persona, stages, touchpoints) => {
  // Format the data with tabs and newlines
  const personaSection = [
    ['PERSONA DETAILS', '', '', '', '', '', '', '', '', ''],
    ['Name', persona.name, '', '', '', '', '', '', '', ''],
    ['Description', persona.description, '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '']  // Empty row for spacing
  ];

  const stagesHeader = [
    ['JOURNEY STAGES', '', '', '', '', '', '', '', '', ''],
    ['Stage Title', 'Emotion', 'Effort Level', 'Objectives', 'Thoughts', 'Actions', 'Friction Points', 'Moments of Truth', 'Opportunities', 'Touchpoints']
  ];

  const stagesData = stages.map(stage => {
    // Get all touchpoints for this stage and format for Excel
    const stageTouchpoints = touchpoints
      .filter(t => t.stageId === stage.id)
      .map(t => `• ${t.content}`); // Add bullet points

    // Create Excel formula if there are touchpoints
    const touchpointsFormula = stageTouchpoints.length > 0 
      ? `=JOIN(CHAR(10),"${stageTouchpoints.join('","')}")` 
      : '';

    return [
      stage.title,
      stage.emotion,
      stage.effort,
      stage.objectives,
      stage.thoughts,
      stage.actions,
      stage.frictionPoints,
      stage.momentsOfTruth,
      stage.opportunities,
      touchpointsFormula
    ];
  });

  // Combine all data
  const allData = [
    ...personaSection,
    ...stagesHeader,
    ...stagesData
  ];

  // Convert to TSV format
  const tsvContent = allData
    .map(row => row.join('\t'))
    .join('\n');

  // Copy to clipboard
  try {
    await navigator.clipboard.writeText(tsvContent);
    return true;
  } catch (err) {
    console.error('Clipboard error:', err);
    return false;
  }
};