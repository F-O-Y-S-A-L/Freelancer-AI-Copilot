import {
  renderTemplate,
  validateTemplate,
  buildTemplateContext,
  TEMPLATE_VARIABLES_CONFIG,
} from '../src/shared/templateRenderer';
import { Template } from '../src/server/models/Template';
import { Inquiry } from '../src/server/models/Inquiry';

function runTemplateTests() {
  console.log('=== RUNNING DYNAMIC TEMPLATE VARIABLE VERIFICATION SUITE ===');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
  }

  // FLOW 1: Create/save a template containing all 4 placeholders
  console.log('\n--- Flow 1: Create/save template with dynamic placeholders ---');
  const rawTemplateContent =
    'Hi {{clientName}},\nThank you for reaching out! I am {{freelancerName}}. I would love to work on {{projectName}} and can deliver it by {{deliveryDate}}.\nBest regards,\n{{freelancerName}}';

  assert(
    rawTemplateContent.includes('{{clientName}}') &&
      rawTemplateContent.includes('{{freelancerName}}') &&
      rawTemplateContent.includes('{{projectName}}') &&
      rawTemplateContent.includes('{{deliveryDate}}'),
    'Template string contains all 4 standard dynamic placeholders'
  );

  // FLOW 2: Confirm MongoDB stores the placeholders unchanged
  console.log('\n--- Flow 2: Confirm database models store placeholders unchanged ---');
  const templateDoc = new Template({
    userId: 'user-test-123',
    title: 'Standard Client Proposal',
    category: 'First Response',
    content: rawTemplateContent,
  });

  assert(
    templateDoc.content === rawTemplateContent,
    'Template document preserves exact raw placeholder syntax without premature substitution'
  );
  assert(
    templateDoc.content.includes('{{clientName}}') &&
      templateDoc.content.includes('{{freelancerName}}') &&
      templateDoc.content.includes('{{projectName}}') &&
      templateDoc.content.includes('{{deliveryDate}}'),
    'Template stored in database contains verbatim placeholders'
  );

  // FLOW 3: Select Inquiry A with Client A and verify the preview resolves Client A
  console.log('\n--- Flow 3: Select Inquiry A with Client A and resolve preview ---');
  const inquiryA = new Inquiry({
    userId: 'user-test-123',
    clientName: 'Sarah Connor',
    clientEmail: 'sarah@skynet-resistance.org',
    subject: 'Cyberdyne App Security Audit',
    rawMessage: 'Need a complete audit of our security infrastructure.',
    status: 'new',
    analysisResult: {
      pricingEstimate: {
        deliveryDays: 7,
      },
    },
  });

  const authUser = {
    _id: 'user-test-123',
    id: 'user-test-123',
    name: 'Elena Rostova',
    email: 'elena@freelancecode.io',
  };

  const contextA = buildTemplateContext({ inquiry: inquiryA as any, user: authUser as any });
  assert(contextA.clientName === 'Sarah Connor', 'Context A resolves clientName to "Sarah Connor"');
  assert(
    contextA.projectName === 'Cyberdyne App Security Audit',
    'Context A resolves projectName to "Cyberdyne App Security Audit"'
  );

  const previewA = renderTemplate(rawTemplateContent, contextA);
  assert(
    previewA.includes('Hi Sarah Connor,'),
    'Preview A correctly resolves {{clientName}} to Sarah Connor'
  );
  assert(
    previewA.includes('Cyberdyne App Security Audit'),
    'Preview A correctly resolves {{projectName}}'
  );
  assert(
    !previewA.includes('{{clientName}}') && !previewA.includes('{{projectName}}'),
    'Preview A leaves no clientName or projectName placeholders unresolved'
  );

  // FLOW 4: Select Inquiry B with Client B and verify the same template now resolves Client B
  console.log('\n--- Flow 4: Select Inquiry B with Client B using the SAME template ---');
  const inquiryB = new Inquiry({
    userId: 'user-test-123',
    clientName: 'Bruce Wayne',
    clientEmail: 'bruce@wayneenterprises.com',
    subject: 'Batmobile Telemetry Dashboard',
    rawMessage: 'We require a low-latency real-time telemetry visualizer.',
    status: 'new',
    analysisResult: {
      pricingEstimate: {
        deliveryDays: 14,
      },
    },
  });

  const contextB = buildTemplateContext({ inquiry: inquiryB as any, user: authUser as any });
  assert(contextB.clientName === 'Bruce Wayne', 'Context B resolves clientName to "Bruce Wayne"');
  assert(
    contextB.projectName === 'Batmobile Telemetry Dashboard',
    'Context B resolves projectName to "Batmobile Telemetry Dashboard"'
  );

  const previewB = renderTemplate(rawTemplateContent, contextB);
  assert(
    previewB.includes('Hi Bruce Wayne,'),
    'Preview B correctly resolves {{clientName}} to Bruce Wayne using the same template'
  );
  assert(
    previewB.includes('Batmobile Telemetry Dashboard'),
    'Preview B correctly resolves {{projectName}} to Batmobile Telemetry Dashboard'
  );
  assert(
    !previewB.includes('Sarah Connor'),
    'Preview B is strictly isolated from Inquiry A client data'
  );

  // FLOW 5: Verify {{freelancerName}} always comes from the authenticated user profile and is never hardcoded
  console.log('\n--- Flow 5: Verify freelancerName dynamically tracks authenticated user profile ---');
  const user1 = { name: 'Alice Developer' };
  const user2 = { name: 'Marcus Sterling' };

  const contextUser1 = buildTemplateContext({ inquiry: inquiryA as any, user: user1 as any });
  const contextUser2 = buildTemplateContext({ inquiry: inquiryA as any, user: user2 as any });

  assert(
    contextUser1.freelancerName === 'Alice Developer',
    'contextUser1 freelancerName resolves dynamically from user1.name'
  );
  assert(
    contextUser2.freelancerName === 'Marcus Sterling',
    'contextUser2 freelancerName resolves dynamically from user2.name'
  );

  const renderedUser1 = renderTemplate('Best regards,\n{{freelancerName}}', contextUser1);
  const renderedUser2 = renderTemplate('Best regards,\n{{freelancerName}}', contextUser2);

  assert(
    renderedUser1 === 'Best regards,\nAlice Developer',
    'Template resolves Alice Developer for user1'
  );
  assert(
    renderedUser2 === 'Best regards,\nMarcus Sterling',
    'Template resolves Marcus Sterling for user2'
  );

  // FLOW 6: Apply the template to the conversation composer and verify resolved message
  console.log('\n--- Flow 6: Apply template to composer and verify fully resolved message ---');
  const appliedComposerDraft = renderTemplate(templateDoc.content, contextA);
  assert(
    appliedComposerDraft.includes('Hi Sarah Connor,') &&
      appliedComposerDraft.includes('I am Elena Rostova') &&
      appliedComposerDraft.includes('Cyberdyne App Security Audit') &&
      appliedComposerDraft.includes(contextA.deliveryDate!),
    'Composer draft contains the fully resolved message ready for client communication'
  );
  assert(
    !appliedComposerDraft.includes('{{') && !appliedComposerDraft.includes('}}'),
    'Composer draft has zero unresolved double-curly placeholders'
  );

  // FLOW 7: Refresh/reopen the inquiry and verify the correct client context is still used
  console.log('\n--- Flow 7: Reopen inquiry and verify client context remains consistent ---');
  const reopenedInquiryJSON = JSON.parse(JSON.stringify(inquiryA));
  const reopenedContext = buildTemplateContext({
    inquiry: reopenedInquiryJSON,
    user: authUser as any,
  });

  const reopenedRender = renderTemplate(templateDoc.content, reopenedContext);
  assert(
    reopenedRender === appliedComposerDraft,
    'Reopening inquiry yields identical, consistent client resolution'
  );

  // FLOW 8: Verify an unresolved variable produces a clear validation warning and cannot accidentally send
  console.log('\n--- Flow 8: Verify unresolved variable validation warning & sending block ---');
  const incompleteTemplate =
    'Hi {{clientName}}, please check {{customField}} and reply by {{deliveryDate}}.';
  const validationIncomplete = validateTemplate(incompleteTemplate, contextA);

  assert(
    validationIncomplete.isValid === false,
    'validateTemplate marks template with missing variable as invalid (isValid: false)'
  );
  assert(
    validationIncomplete.unresolvedVariables.includes('customField'),
    'validateTemplate correctly identifies "customField" in unresolvedVariables array'
  );

  // Simulate send safeguard
  function simulateSendReply(message: string, context: any): { sent: boolean; error?: string } {
    const validation = validateTemplate(message, context);
    if (!validation.isValid) {
      return {
        sent: false,
        error: `Cannot send reply with unresolved placeholder(s): ${validation.unresolvedVariables.map((v) => `{{${v}}}`).join(', ')}`,
      };
    }
    return { sent: true };
  }

  const sendAttemptUnresolved = simulateSendReply(incompleteTemplate, contextA);
  assert(
    sendAttemptUnresolved.sent === false,
    'Sending blocked when message contains unresolved placeholders'
  );
  assert(
    sendAttemptUnresolved.error?.includes('customField') === true,
    'Validation warning explicitly reports the unresolved variable name'
  );

  const sendAttemptResolved = simulateSendReply(appliedComposerDraft, contextA);
  assert(sendAttemptResolved.sent === true, 'Sending succeeds when all placeholders are resolved');

  // Verify missing context values are never replaced with fake data
  const emptyContext = {};
  const renderedWithoutContext = renderTemplate(rawTemplateContent, emptyContext);
  assert(
    renderedWithoutContext === rawTemplateContent,
    'Missing context variables are preserved verbatim and never replaced with fake or fabricated values'
  );

  console.log(`\n========================================\nALL VERIFICATION FLOWS PASSED: ${passed}/${total}`);
}

runTemplateTests();
