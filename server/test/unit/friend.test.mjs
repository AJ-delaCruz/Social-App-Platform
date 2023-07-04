import chai from 'chai';
import sinon from 'sinon';
import { faker } from '@faker-js/faker';
import RedisMock from 'ioredis-mock';
import {
  getAllFriendsService,
  sendFriendRequestService,
  removeFriendService,
} from '../../schema/services/friendServices.mjs';
import { pgDb } from '../../utils/db.mjs';

// Create a mock Redis client for testing
const redisMockClient = new RedisMock();

const { expect } = chai;

describe('Friend Service Unit Tests', () => {
  // mock input to test
  const stubValue = {
    mockUserId: faker.string.uuid(),
    mockFriendId: faker.string.uuid(),
  };

  beforeEach(() => {
    // mock date
    sinon.useFakeTimers(new Date('2023-06-30T09:24:59.788Z')); // mock the generated Date
  });

  afterEach(() => {
    // Reset the mocks after each test
    sinon.restore();
  });

  // test fetching friend Ids
  describe('getAllFriendsService', () => {
    it('should retrieve friends list of the user successfully', async () => {
      const friendIds = [faker.string.uuid(), faker.string.uuid(), faker.string.uuid()];

      // Mock the postgres query
      const mockQuery = sinon.stub(pgDb, 'query').resolves({ rows: friendIds.map((friendId) => ({ friend_id: friendId })) });
      const expectedFriendIds = await getAllFriendsService(stubValue.mockUserId, redisMockClient);
      //   console.log(expectedFriendIds);

      // check if postgres query is called once
      expect(mockQuery.callCount).to.equal(1);
      // check if stubbed Friend ids are the expected Friend ids
      expect(expectedFriendIds).to.eql(friendIds);
    });

    it('should throw an error when unable to retrieve friends list', async () => {
      // Mock the pgdb function error
      const expectedError = 'Failed to retrieve friends IDs';
      sinon.stub(pgDb, 'query').rejects(new Error(expectedError));

      try {
        await getAllFriendsService(stubValue.mockUserId, redisMockClient);
      } catch (error) {
        expect(error.message).to.equal(expectedError);
      }
    });
  });

  // test adding friend
  describe('sendFriendRequestService', () => {
    it('should send friend request successfully', async () => {
      // Mock the postgres query
      sinon.stub(pgDb, 'query').resolves(stubValue);

      const friendRequest = await sendFriendRequestService(
        stubValue.mockUserId,
        stubValue.mockFriendId,
        redisMockClient,
      );
      //   console.log('friendRequest');
      //   console.log(friendRequest);

      // check if the mock data is equal to the expected friendRequest
      expect(friendRequest).to.have.property('id').that.is.a('string');
      expect(friendRequest.userId).to.equal(stubValue.mockUserId);
      expect(friendRequest.friendId).to.equal(stubValue.mockFriendId);
      expect(friendRequest).to.have.property('createdAt').that.is.a('string');
      expect(friendRequest.createdAt).to.equal('2023-06-30T09:24:59.788Z'); // compare stubbed date
    });

    it('should throw an error when unable to send friend request', async () => {
    // Mock the pgdb function error
      const expectedError = 'Failed to add friend';
      sinon.stub(pgDb, 'query').rejects(new Error(expectedError));

      try {
        await sendFriendRequestService(
          stubValue.mockUserId,
          stubValue.mockFriendId,
          redisMockClient,
        );
      } catch (error) {
        expect(error.message).to.equal(expectedError);
      }
    });
  });

  // test removing friend
  describe('removeFriendService', () => {
    it('should remove friend successfully', async () => {
      // Mock the postgres query
      sinon.stub(pgDb, 'query').resolves(true);

      const result = await removeFriendService(
        stubValue.mockUserId,
        stubValue.mockFriendId,
        redisMockClient,
      );

      // eslint-disable-next-line no-unused-expressions
      expect(result).to.be.true;
    });

    it('should throw an error when unable to remove friend', async () => {
      // Mock the pgdb function error
      const expectedError = 'Failed to remove friend';
      sinon.stub(pgDb, 'query').rejects(new Error(expectedError));

      try {
        await removeFriendService(stubValue.mockUserId, stubValue.mockFriendId, redisMockClient);
      } catch (error) {
        expect(error.message).to.equal(expectedError);
      }
    });
  });
});
