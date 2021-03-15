import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as LambdaTestStack from '../lib/stack-containers/lambda-stack/lambda';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new LambdaTestStack.LambdaStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
