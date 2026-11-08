import test from 'node:test';
import assert from 'node:assert/strict';
import {hostAuthenticatedUser,isSameOrigin} from '../lib/identity.ts';

const forged=new Headers({'oai-authenticated-user-id':'someone-else'});
test('the managed host identity header is honored by default',()=>{
 assert.equal(hostAuthenticatedUser(forged,undefined),'someone-else');
 assert.equal(hostAuthenticatedUser(new Headers(),undefined),null);
});
test('self-hosted deploys ignore a forged identity header',()=>{
 assert.equal(hostAuthenticatedUser(forged,'1'),null);
});
test('origin check allows same-host and originless requests only',()=>{
 const url='https://laro.example/api/spin';
 assert.equal(isSameOrigin(null,url),true);
 assert.equal(isSameOrigin('https://laro.example',url),true);
 assert.equal(isSameOrigin('https://evil.example',url),false);
 assert.equal(isSameOrigin('null',url),false);
});
