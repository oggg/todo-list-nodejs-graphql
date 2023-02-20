const expect = require('chai').expect;

const authMiddleware = require('../middleware/is-auth');

it('should set isAuth to false if no auth header is present', function() {
    const req = {
        get: function(headerName) {
            return null;
        },
        isAuth: 'test'
    };

    authMiddleware(req, {}, () => {});
    expect(req.isAuth).to.equal(false);
})