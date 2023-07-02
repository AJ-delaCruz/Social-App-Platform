import chai from 'chai';
import sinon from 'sinon';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import RedisMock from 'ioredis-mock';
import {
  registerUserService,
  loginService,
  updateUserService,
  getAllUsersService,
  getUserService,
} from '../../schema/services/userServices.mjs';
import { pgDb } from '../../utils/db.mjs';

const { expect } = chai;

// Create a mock Redis client for testing
const redisMockClient = new RedisMock();

describe('User Service Unit Tests', () => {
  let salt;
  let hashedPassword;

  // mock input to test
  const stubValue = {
    id: faker.string.uuid(),
    username: faker.internet.userName(),
    password: faker.internet.password(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
  };

  beforeEach(async () => {
    salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(stubValue.password, salt);
    stubValue.password = hashedPassword; // hash password
  });

  afterEach(() => {
    // Reset the mocks after each test
    sinon.restore();
  });

  // test creating a new User
  describe('registerUserService', () => {
    it('it should register a User successfully', async () => {
      // Mock the function
      const mockQuery = sinon.stub(pgDb, 'query').resolves({ rows: [stubValue] });
      sinon.stub(bcrypt, 'genSalt').returns(salt);
      sinon.stub(bcrypt, 'hash').returns(true); // mock bcrypt.hash to return true

      const expectedUser = await registerUserService({
        username: stubValue.username,
        password: stubValue.password,
      });

      // check if db is called once (check if username already exists & insert)
      expect(mockQuery.callCount).to.equal(2);

      // check if the mock data is equal to the expected User
      expect(expectedUser).to.have.property('id').that.is.a('string');
      expect(expectedUser.username).to.equal(stubValue.username);
    });

    it('should throw an error when unable to create a User', async () => {
      // Mock the cassandra.execute function error
      const expectedErrorUser = 'Failed to register user';
      sinon.stub(pgDb, 'query').rejects(new Error(expectedErrorUser));

      try {
        await registerUserService(
          stubValue.username,
          stubValue.password,
        );
      } catch (error) {
        expect(error.message).to.equal('Failed to register user');
      }
    });
  });

  // test logging in a User
  describe('loginService', () => {
    it('should return the User with token successfully', async () => {
      // Mock the postgres query
      sinon.stub(pgDb, 'query').resolves({ rows: [stubValue] }); // Return User
      sinon.stub(bcrypt, 'compare').returns(hashedPassword);
      sinon.stub(jwt, 'sign').returns('token123'); // mock token

      const expectedUser = await loginService({
        username: stubValue.username,
        password: stubValue.password,
      });

      // check if stubbed User is the expected User
      expect(expectedUser.username).to.equal(stubValue.username);
      expect(expectedUser.token).to.equal('token123');
    });

    it('should throw an error when unable login', async () => {
      const expectedErrorUser = 'Failed to login';
      sinon.stub(pgDb, 'query').rejects(new Error(expectedErrorUser));
      try {
        await loginService({
          username: stubValue.username,
          password: stubValue.password,
        });
      } catch (error) {
        expect(error.message).to.equal('Failed to login');
      }
    });
  });

  // test update user
  describe('updateUserService', () => {
    it('should update user successfully', async () => {
      const updateUser = {
        username: 'new_username',
        password: 'new_password',
        firstName: 'new_firstName',
        lastName: 'new_lastName',
      };

      // Mock the postgres query
      const mockQuery = sinon.stub(pgDb, 'query');

      mockQuery.onFirstCall().resolves({ rows: [{ exists: true }] }); // mock Username exists
      mockQuery.onSecondCall().resolves({ rows: [updateUser] }); // update user

      const expectedUser = await updateUserService(stubValue.id, updateUser);

      // check if stubbed updated User is the expected User
      expect(expectedUser.username).to.equal(updateUser.username);
      expect(expectedUser.firstName).to.equal(updateUser.firstName);
      expect(expectedUser.lastName).to.equal(updateUser.lastName);
    });

    it('should throw an error when unable to update user info', async () => {
      const expectedErrorUser = 'Failed to update user';
      sinon.stub(pgDb, 'query').rejects(new Error(expectedErrorUser));
      try {
        await updateUserService(stubValue.id, stubValue);
      } catch (error) {
        expect(error.message).to.equal('Failed to update user');
      }
    });
  });

  // test fetching user details
  describe('getUserService', () => {
    it('should retrieve user info successfully', async () => {
      const req = {
        user: {
          id: stubValue.id,
        },
        headers: {
          authorization: 'Bearer token123',
        },
      };

      // Mock the postgres query
      sinon.stub(pgDb, 'query').resolves({ rows: [stubValue] });
      const expectedUser = await getUserService(stubValue.id, req, redisMockClient);

      // check if stubbed User is the expected User
      expect(expectedUser).to.eql(stubValue);
    });

    it('should throw an error when unable to fetch user', async () => {
      const req = { headers: {} };
      const expectedErrorUser = 'Failed to get user';
      sinon.stub(pgDb, 'query').rejects(new Error(expectedErrorUser));
      try {
        await getUserService(stubValue.id, req, redisMockClient);
      } catch (error) {
        expect(error.message).to.equal(expectedErrorUser);
      }
    });
  });

  // Test getAllUsersService
  describe('getAllUsersService', () => {
    it('should retrieve all users successfully', async () => {
      const stubUsers = [stubValue, stubValue, stubValue];

      // Mock the postgres query
      sinon.stub(pgDb, 'query').resolves({ rows: stubUsers });

      const expectedUsers = await getAllUsersService();

      // check if stubbed Users are the expected Users
      expect(expectedUsers).to.eql(stubUsers);
    });

    it('should throw an error when unable to fetch all users', async () => {
      const expectedErrorUser = 'Failed to get all users';
      sinon.stub(pgDb, 'query').rejects(new Error(expectedErrorUser));
      try {
        await getAllUsersService();
      } catch (error) {
        expect(error.message).to.equal(expectedErrorUser);
      }
    });
  });
});
