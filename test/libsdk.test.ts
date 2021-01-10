import { expect } from 'chai';

import { TeleroboticSDK } from '../dist/index'

describe('libsdk test', () => {
    it('test function should return -1', () => {
        const result = TeleroboticSDK.test()
        expect(result).to.equal(-1)
    });
});