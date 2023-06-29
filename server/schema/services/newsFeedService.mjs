import { getAllPostsService } from './postServices.mjs';
import { getAllFriendsService } from './friendServices.mjs';

const getNewsFeedService = async (userId) => {
  // retrieve user friends
  const friends = await getAllFriendsService(userId);

  // todo
  //   const followers = await getAllFollowersService(userId);

  // create the newsfeed for user
  const newsFeed = await Promise.all(friends.map(async (friend) => {
    // getPosts is called for each friends in parallel using Promise.all
    const posts = await getAllPostsService(friend);
    return posts;
  }));

  //   //sequential
  //   const newsFeed = [];

  //   for (let friend of friends) {
  //     const posts = await getPosts(friend);
  //     newsFeed.push(...posts);
  //   }

  // Flatten the array of arrays and sort by timestamp
  const newsfeedPosts = [].concat(...newsFeed);
  newsfeedPosts.sort((a, b) => b.timestamp - a.timestamp);

  return newsfeedPosts;
};

export default getNewsFeedService;
