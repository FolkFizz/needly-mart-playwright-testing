import { test, expect } from '@fixtures/test.base';
import { runtime } from '@config/env';
import { buildInvoiceId } from '@helpers/factories';

test.describe('CLAIMS :: UI Claim Submission And Upload', () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.gotoLogin();
    await authPage.login(runtime.user.username, runtime.user.password);
    await authPage.assertLoggedInUiVisible();
  });

  test.describe('positive cases', () => {
    test(
      'CLAIMS-P01: user can submit claim with valid image evidence @e2e @regression @destructive',
      async ({ claimPage, profilePage }) => {
        await claimPage.gotoClaim();
        await claimPage.fillInvoiceId(buildInvoiceId());
        await claimPage.fillDescription('Product failed during normal use.');
        await claimPage.uploadImageEvidence();
        await claimPage.submit();

        await profilePage.openClaimsTab();
        const claimId = await profilePage.readFirstClaimId();
        expect(claimId).not.toBeNull();
        await profilePage.assertClaimCardVisible(Number(claimId));
      }
    );

    test(
      'CLAIMS-P02: user can submit claim without image evidence @e2e @regression @destructive',
      async ({ claimPage, profilePage }) => {
        await claimPage.gotoClaim();
        await claimPage.submitClaim(buildInvoiceId(), 'Claim without image attachment');

        await profilePage.openClaimsTab();
        const claimId = await profilePage.readFirstClaimId();
        expect(claimId).not.toBeNull();
        await profilePage.assertClaimCardVisible(Number(claimId));
      }
    );
  });

  test.describe('negative cases', () => {
    test(
      'CLAIMS-N01: upload with non-image file type is rejected @e2e @regression @safe',
      async ({ claimPage }) => {
        await claimPage.gotoClaim();
        await claimPage.fillInvoiceId(buildInvoiceId());
        await claimPage.fillDescription('This should fail because file type is invalid.');
        await claimPage.uploadInvalidEvidenceFile();
        await claimPage.submit();
        await claimPage.assertErrorContains('Only image files are allowed');
      }
    );

    test(
      'CLAIMS-N02: claim submit without description is rejected @e2e @regression @safe',
      async ({ claimPage }) => {
        await claimPage.gotoClaim();
        await claimPage.submitClaim(buildInvoiceId(), '');
        await claimPage.assertErrorContains('Invoice ID and description are required');
      }
    );
  });

  test.describe('edge cases', () => {
    test(
      'CLAIMS-E01: claim accepts invoice id with special characters without crashing @e2e @regression @destructive',
      async ({ claimPage, profilePage }) => {
        await claimPage.gotoClaim();
        await claimPage.submitClaim(`ORD-EDGE-${Date.now()}-#%25`, 'Edge invoice format check.');

        await profilePage.openClaimsTab();
        const claimId = await profilePage.readFirstClaimId();
        expect(claimId).not.toBeNull();
        await profilePage.assertClaimCardVisible(Number(claimId));
      }
    );
  });
});
