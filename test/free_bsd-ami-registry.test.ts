import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import FreeBsdAmiRegistry = require('../lib/free_bsd-ami-registry-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new FreeBsdAmiRegistry.FreeBsdAmiRegistryStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});