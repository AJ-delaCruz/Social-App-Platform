#Linux-based image
#FROM --platform=linux/amd64 node:16
FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application files to the container
COPY . .

# Expose the port that the application will run on
EXPOSE 4000

# Start the application
CMD [ "node", "index.js" ]
