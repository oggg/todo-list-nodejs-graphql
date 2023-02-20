const expect = require('chai').expect;
const jwt = require('jsonwebtoken');
const sinon = require('sinon');

const authMiddleware = require('../middleware/is-auth');
const nextFn = sinon.stub();
describe('Authentication middleware', function () {
    it('should set isAuth to false if no auth header is present', function () {
        const req = {
            get: function (headerName) {
                return null;
            },
            isAuth: 'test'
        };

        authMiddleware(req, {}, nextFn);
        expect(req.isAuth).to.equal(false);
        sinon.assert.calledOnce(nextFn);
    })

    it('should set isAuth to false if the auth header is only one string', function () {
        const req = {
            get: function (headerName) {
                return 'qqq';
            },
            isAuth: 'test'
        };

        authMiddleware(req, {}, nextFn);
        expect(req.isAuth).to.equal(false);
        sinon.assert.called(nextFn);
    })

    it('should yeld a userId after decoding the token', function () {
        const req = {
            get: function (headerName) {
                return 'Bearer aaa';
            }
        };

        sinon.stub(jwt, 'verify')
        jwt.verify.returns({ userId: 'zzz' });

        authMiddleware(req, {}, nextFn);
        expect(req).to.have.property('userId', 'zzz');
        sinon.assert.called(nextFn);
        jwt.verify.restore();
    })
})
