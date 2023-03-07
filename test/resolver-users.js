const expect = require('chai').expect;
const sinon = require('sinon');
const resolver = require('../graphql/resolver-users');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const factory = require('../utils/factory');

describe('GraphQL resolver for user', function () {
    it('Should throw if email is not valid', async function () {
        const args = {
            userInput: {
                email: '',
                password: 'test'
            }
        };

        try {
            await resolver.createUser(args);
        } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.equal('Invalid input.');
        }
    });

    it('Should throw if password is less than 4 characters', async function () {
        const args = {
            userInput: {
                email: 'test@test.com',
                password: 'tes'
            }
        };

        try {
            await resolver.createUser(args);
        } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.equal('Invalid input.');
        }
    });

    it('Should throw if user already exists', async function () {
        const args = {
            userInput: {
                email: 'test@test.com',
                password: 'test'
            }
        };

        sinon.stub(User, 'findOne');
        User.findOne.returns('return value');

        try {
            await resolver.createUser(args);
        } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.equal('User exists already!');
        }

        User.findOne.restore();
    });

    it('Should save the new user to db and return it', async function () {
        const args = {
            userInput: {
                email: 'test@test.com',
                name: 'test',
                password: 'test'
            }
        };

        sinon.stub(User, 'findOne');
        User.findOne.returns(null);

        sinon.stub(bcrypt, 'hash');
        const hashedPassword = bcrypt.hash.returns('hashed password');

        const user = new User({
            email: args.userInput.email,
            name: args.userInput.name,
            password: hashedPassword
        });

        sinon.stub(factory, 'createUser');
        factory.createUser.returns(user);

        sinon.stub(user, 'save');
        user.save.returns(user);
        const result = await resolver.createUser(args);

        expect(result.email).to.be.equal(args.userInput.email);
        expect(result.name).to.be.equal(args.userInput.name);
        expect(result.assignedTasks.length).to.be.equal(0);
        expect(result.createdTasks.length).to.be.equal(0);

        sinon.assert.calledOnce(user.save);

        User.findOne.restore();
        bcrypt.hash.restore();
        factory.createUser.restore();
    });

    it('It should throw if the user does not exists on login', async function () {
        const args = {
            email: 'test@test.com',
            password: 'test'
        };

        sinon.stub(User, 'findOne');
        User.findOne.returns(null);

        try {
            await resolver.login(args);
        } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.equal('User not found.');
        }

        User.findOne.restore();
    });

    it('It should throw if the user exists on login, but the password does not match', async function () {
        const args = {
            email: 'test@test.com',
            password: 'test'
        };

        sinon.stub(User, 'findOne');
        User.findOne.returns('return value');

        sinon.stub(bcrypt, 'compare');
        bcrypt.compare.returns(false);

        try {
            await resolver.login(args);
        } catch (error) {
            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.equal('wrong input');
        }

        User.findOne.restore();
        bcrypt.compare.restore();
    });

    it('It should return token and userId if the user exists on login', async function () {
        const args = {
            email: 'test@test.com',
            password: 'test'
        };

        const user = new User();

        sinon.stub(User, 'findOne');
        User.findOne.returns(user);

        sinon.stub(bcrypt, 'compare');
        bcrypt.compare.returns(true);

        sinon.stub(jwt, 'sign');
        jwt.sign.returns('token');
        const result = await resolver.login(args);

        expect(result.token).to.be.equal('token');
        expect(result.userId).to.be.equal(user._id.toString());

        User.findOne.restore();
        bcrypt.compare.restore();
    });
});