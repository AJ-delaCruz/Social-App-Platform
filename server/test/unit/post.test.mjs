import chai from 'chai';
import sinon from 'sinon';
import { faker } from '@faker-js/faker';
import { createPostService, getPostService, getAllPostsService } from '../../schema/services/postServices.mjs';
import { cassandra } from '../../utils/db.mjs';
// import { v4 as uuidv4 } from 'uuid'; //not working for ES modules

const { expect } = chai;

describe('Post Service Unit Tests', () => {
  // mock input to test
  const stubValue = {
    postId: faker.string.uuid(),
    mockUserId: faker.string.uuid(),
    mockBody: 'Hello, World!',
  };
  beforeEach(() => {
    // Stub generated data
    // sinon.stub(uuidv4, 'v4').returns(stubValue.id); //problem: with ES Modules cannot be stubbed
    sinon.useFakeTimers(new Date('2023-06-30T09:24:59.788Z')); // mock the generated Date
  });

  afterEach(() => {
    // Reset the mocks after each test
    sinon.restore();
  });

  // test creating a new post
  describe('createPostService', () => {
    it('it should create Post successfully', async () => {
      // Mock the cassandra.execute function
      const mockExecute = sinon.stub(cassandra, 'execute').resolves(stubValue);

      const expectedPost = await createPostService(
        stubValue.mockUserId,
        stubValue.mockBody,
      );

      // check if cassandra execute is called once
      expect(mockExecute.callCount).to.equal(1);

      // check if the mock data is equal to the expected Post
      expect(expectedPost).to.have.property('id').that.is.a('string'); // expectedPost generates new uuid
      expect(expectedPost.userId).to.equal(stubValue.mockUserId);
      expect(expectedPost.body).to.equal(stubValue.mockBody);
      expect(expectedPost).to.have.property('createdAt').that.is.a('string'); // expectedPost generates new Date
      expect(expectedPost.createdAt).to.equal('2023-06-30T09:24:59.788Z'); // compare stubbed date
    });

    it('should throw an error when unable to create a post', async () => {
      // Mock the cassandra.execute function error
      const expectedErrorPost = 'Failed to create post';
      sinon.stub(cassandra, 'execute').rejects(new Error(expectedErrorPost));

      try {
        await createPostService(
          stubValue.mockUserId,
          stubValue.mockBody,
        );
      } catch (error) {
        expect(error.message).to.equal('Failed to create post');
      }
    });
  });

  // test retrieving a post
  describe('getPostService', () => {
    it('should return the post using its ID successfully', async () => {
      // Mock the cassandra.execute function
      sinon.stub(cassandra, 'execute').resolves({ rows: [stubValue] }); // Return post

      const expectedPost = await getPostService(stubValue.postId);
      // console.log(expectedPost);

      // check if stubbed Post is the expected Post
      expect(expectedPost).to.deep.equal(stubValue); // compare object values & address
    });

    it('should throw an error when unable to get the Post by ID', async () => {
      // Mock the cassandra.execute function
      sinon.stub(cassandra, 'execute').rejects(new Error('Error getting post')); // Throw an error

      try {
        await getPostService(stubValue.postId);
      } catch (error) {
        expect(error.message).to.equal('Error getting post');
      }
    });
  });

  // test retrieving all posts of a user
  describe('getAllPostsService', () => {
    it('should return all Posts successfully', async () => {
      // Mock the cassandra.execute function
      sinon.stub(cassandra, 'execute').resolves({ rows: [stubValue] }); // Return object with array of Posts

      const expectedPost = await getAllPostsService(stubValue.mockUserId);
      // console.log(expectedPost);

      // check if stubbed Posts are the expected Posts
      expect(expectedPost).to.deep.equal([stubValue]); // compare object values & address
    });

    it('should throw an error when unable to get Posts', async () => {
      // Mock the cassandra.execute function
      sinon.stub(cassandra, 'execute').rejects(new Error('Error getting all posts')); // Throw an error

      try {
        await getAllPostsService(stubValue.mockUserId);
      } catch (error) {
        expect(error.message).to.equal('Error getting all posts');
      }
    });
  });
});
