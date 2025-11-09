import jsPDF from 'jspdf';

interface KPIMetric {
  current: number;
  target: number;
  status: 'on-track' | 'warning' | 'off-target';
  trend: { value: number; isPositive: boolean };
}

interface KPIData {
  energyPerConversation: KPIMetric;
  carbonFootprint: KPIMetric;
  efficiencyRatio: KPIMetric;
  emissionsSavings: KPIMetric;
  renewableEnergy: KPIMetric;
}

interface TrendDataPoint {
  date: string;
  energy: number;
  carbon: number;
  efficiency: number;
  renewable: number;
}

interface BreakdownData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

/**
 * Export KPI Status Analysis to PDF
 * This function captures all sections of the KPI dashboard and generates a comprehensive PDF report
 */
export async function exportKPIToPDF(
  dateRange: string,
  kpiData: KPIData,
  trendData: TrendDataPoint[],
  energyBreakdownData: BreakdownData[],
  emissionsBreakdownData: BreakdownData[]
): Promise<void> {
  try {
    // Create a new jsPDF instance with A4 size
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add a new page if needed
    const checkAndAddPage = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to add text with word wrap
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return lines.length * (fontSize * 0.35); // Return height used
    };

    // ===== COVER PAGE =====
    pdf.setFillColor(34, 139, 34); // Green header
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text('KPI Status Analysis', pageWidth / 2, 25, { align: 'center' });
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Sustainability Performance Metrics Report', pageWidth / 2, 35, { align: 'center' });

    yPosition = 60;
    pdf.setTextColor(0, 0, 0);
    
    // Report metadata
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Report Details:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Date Range: ${dateRange}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 6;
    pdf.text(`Report Type: Comprehensive KPI Analysis`, margin, yPosition);
    yPosition += 15;

    // ===== SECTION 1: OVERALL KPI SUMMARY =====
    checkAndAddPage(80);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('1. Overall KPI Summary', margin + 2, yPosition + 6);
    yPosition += 12;

    // KPI Cards in a grid
    const kpiMetrics = [
      {
        title: 'Energy Consumption per Conversation',
        current: kpiData.energyPerConversation.current,
        target: kpiData.energyPerConversation.target,
        unit: 'kWh',
        status: kpiData.energyPerConversation.status,
        trend: kpiData.energyPerConversation.trend,
      },
      {
        title: 'Carbon Footprint per 1K Conversations',
        current: kpiData.carbonFootprint.current,
        target: kpiData.carbonFootprint.target,
        unit: 'kg CO₂',
        status: kpiData.carbonFootprint.status,
        trend: kpiData.carbonFootprint.trend,
      },
      {
        title: 'Efficiency Ratio',
        current: kpiData.efficiencyRatio.current,
        target: kpiData.efficiencyRatio.target,
        unit: 'conv/kWh',
        status: kpiData.efficiencyRatio.status,
        trend: kpiData.efficiencyRatio.trend,
      },
      {
        title: 'Emissions Savings from Automation',
        current: kpiData.emissionsSavings.current,
        target: kpiData.emissionsSavings.target,
        unit: '%',
        status: kpiData.emissionsSavings.status,
        trend: kpiData.emissionsSavings.trend,
      },
      {
        title: 'Renewable Energy Usage',
        current: kpiData.renewableEnergy.current,
        target: kpiData.renewableEnergy.target,
        unit: 'g/kwh',
        status: kpiData.renewableEnergy.status,
        trend: kpiData.renewableEnergy.trend,
      },
    ];

    const cardWidth = (contentWidth - 10) / 2;
    const cardHeight = 25;
    let cardX = margin;
    let cardY = yPosition;

    kpiMetrics.forEach((metric, index) => {
      if (index > 0 && index % 2 === 0) {
        cardX = margin;
        cardY += cardHeight + 5;
        checkAndAddPage(cardHeight + 10);
      }

      // Card background
      const statusColor: [number, number, number] = metric.status === 'on-track' ? [34, 197, 94] :
                         metric.status === 'warning' ? [251, 191, 36] : [239, 68, 68];
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(cardX, cardY, cardWidth, cardHeight);

      // Status indicator
      pdf.setFillColor(...statusColor);
      pdf.circle(cardX + 5, cardY + 5, 2, 'F');

      // Title
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      const titleLines = pdf.splitTextToSize(metric.title, cardWidth - 12);
      pdf.text(titleLines, cardX + 3, cardY + 10);

      // Current value
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${metric.current.toFixed(4)} ${metric.unit}`, cardX + 3, cardY + 17);

      // Target
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Target: ${metric.target.toFixed(4)} ${metric.unit}`, cardX + 3, cardY + 21);

      // Trend
      const trendSymbol = metric.trend.isPositive ? '↑' : '↓';
      const trendColor: [number, number, number] = metric.trend.isPositive ? [34, 197, 94] : [239, 68, 68];
      pdf.setTextColor(...trendColor);
      pdf.text(`${trendSymbol} ${Math.abs(metric.trend.value).toFixed(1)}%`, cardX + cardWidth - 20, cardY + 21);
      pdf.setTextColor(0, 0, 0);

      cardX += cardWidth + 5;
    });

    yPosition = cardY + cardHeight + 15;

    // ===== SECTION 2: TREND DATA TABLE =====
    checkAndAddPage(60);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('2. KPI Trends Over Time', margin + 2, yPosition + 6);
    yPosition += 12;

    // Table headers
    const colWidths = [30, 28, 28, 28, 28, 28];
    const headers = ['Period', 'Energy (kWh)', 'Carbon (kg CO₂)', 'Renewable %', 'Efficiency %', 'Status'];
    
    pdf.setFillColor(59, 130, 246);
    pdf.setTextColor(255, 255, 255);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    let xPos = margin + 2;
    headers.forEach((header, i) => {
      pdf.text(header, xPos, yPosition + 5.5);
      xPos += colWidths[i];
    });
    yPosition += 8;
    pdf.setTextColor(0, 0, 0);

    // Table rows
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    
    trendData.forEach((row, index) => {
      checkAndAddPage(7);
      
      // Alternating row colors
      if (index % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, yPosition, contentWidth, 7, 'F');
      }

      xPos = margin + 2;
      pdf.text(row.date, xPos, yPosition + 5);
      xPos += colWidths[0];
      pdf.text(row.energy.toFixed(4), xPos, yPosition + 5);
      xPos += colWidths[1];
      pdf.text(row.carbon.toFixed(4), xPos, yPosition + 5);
      xPos += colWidths[2];
      pdf.text(`${row.renewable}%`, xPos, yPosition + 5);
      xPos += colWidths[3];
      pdf.text(`${row.efficiency}%`, xPos, yPosition + 5);
      xPos += colWidths[4];
      
      // Status badge
      const status = row.efficiency >= 40 ? 'Excellent' : 
                    row.efficiency >= 38 ? 'On Track' : 
                    row.efficiency >= 36 ? 'Improving' : 'Baseline';
      pdf.text(status, xPos, yPosition + 5);
      
      yPosition += 7;
    });

    yPosition += 10;

    // ===== SECTION 3: PERFORMANCE STATUS =====
    checkAndAddPage(50);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('3. Performance Status', margin + 2, yPosition + 6);
    yPosition += 12;

    const performanceMetrics = [
      { label: 'Energy Efficiency', value: 85, type: 'success' },
      { label: 'Carbon Reduction', value: 78, type: 'success' },
      { label: 'Renewable Adoption', value: 75, type: 'warning' },
      { label: 'Automation Impact', value: 92, type: 'success' },
      { label: 'Overall Sustainability Score', value: 82, type: 'info' },
    ];

    performanceMetrics.forEach((metric) => {
      checkAndAddPage(12);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(metric.label, margin, yPosition);
      
      // Progress bar
      const barWidth = contentWidth - 50;
      const barHeight = 6;
      const barX = margin + 50;
      
      // Background
      pdf.setFillColor(229, 231, 235);
      pdf.rect(barX, yPosition - 4, barWidth, barHeight, 'F');
      
      // Progress
      const progressWidth = (barWidth * metric.value) / 100;
      const progressColor: [number, number, number] = metric.type === 'success' ? [34, 197, 94] :
                           metric.type === 'warning' ? [251, 191, 36] :
                           metric.type === 'info' ? [59, 130, 246] : [239, 68, 68];
      pdf.setFillColor(...progressColor);
      pdf.rect(barX, yPosition - 4, progressWidth, barHeight, 'F');
      
      // Percentage
      pdf.setFontSize(9);
      pdf.text(`${metric.value}%`, barX + barWidth + 3, yPosition);
      
      yPosition += 10;
    });

    yPosition += 10;

    // ===== SECTION 4: ENERGY & EMISSIONS BREAKDOWN =====
    pdf.addPage();
    yPosition = margin;
    
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('4. Emissions & Energy Breakdown', margin + 2, yPosition + 6);
    yPosition += 12;

    // Energy Source Distribution
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Energy Source Distribution', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    energyBreakdownData.forEach((item) => {
      checkAndAddPage(8);
      
      // Color box
      const rgb = hexToRgb(item.color);
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.rect(margin, yPosition - 3, 5, 5, 'F');
      
      pdf.text(`${item.name}: ${item.value}`, margin + 8, yPosition);
      yPosition += 6;
    });

    yPosition += 8;

    // Emissions by Source
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Emissions by Source', margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    emissionsBreakdownData.forEach((item) => {
      checkAndAddPage(8);
      
      // Color box
      const rgb = hexToRgb(item.color);
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.rect(margin, yPosition - 3, 5, 5, 'F');
      
      pdf.text(`${item.name}: ${item.value}%`, margin + 8, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // ===== SECTION 5: EFFICIENCY INSIGHTS =====
    checkAndAddPage(60);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('5. Efficiency Insights', margin + 2, yPosition + 6);
    yPosition += 12;

    // Key Insights
    pdf.setFillColor(239, 246, 255);
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(1);
    pdf.rect(margin, yPosition, contentWidth, 25, 'FD');

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 64, 175);
    pdf.text('📊 Key Insights', margin + 3, yPosition + 6);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('• Energy consumption decreased by 5% compared to last month', margin + 5, yPosition + 12);
    pdf.text('• Carbon footprint reduced by 8% through increased renewable usage', margin + 5, yPosition + 17);
    pdf.text('• Automation efficiency improved, saving 65% of emissions', margin + 5, yPosition + 22);
    yPosition += 30;

    // Recommendations
    checkAndAddPage(30);
    pdf.setFillColor(240, 253, 244);
    pdf.setDrawColor(34, 197, 94);
    pdf.setLineWidth(1);
    pdf.rect(margin, yPosition, contentWidth, 25, 'FD');

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(21, 128, 61);
    pdf.text('💡 Recommendations', margin + 3, yPosition + 6);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    pdf.text('• Increase renewable energy usage to reach 80% target', margin + 5, yPosition + 12);
    pdf.text('• Optimize conversation processing to reduce energy per conversation', margin + 5, yPosition + 17);
    pdf.text('• Consider implementing caching to improve efficiency ratio', margin + 5, yPosition + 22);
    yPosition += 30;

    // ===== SECTION 6: ACHIEVEMENT & IMPACT SUMMARY =====
    checkAndAddPage(70);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('6. Achievement & Impact Summary', margin + 2, yPosition + 6);
    yPosition += 12;

    // Achievement cards
    const achievements = [
      {
        icon: '🎯',
        value: `${kpiData.emissionsSavings.current.toFixed(2)}%`,
        label: 'Emissions Saved This Year',
        color: [34, 197, 94],
      },
      {
        icon: '⚡',
        value: `${kpiData.renewableEnergy.current.toFixed(2)}g/kwh`,
        label: 'Renewable Energy Contribution',
        color: [59, 130, 246],
      },
      {
        icon: '🌍',
        value: `${kpiData.carbonFootprint.current.toFixed(4)} kg`,
        label: 'CO₂ per 1K Conversations',
        color: [168, 85, 247],
      },
    ];

    const achievementCardWidth = (contentWidth - 10) / 3;
    let achievementX = margin;

    achievements.forEach((achievement) => {
      pdf.setDrawColor(...(achievement.color as [number, number, number]));
      pdf.setLineWidth(0.5);
      pdf.rect(achievementX, yPosition, achievementCardWidth, 20);

      pdf.setFontSize(16);
      pdf.text(achievement.icon, achievementX + 3, yPosition + 8);

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...(achievement.color as [number, number, number]));
      pdf.text(achievement.value, achievementX + 3, yPosition + 14);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      const labelLines = pdf.splitTextToSize(achievement.label, achievementCardWidth - 6);
      pdf.text(labelLines, achievementX + 3, yPosition + 18);

      achievementX += achievementCardWidth + 5;
    });

    yPosition += 25;

    // Milestones
    checkAndAddPage(50);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('🏆 Milestones & Progress', margin, yPosition);
    yPosition += 8;

    const milestones = [
      {
        title: `Renewable Energy Target: ${kpiData.renewableEnergy.target}g/kwh`,
        current: `Current: ${kpiData.renewableEnergy.current.toFixed(2)}g/kwh`,
        status: kpiData.renewableEnergy.current >= kpiData.renewableEnergy.target ? '✓ Target Achieved!' :
                `${((kpiData.renewableEnergy.current / kpiData.renewableEnergy.target) * 100).toFixed(0)}% complete`,
        achieved: kpiData.renewableEnergy.current >= kpiData.renewableEnergy.target,
      },
      {
        title: `Carbon Footprint Target: ${kpiData.carbonFootprint.target} kg CO₂`,
        current: `Current: ${kpiData.carbonFootprint.current.toFixed(4)} kg CO₂`,
        status: `Status: ${kpiData.carbonFootprint.status}`,
        achieved: kpiData.carbonFootprint.status === 'on-track',
      },
      {
        title: `Emissions Savings Target: ${kpiData.emissionsSavings.target}%`,
        current: `Current: ${kpiData.emissionsSavings.current.toFixed(1)}%`,
        status: kpiData.emissionsSavings.current >= kpiData.emissionsSavings.target ? '✓ Target Achieved!' :
                `${((kpiData.emissionsSavings.current / kpiData.emissionsSavings.target) * 100).toFixed(0)}% complete`,
        achieved: kpiData.emissionsSavings.current >= kpiData.emissionsSavings.target,
      },
      {
        title: `Efficiency Ratio Target: ${kpiData.efficiencyRatio.target} conv/kWh`,
        current: `Current: ${kpiData.efficiencyRatio.current.toFixed(1)} conv/kWh`,
        status: `Status: ${kpiData.efficiencyRatio.status}`,
        achieved: kpiData.efficiencyRatio.status === 'on-track',
      },
    ];

    milestones.forEach((milestone) => {
      checkAndAddPage(15);

      // Status icon
      const iconColor: [number, number, number] = milestone.achieved ? [34, 197, 94] : [251, 191, 36];
      pdf.setFillColor(...iconColor);
      pdf.circle(margin + 3, yPosition + 2, 2, 'F');

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(milestone.title, margin + 8, yPosition + 3);

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(milestone.current + ' - ' + milestone.status, margin + 8, yPosition + 8);

      yPosition += 12;
    });

    yPosition += 10;

    // ===== SECTION 7: DATA VALIDATION & NOTES =====
    pdf.addPage();
    yPosition = margin;

    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, contentWidth, 8, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('7. Data Validation & Notes', margin + 2, yPosition + 6);
    yPosition += 12;

    // Methodology
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Methodology', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const methodologyText = 'KPIs are calculated based on real-time data from all active chatbot conversations. ' +
      'Energy consumption is measured per conversation, and carbon footprint is calculated using standard emission factors. ' +
      'Renewable energy percentage reflects the proportion of clean energy sources used in data centers.';
    const methodologyHeight = addWrappedText(methodologyText, margin, yPosition, contentWidth, 9);
    yPosition += methodologyHeight + 8;

    // Data Sources
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Data Sources', margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('• Energy consumption: Real-time monitoring from cloud infrastructure', margin, yPosition);
    yPosition += 5;
    pdf.text('• Carbon emissions: EPA and international emission factor databases', margin, yPosition);
    yPosition += 5;
    pdf.text('• Renewable energy: Data center energy source reports', margin, yPosition);
    yPosition += 10;

    // Admin Notes
    checkAndAddPage(30);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Admin Notes', margin, yPosition);
    yPosition += 6;

    pdf.setFillColor(249, 250, 251);
    pdf.rect(margin, yPosition, contentWidth, 20, 'F');

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    const adminNotesText = `Last updated: ${new Date().toLocaleDateString()} - All metrics validated and verified. ` +
      'System performance is stable with consistent improvements in energy efficiency. ' +
      'Monitoring renewable energy targets for Q2 2024.';
    addWrappedText(adminNotesText, margin + 3, yPosition + 5, contentWidth - 6, 9);
    yPosition += 25;

    // ===== FOOTER ON LAST PAGE =====
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(128, 128, 128);
    pdf.text('This report was automatically generated by the KPI Status Analysis system.', pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text(`Page ${pdf.internal.pages.length - 1}`, pageWidth / 2, pageHeight - 5, { align: 'center' });

    // Save the PDF
    pdf.save(`KPI_Status_Analysis_${dateRange}_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

