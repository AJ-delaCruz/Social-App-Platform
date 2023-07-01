import chai from 'chai';
import sinon from 'sinon';
import { faker } from '@faker-js/faker';
import {
  getCommentService,
  getCommentsForPostService,
  createCommentService,
} from '../../schema/services/commentServices.mjs';
import { cassandra } from '../../utils/db.mjs';
import { producer } from '../../kafka-server/kafkaClient.mjs';

const { expect } = chai;

describe('Comment Service Unit Tests', () => {
  // mock input to test
  let stubValue;
  beforeEach(() => {
    // Stub generated data
    stubValue = {
      mockCommentId: faker.string.uuid(),
      mockPostId: faker.string.uuid(),
      mockUserId: faker.string.uuid(),
      mockBody: 'Hello, World!',
    };

    sinon.useFakeTimers(new Date('2023-06-30T09:24:59.788Z')); // mock the generated Date
  });

  afterEach(() => {
    // Reset the mocks after each test
    sinon.restore();
  });

  // test creating a new Comment
  describe('createCommentService', () => {
    it('it should create Comment successfully', async () => {
      // Mock the cassandra.execute function
      const mockExecute = sinon.stub(cassandra, 'execute').resolves(stubValue);
      sinon.stub(producer, 'send').resolves();
      const expectedComment = await createCommentService(
        stubValue.mockPostId,
        stubValue.mockUserId,
        stubValue.mockBody,
      );

      // check if cassandra execute is called once
      expect(mockExecute.callCount).to.equal(1);

      // check if the mock data is equal to the expected Comment
      expect(expectedComment).to.have.property('id').that.is.a('string'); // generated new uuid
      expect(expectedComment.postId).to.equal(stubValue.mockPostId);
      expect(expectedComment.userId).to.equal(stubValue.mockUserId);
      expect(expectedComment.body).to.equal(stubValue.mockBody);
      expect(expectedComment).to.have.property('createdAt').that.is.a('string'); // expectedComment generates new Date
      expect(expectedComment.createdAt).to.equal('2023-06-30T09:24:59.788Z'); // compare stubbed date
    });

    it('should throw an error when unable to create a Comment', async () => {
      // Mock the cassandra.execute function error
      const expectedErrorComment = 'Failed to make comment';
      sinon.stub(cassandra, 'execute').rejects(new Error(expectedErrorComment));

      try {
        await createCommentService(
          stubValue.mockPostId,
          stubValue.mockUserId,
          stubValue.mockBody,
        );
      } catch (error) {
        expect(error.message).to.equal(expectedErrorComment);
      }
    });
  });

  // test retrieving a Comment using ID
  describe('getCommentService', () => {
    it('should return the Comment using its ID successfully', async () => {
      // Mock the cassandra.execute function
      const mockExecute = sinon.stub(cassandra, 'execute').resolves({ rows: [stubValue] }); // Return Comment

      const expectedComment = await getCommentService(stubValue.mockCommentId);
      // console.log(expectedComment);

      // check if cassandra execute is called once
      expect(mockExecute.callCount).to.equal(1);
      // check if stubbed Comment is the expected Comment
      expect(expectedComment).to.deep.equal(stubValue); // compare object values & address
    });

    it('should throw an error when unable to get the Comment by ID', async () => {
      // Mock the cassandra.execute function
      const expectedErrorComment = 'Failed to get comment';
      sinon.stub(cassandra, 'execute').rejects(new Error(expectedErrorComment));

      try {
        await getCommentService(stubValue.mockCommentId);
      } catch (error) {
        expect(error.message).to.equal(expectedErrorComment);
      }
    });
  });

  // test retrieving comments for post
  describe('getCommentsForPostService ', () => {
    it('should return the comments for post successfully', async () => {
      const mockComments = [stubValue, stubValue, stubValue];
      //   console.log(mockComments);

      // Mock the cassandra.execute function
      const mockExecute = sinon.stub(cassandra, 'execute').resolves({ rows: mockComments }); // Return Comment

      const expectedComments = await getCommentsForPostService(stubValue.mockPostId);
      //   console.log(expectedComments);

      // check if cassandra execute is called once
      expect(mockExecute.callCount).to.equal(1);
      // check if stubbed Comment is the expected Comment
      expect(expectedComments).to.equal(mockComments); // compare object values & address
    });

    it('should throw an error when unable to get the comment for posts', async () => {
      // Mock the cassandra.execute function
      const expectedErrorComment = 'Failed to get comments for post';
      sinon.stub(cassandra, 'execute').rejects(new Error(expectedErrorComment));

      try {
        await getCommentsForPostService(stubValue.mockPostId);
      } catch (error) {
        expect(error.message).to.equal(expectedErrorComment);
      }
    });
  });
});
