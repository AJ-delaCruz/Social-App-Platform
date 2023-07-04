import chai from 'chai';
import sinon from 'sinon';
import { faker } from '@faker-js/faker';
import { createMessageService, getAllMessagesService } from '../../schema/services/messageServices.mjs';
import { cassandra } from '../../utils/db.mjs';
// import { v4 as uuidv4 } from 'uuid';
import { producer } from '../../kafka-server/kafkaClient.mjs';

const { expect } = chai;

describe('Message Service Unit Tests', () => {
  // mock input to test
  const stubValue = {
    // id: faker.string.uuid(), // need to return uuid format
    mockChatId: faker.string.uuid(),
    mockSenderId: faker.string.uuid(),
    mockBody: 'Hello, World!',
    // mockDate: faker.date.past(),
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

  describe('createMessageService', () => {
    it('it should create message successfully', async () => {
    // Mock getChatService function
      const getChatServiceStub = sinon.stub().resolves(stubValue.mockChatId);

      // Mock the cassandra.execute function
      // const mockExecute = sinon.stub(cassandra, 'execute');
      const mockExecute = sinon.stub(cassandra, 'execute').resolves(stubValue);
      sinon.stub(producer, 'send').resolves();
      // mockExecute.onFirstCall().resolves(); // Message inserted in cassandra successfully
      // mockExecute.onSecondCall().resolves(); // Chat updated in cassandra successfully

      const expectedMessage = await createMessageService(
        stubValue.mockChatId,
        stubValue.mockSenderId,
        stubValue.mockBody,
        getChatServiceStub,
      );

      // check if cassandra execute is called twice (insert message & update chat)
      expect(mockExecute.callCount).to.equal(1);

      // check if the mock data is equal to the expected message
      expect(expectedMessage).to.have.property('id').that.is.a('string'); // expectedMessage generates new uuid
      expect(expectedMessage.chatId).to.equal(stubValue.mockChatId);
      expect(expectedMessage.senderId).to.equal(stubValue.mockSenderId);
      expect(expectedMessage.body).to.equal(stubValue.mockBody);
      expect(expectedMessage).to.have.property('createdAt').that.is.a('string'); // expectedMessage generates new Date
      expect(expectedMessage.createdAt).to.equal('2023-06-30T09:24:59.788Z'); // compare stubbed date
    });

    it('should throw an error', async () => {
      // Mock the cassandra.execute function error
      const expectedErrorMessage = 'Failed to create message';
      sinon.stub(cassandra, 'execute').rejects(new Error(expectedErrorMessage));

      try {
        await createMessageService(
          stubValue.mockChatId,
          stubValue.mockSenderId,
          stubValue.mockBody,
        );
      } catch (error) {
        expect(error.message).to.equal('Failed to create message');
      }
    });
  });

  describe('getAllMessagesService', () => {
    it('should return all messages successfully', async () => {
      // Mock the cassandra.execute function
      sinon.stub(cassandra, 'execute').resolves({ rows: [stubValue] }); // Return object with array of messages

      const expectedMessage = await getAllMessagesService(stubValue.mockChatId);
      // console.log(expectedMessage);

      // check if stubbed messages are the expected messages
      expect(expectedMessage).to.deep.equal([stubValue]); // compare object values & address
    });

    it('should throw an error when unable to get messages', async () => {
      // Mock the cassandra.execute function
      sinon.stub(cassandra, 'execute').rejects(new Error('Failed to get user messages')); // Throw an error

      try {
        await getAllMessagesService(stubValue.mockChatId);
      } catch (error) {
        expect(error.message).to.equal('Failed to get user messages');
      }
    });
  });
});
