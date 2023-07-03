import chai from 'chai';
import sinon from 'sinon';
import { faker } from '@faker-js/faker';
import getNewsFeedService from '../../schema/services/newsFeedService.mjs';

const { expect } = chai;

describe('Friend Service Unit Tests', () => {
  // test newsfeed of user
  describe('getNewsFeedService', () => {
    it('should retrieve recent posts from friends and user successfully', async () => {
      // mock functions
      const getAllPostsServiceStub = sinon.stub();
      const getAllFriendsServiceStub = sinon.stub();

      const userId = '123';
      const friendIds = ['234', '345'];
      const userPosts = [
        {
          id: '1', userId: '123', body: 'Post 1', createdAt: new Date('2020-01-01'),
        },
        {
          id: '2', userId: '123', body: 'Post 2', createdAt: new Date('2021-02-02'),
        },
      ];
      const friend1Posts = [
        {
          id: '3', userId: '234', body: 'Post 3', createdAt: new Date('2021-03-03'),
        },
        {
          id: '4', userId: '234', body: 'Post 4', createdAt: new Date('2021-04-04'),
        },
      ];
      const friend2Posts = [
        {
          id: '5', userId: '345', body: 'Post 5', createdAt: faker.date.past(),
        },
        {
          id: '6', userId: '345', body: 'Post 6', createdAt: faker.date.past(),
        },
      ];

      getAllFriendsServiceStub.withArgs(userId).resolves(friendIds);
      getAllPostsServiceStub.withArgs(userId).resolves(userPosts);
      getAllPostsServiceStub.withArgs(friendIds[0]).resolves(friend1Posts);
      getAllPostsServiceStub.withArgs(friendIds[1]).resolves(friend2Posts);

      const getNewsFeed = getNewsFeedService(getAllPostsServiceStub, getAllFriendsServiceStub);
      const newsfeedPosts = await getNewsFeed(userId);
      //   console.log(newsfeedPosts);

      // concatenate all posts into one array and sort them by date for comparison
      const expectedPosts = [...userPosts, ...friend1Posts, ...friend2Posts];
      expectedPosts.sort((a, b) => b.createdAt - a.createdAt);
      //   console.log(expectedPosts);

      // check if the posts are expected
      expect(newsfeedPosts[0]).to.have.property('body').that.is.a('string');
      expect(expectedPosts[1]).to.have.property('createdAt').that.is.a('string');
      expect(newsfeedPosts).to.deep.equal(expectedPosts);
    });
  });
});
