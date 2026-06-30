import { jsPDF } from 'jspdf';
import { SkillNode, TargetRole, Badge, PeerReview } from '../types';

export interface ReportData {
  userEmail: string;
  targetRole: TargetRole;
  skills: SkillNode[];
  readinessScore: number;
  badges: Badge[];
  peerReviews: PeerReview[];
}

export function generatePDFReport(data: ReportData) {
  const { userEmail, targetRole, skills, readinessScore, badges, peerReviews } = data;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  let currentY = 20;

  // Helper to draw horizontal dividers
  const drawDivider = (y: number, color = [226, 232, 240]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
  };

  // Helper to check and add new page if content overflows
  const checkPageOverflow = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin) {
      doc.addPage();
      currentY = 20;
      // Draw dynamic header on subsequent pages
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Career Competency Passport | Candidate: ${userEmail}`, margin, 12);
      drawDivider(14, [241, 245, 249]);
      currentY = 20;
    }
  };

  // --- HEADER SECTION ---
  // Draw top banner accent
  doc.setFillColor(49, 46, 129); // Deep Indigo (#312E81)
  doc.rect(margin, currentY, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CAREER COMPETENCY DOSSIER', margin + 6, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(224, 231, 255); // indigo-100
  doc.text('SKILLVERIFIER SECURE COMPETENCY PASS', margin + 6, currentY + 16);

  currentY += 32;

  // --- CANDIDATE INFO & METRICS ---
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('CANDIDATE INFORMATION', margin, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600

  // Left Column Info
  doc.text(`Verified ID: ${userEmail}`, margin, currentY);
  doc.text(`Evaluation Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, currentY + 5);
  doc.text(`Target Benchmark: ${targetRole.name}`, margin, currentY + 10);

  // Right Column Score Gauge Box
  const gaugeX = pageWidth - margin - 50;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.rect(gaugeX, currentY - 4, 50, 20, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('READINESS SCORE', gaugeX + 5, currentY);

  // Set score color dynamically
  if (readinessScore >= 75) {
    doc.setTextColor(16, 185, 129); // emerald-500
  } else if (readinessScore >= 45) {
    doc.setTextColor(245, 158, 11); // amber-500
  } else {
    doc.setTextColor(239, 68, 68); // rose-500
  }
  doc.setFontSize(18);
  doc.text(`${readinessScore}%`, gaugeX + 5, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  const readinessLabel = readinessScore >= 75 ? 'Senior Grade Ready' : readinessScore >= 45 ? 'Mid-Level Competency' : 'Junior Baseline';
  doc.text(readinessLabel.toUpperCase(), gaugeX + 5, currentY + 13);

  currentY += 22;
  drawDivider(currentY);
  currentY += 10;

  // --- SECTION 1: VERIFIED SKILL MATRICES ---
  checkPageOverflow(50);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('VERIFIED SKILL GRADINGS & WEIGHTS', margin, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('Scores represent verified AI reality checks benchmarked against senior technical & leadership expectations.', margin, currentY);
  currentY += 8;

  // Table Headers
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, currentY, contentWidth, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('SKILL MODULE', margin + 3, currentY + 5);
  doc.text('DOMAIN', margin + 65, currentY + 5);
  doc.text('WEIGHT', margin + 115, currentY + 5);
  doc.text('VERIFIED GRADE', margin + 140, currentY + 5);

  currentY += 11;

  // List Required Skills first, then optional
  targetRole.requiredSkills.forEach(req => {
    checkPageOverflow(12);
    const node = skills.find(s => s.id === req.skillId);
    if (!node) return;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(node.name, margin + 3, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(node.domain, margin + 65, currentY);
    doc.text(`${Math.round(req.weight * 100)}%`, margin + 115, currentY);

    if (node.score !== null) {
      doc.setFont('helvetica', 'bold');
      if (node.score >= 80) {
        doc.setTextColor(16, 185, 129); // emerald
        doc.text(`${node.score}% (Senior)`, margin + 140, currentY);
      } else if (node.score >= 60) {
        doc.setTextColor(217, 119, 6); // amber
        doc.text(`${node.score}% (Mid)`, margin + 140, currentY);
      } else {
        doc.setTextColor(225, 29, 72); // rose
        doc.text(`${node.score}% (Beginner)`, margin + 140, currentY);
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text('Not Tested', margin + 140, currentY);
    }

    // Draw an under-bar line
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(margin, currentY + 3, pageWidth - margin, currentY + 3);

    currentY += 8;
  });

  currentY += 5;
  drawDivider(currentY);
  currentY += 10;

  // --- SECTION 2: GAMIFIED ACHIEVEMENT CREDENTIALS ---
  checkPageOverflow(40);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('UNLOCKED ACHIEVEMENT CREDENTIALS', margin, currentY);
  currentY += 6;

  const unlockedBadges = badges.filter(b => b.unlocked);
  if (unlockedBadges.length > 0) {
    unlockedBadges.forEach(badge => {
      checkPageOverflow(14);
      doc.setFillColor(240, 253, 250); // teal-50
      doc.setDrawColor(204, 251, 241); // teal-100
      doc.rect(margin, currentY, contentWidth, 11, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(13, 148, 136); // teal-600
      doc.text(`[CREDENTIAL] ${badge.name}`, margin + 4, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(badge.description, margin + 4, currentY + 8.5);

      if (badge.unlockedAt) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(115, 115, 115);
        doc.text(`Awarded: ${badge.unlockedAt}`, pageWidth - margin - 40, currentY + 4.5);
      }

      currentY += 14;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('No achievement credentials unlocked yet. Complete reality tests with scores >= 70% to claim badges.', margin + 3, currentY);
    currentY += 8;
  }

  currentY += 4;
  drawDivider(currentY);
  currentY += 10;

  // --- SECTION 3: PEER AUDIT & TESTIMONIAL SUMMARY ---
  checkPageOverflow(40);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PEER AUDITS & FEEDBACK SUMMARIES', margin, currentY);
  currentY += 6;

  const userReceivedReviews = peerReviews.filter(r => r.reviewerName !== 'You (Student)');
  if (userReceivedReviews.length > 0) {
    userReceivedReviews.slice(0, 2).forEach(review => {
      checkPageOverflow(22);
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(241, 245, 249); // slate-100
      doc.rect(margin, currentY, contentWidth, 16, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(`${review.reviewerName} (${review.reviewerRole})`, margin + 4, currentY + 4.5);

      // Star display
      const starsText = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(245, 158, 11); // amber
      doc.text(starsText, margin + 4, currentY + 8);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // slate-600
      const splitFeedback = doc.splitTextToSize(`"${review.textFeedback}"`, contentWidth - 8);
      doc.text(splitFeedback, margin + 4, currentY + 11.5);

      currentY += 20;
    });
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('No external peer reviews received yet. Submit evaluations in the Peer Review Center to trigger interaction.', margin + 3, currentY);
    currentY += 8;
  }

  currentY += 2;
  drawDivider(currentY);
  currentY += 10;

  // --- SECTION 4: GROWTH ACTION PLAN ---
  checkPageOverflow(40);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('EXECUTIVE GROWTH RECOMMENDATIONS', margin, currentY);
  currentY += 6;

  const untestedSkillsList = targetRole.requiredSkills
    .map(req => skills.find(s => s.id === req.skillId))
    .filter(s => s && s.score === null);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  if (untestedSkillsList.length > 0) {
    const listNames = untestedSkillsList.map(s => s?.name).join(', ');
    const planText = `Based on your profile matrix, you have critical unverified domains required for the ${targetRole.name} position: (${listNames}). Your immediate action plan is to prepare written responses targeting these criteria. Focus heavily on actual formulas and compliant operational workflows.`;
    const splitPlan = doc.splitTextToSize(planText, contentWidth - 4);
    doc.text(splitPlan, margin + 2, currentY);
  } else if (readinessScore < 75) {
    const planText = `You have completed all baseline skills, but your competency level is within the intermediate range (${readinessScore}%). To advance to a certified Senior Career level, re-take the low-performing modules and optimize for deep technical nuances like compliance law depth and robust audit models.`;
    const splitPlan = doc.splitTextToSize(planText, contentWidth - 4);
    doc.text(splitPlan, margin + 2, currentY);
  } else {
    const planText = `Exceptional matrix! You have obtained a verified ${readinessScore}% overall rating, positioning you inside the Senior Executive tier. We recommend adding this certified competency dossier to your job application letters and showcasing your compliance/Excel results directly to hiring agents.`;
    const splitPlan = doc.splitTextToSize(planText, contentWidth - 4);
    doc.text(splitPlan, margin + 2, currentY);
  }

  // Footer stamp
  currentY = pageHeight - 15;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Certified by Skill Reality Check. Deep Learning recruiter rubrics powered by Gemini AI models.', margin, currentY);

  const pagesCount = doc.internal.pages.length - 1;
  doc.text(`Page 1 of ${pagesCount}`, pageWidth - margin - 15, currentY);

  // Trigger download
  const cleanRoleName = targetRole.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`SkillProfile_${cleanRoleName}_Report.pdf`);
}
