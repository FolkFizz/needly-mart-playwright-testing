import { runtime } from '@config/env';
import { test, expect } from '@fixtures/test.base';
import { buildInvoiceId } from '@helpers/factories';

test.describe('CLAIMS :: UI Claims Lifecycle', () => {
  test.beforeEach(async ({ authPage }) => {
    await authPage.gotoLogin();
    await authPage.login(runtime.user.username, runtime.user.password);
    await authPage.assertLoggedInUiVisible();
  });

  test.describe('negative cases', () => {
    test(
      'CLAIMS-N01: non-image evidence upload is rejected by claim form validation @e2e @regression @safe',
      async ({ claimPage }) => {
        await claimPage.gotoClaim();
        await claimPage.fillInvoiceId(buildInvoiceId());
        await claimPage.fillDescription('This claim should fail because the file type is invalid.');
        await claimPage.uploadInvalidEvidenceFile();
        await claimPage.submit();
        await claimPage.assertErrorContains('Only image files are allowed');
      }
    );

    test(
      'CLAIMS-N02: submitting claim without description is blocked @e2e @regression @safe',
      async ({ claimPage }) => {
        await claimPage.gotoClaim();
        await claimPage.submitClaim(buildInvoiceId(), '');
        await claimPage.assertErrorContains('Invoice ID and description are required');
      }
    );
  });

  test.describe('stateful/destructive cases (serial)', () => {
    test.describe.configure({ mode: 'serial' });

    test(
      'CLAIMS-P01: user can submit a new claim with image evidence from profile claims tab @e2e @regression @destructive',
      async ({ profilePage, claimPage }) => {
        await profilePage.gotoProfile('claims');
        await profilePage.openFileNewClaim();

        await claimPage.fillInvoiceId(buildInvoiceId());
        await claimPage.fillDescription('Image evidence claim from e2e lifecycle flow.');
        await claimPage.uploadImageEvidence();
        await claimPage.submit();

        await profilePage.openClaimsTab();
        const claimId = await profilePage.readFirstClaimId();
        expect(claimId).not.toBeNull();
        await profilePage.assertClaimCardVisible(Number(claimId));
      }
    );

    test(
      'CLAIMS-E01: claim can be moved to trash and restored without data loss @e2e @regression @destructive',
      async ({ claimPage, profilePage }) => {
        await claimPage.gotoClaim();
        await claimPage.submitClaim(buildInvoiceId(), 'Edge claim for trash and restore lifecycle check.');

        await profilePage.openClaimsTab();
        const claimId = await profilePage.readFirstClaimId();
        expect(claimId).not.toBeNull();

        await profilePage.moveClaimToTrash(Number(claimId));
        await profilePage.openClaimTrashTab();
        await profilePage.assertClaimCardVisible(Number(claimId));

        await profilePage.restoreClaimFromTrash(Number(claimId));
        await profilePage.openClaimInboxTab();
        await profilePage.assertClaimCardVisible(Number(claimId));
      }
    );
  });
});
