import { ExecutionDetailsRepository, IntegrationRepository, MessageRepository } from '@novu/dal';
import { ChannelTypeEnum, ExecutionDetailsSourceEnum, ExecutionDetailsStatusEnum } from '@novu/shared';
import { IEmailEventBody } from '@novu/stateless';
import { expect } from 'chai';
import axios from 'axios';

const axiosInstance = axios.create();

const callSendgridWebhook = async (environmentId, organizationId, webhookBody) => {
  const serverUrl = `http://172.17.0.2:${process.env.PORT}`;

  const { data } = await axiosInstance.post(
    `${serverUrl}/webhooks/organizations/${organizationId}/environments/${environmentId}/email/sendgrid`,
    webhookBody
  );

  return data;
};

describe('Email webhook - /organizations/:organizationId/environments/:environmentId/email/:providerId (POST)', function () {
  const messageRepository = new MessageRepository();
  const integrationRepository = new IntegrationRepository();

  it('should handle webhook', async function () {
    const envId = MessageRepository.createObjectId();
    const orgId = MessageRepository.createObjectId();
    const id = MessageRepository.createObjectId();

    const message = await messageRepository.create({
      _id: id,
      _notificationId: MessageRepository.createObjectId(),
      _environmentId: envId,
      _organizationId: orgId,
      _subscriberId: MessageRepository.createObjectId(),
      _templateId: MessageRepository.createObjectId(),
      _messageTemplateId: MessageRepository.createObjectId(),
      channel: ChannelTypeEnum.EMAIL,
      _feedId: MessageRepository.createObjectId(),
      transactionId: MessageRepository.createObjectId(),
      content: '',
      payload: {},
      templateIdentifier: '',
      identifier: id,
    });

    await integrationRepository.create({
      _environmentId: envId,
      _organizationId: orgId,
      providerId: 'sendgrid',
      channel: ChannelTypeEnum.EMAIL,
      credentials: {
        apiKey: 'SG.123',
      },
      active: true,
    });

    const webhookBody = {
      email: 'example@test.com',
      timestamp: 1513299569,
      'smtp-id': '<14c5d75ce93.dfd.64b469@ismtpd-555>',
      event: 'delivered',
      ip: '168.1.1.1',
      category: 'cat facts',
      sg_event_id: 'sg_event_id',
      sg_message_id: 'sg_message_id',
      response: '400 try again later',
      attempt: '5',
      id: message._id,
    };

    const body = await callSendgridWebhook(envId, orgId, webhookBody);

    const event: IEmailEventBody = body[0].event;
    expect(body[0].id).to.equal(webhookBody.id);
    expect(event.externalId).to.equal(webhookBody.id);
    expect(event.attempts).to.equal(5);
    expect(event.response).to.equal('400 try again later');
    expect(event.row).to.eql(webhookBody);
  });

  it('should create execution details after processing the response of a webhook', async function () {
    const environmentId = MessageRepository.createObjectId();
    const id = MessageRepository.createObjectId();
    const messageTemplateId = MessageRepository.createObjectId();
    const notificationId = MessageRepository.createObjectId();
    const organizationId = MessageRepository.createObjectId();
    const providerId = 'sendgrid';
    const subscriberId = MessageRepository.createObjectId();
    const templateId = MessageRepository.createObjectId();
    const transactionId = MessageRepository.createObjectId();

    const message = await messageRepository.create({
      _id: id,
      _notificationId: notificationId,
      _environmentId: environmentId,
      _organizationId: organizationId,
      _subscriberId: subscriberId,
      _templateId: templateId,
      _messageTemplateId: messageTemplateId,
      channel: ChannelTypeEnum.EMAIL,
      _feedId: MessageRepository.createObjectId(),
      transactionId,
      content: '',
      payload: {},
      templateIdentifier: '',
      identifier: id,
    });

    await integrationRepository.create({
      _environmentId: environmentId,
      _organizationId: organizationId,
      providerId,
      channel: ChannelTypeEnum.EMAIL,
      credentials: {
        apiKey: '',
      },
      active: true,
    });

    const webhookBody = {
      email: 'example@test.com',
      timestamp: 1513299569,
      'smtp-id': '<14c5d75ce93.dfd.64b469@ismtpd-555>',
      event: 'delivered',
      ip: '168.1.1.1',
      category: 'cat facts',
      sg_event_id: 'sg_event_id',
      sg_message_id: 'sg_message_id',
      response: '400 try again later',
      attempt: '5',
      id: message._id,
    };

    const body = await callSendgridWebhook(environmentId, organizationId, webhookBody);

    const executionDetailsRepository = new ExecutionDetailsRepository();
    const [executionDetails] = await executionDetailsRepository.find({
      _environmentId: environmentId,
      _organizationId: organizationId,
      _notificationId: notificationId,
      providerId,
    });

    const expectedObject = {
      _environmentId: environmentId,
      _organizationId: organizationId,
      _notificationId: notificationId,
      _notificationTemplateId: templateId,
      _subscriberId: subscriberId,
      providerId,
      transactionId,
      detail: '400 try again later - (delivered)',
      source: ExecutionDetailsSourceEnum.WEBHOOK,
      status: ExecutionDetailsStatusEnum.SUCCESS,
      isTest: false,
      isRetry: false,
    };

    expect(executionDetails).to.exist;
    expect(executionDetails).to.have.property('_id');
    expect(executionDetails).to.have.property('createdAt');
    expect(executionDetails).to.have.property('updatedAt');
    expect(executionDetails).to.contain(expectedObject);
  });
});
