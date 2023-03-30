export const resolvers = {
    Query: {
        hello: () => 'Hello world!',
        //retrieve user
        async getUser(_, {args}, {pgdb}) {
            try {
                const {userId} = args;
                const user = await pgdb.query('SELECT * FROM users WHERE id = $1', [userId]);

                if (!user) {
                    throw new Error(`User id: ${userId} not found`);
                }

                return user.rows[0]; //return first row of the user result
            } catch (err) {
                console.error(err);
                throw new Error('Failed to get user');
            }
        },
        //retrieve all users
        async getAllUsers(_, __, {pgdb}) {
            try {
                const users = await pgdb.query('SELECT * FROM users');

                return users.rows;
            } catch (err) {
                console.error(err);
                throw new Error('Failed to get all users');
            }
        },
    },


    Mutation: {

        async registerUser(_, {input}, {pgdb}) {
            console.log(input)
            try {
                const {username, password} = input;

                // SELECT EXISTS  more efficient than SELECT *
                const userExists = await pgdb.query('SELECT EXISTS (SELECT 1 FROM users WHERE username = $1)', [username]);
                if (userExists.rows[0].exists) {
                    throw new Error(`Username ${username} already exists`);
                }

                const user = await pgdb.query('INSERT INTO users (username, password) VALUES ($1, $2) ' +
                    'RETURNING id, username', [username, password]);

                console.log(user.rows[0]);
                return user.rows[0];
            } catch (err) {
                console.error(err);
                throw new Error('Failed to register user');
            }
        },

        async login(_, {input}, {pgdb}) {
            const {username, password} = input;
            try {
                const user = await pgdb.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
                if (!user.rows.length) {
                    throw new Error('Invalid username or password');
                }
                console.log(user.rows[0]);
                return user.rows[0];
            } catch (err) {
                console.error(err);
                throw new Error('Failed to login');
            }
        },

        async updateUser(_, {id, input}, {pgdb}) {
            console.log(input);
            try {
                const {username, password, firstName, lastName} = input;

                //check if user exists
                const userExists = await pgdb.query('SELECT EXISTS (SELECT 1 FROM users WHERE id = $1)', [id]);
                if (!userExists.rows[0].exists) {
                    throw new Error(`User id: ${id} not found`);
                }

                const user = await pgdb.query('UPDATE users SET username = $1, password = $2, firstName = $3, lastName = $4 ' +
                    'WHERE id = $5 RETURNING  username, firstName, lastName', [username, password, firstName, lastName, id]);

                // if (!user.rows.length) {
                //     throw new Error(`User id: ${id} not found`);
                // }

                console.log(user.rows[0]);
                return user.rows[0];
            } catch (err) {
                console.error(err);
                throw new Error('Failed to update user');
            }
        }

    },

};