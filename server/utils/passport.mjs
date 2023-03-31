import dotenv from 'dotenv';

import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { pgdb } from './db.mjs';

dotenv.config();

// Setup the JWT passport strategy
// Authentication to verify the JWT token
console.log(process.env.JWT_SECRET);
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // extract Bearer
  secretOrKey: process.env.JWT_SECRET,
};
// JwtStrategy to extract the JWT token from the authorization header
passport.use(new JwtStrategy(opts, (jwtPayload, callback) => {
  // console.log('JWT payload:', jwt_payload);

  // userId from the JWT payload
  const { userId } = jwtPayload;
  // console.log(jwtPayload);
  // console.log(jwtPayload.userId);

  // find userId in db
  pgdb.query('SELECT * FROM users WHERE id = $1', [userId])
    .then((result) => {
      const user = result.rows[0];
      // console.log(user);
      if (user) {
        callback(null, user); // return result
      } else {
        callback(null, false);
      }
    })
    .catch((err) => {
      callback(err, false);
    });
}));

// use instead of chackauth when you want to control authentication of each resolvers
const authenticateUser = (req) => new Promise((resolve, reject) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      reject(err);
    } else if (!user) {
      reject(new Error('User not found'));
    } else {
      resolve(user);
    }
  })(req);
});

const checkAuth = passport.authenticate('jwt', { session: false });
export { passport, checkAuth, authenticateUser };
