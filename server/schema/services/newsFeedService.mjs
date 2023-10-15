import { redis, cassandra } from '../../utils/db.mjs';
// import { getAllFriendsService } from './friendServices.mjs';

const addPostToNewsfeedService = async (recipientUserId, post) => {
  const postId = post.id;
  const body = post.message;
  const createdAt = new Date().toISOString();

  // add post to newsfeed
  try {
    await cassandra.execute(
      'INSERT INTO newsfeed (user_id, post_id, body, created_at) VALUES (?, ?, ?, ?)',
      [recipientUserId, postId, body, createdAt],
      { prepare: true },
    );
    return {
      recipientUserId,
      postId,
      body,
      createdAt,
    };
  } catch (err) {
    console.error(err);
    throw new Error('Failed to add post to user newsfeed');
  }
};

// fan-out on write design pattern
// distribute post to all users (friends/followers) after post is created
const addPostToNewsfeedForAllUsers = async (userId, post, getAllFriendsService) => {
  // retrieve friend IDs
  const friendIds = await getAllFriendsService(userId, redis);

  // concurrently add posts using Promise.all
  await Promise.all(
    friendIds.map(async (friendId) => {
      await addPostToNewsfeedService(friendId, post);
    }),
  );
};

const fetchNewsFeedService = async (userId, limit = 10) => {
  try {
    const query = 'SELECT * FROM newsfeed WHERE user_id = ? LIMIT ?';
    const params = [userId, limit];

    const result = await cassandra.execute(query, params, { prepare: true });
    return result.rows;
  } catch (err) {
    // console.error('Error fetching from newsfeed:', err);
    throw new Error('Failed to retrieve newsfeed');
  }
};

// fan-out on read pattern
// partial function application
const getNewsFeedService = (getAllPostsService, getAllFriendsService) => async (userId) => {
  // retrieve user friends Ids
  const friendIds = await getAllFriendsService(userId);

  // include userId to  also retrieve their posts
  const userIds = [userId, ...friendIds];

  // create the newsfeed for user along with their own posts
  const newsFeed = await Promise.all(userIds.map(async (user) => {
    // getPosts is called for each friends in parallel using Promise.all
    const posts = await getAllPostsService(user);
    return posts;
  }));
  //   console.log(newsFeed);

  //   //sequential
  //   const newsFeed = [];

  //   for (let friend of friends) {
  //     const posts = await getPosts(friend);
  //     newsFeed.push(...posts);
  //   }

  // concatenating all the arrays within into a single array
  const newsfeedPosts = [].concat(...newsFeed);
  // sort the newsfeed posts by created at
  newsfeedPosts.sort((a, b) => b.createdAt - a.createdAt);

  return newsfeedPosts;
};

export {
  addPostToNewsfeedService,
  addPostToNewsfeedForAllUsers,
  fetchNewsFeedService,
  getNewsFeedService,
};
