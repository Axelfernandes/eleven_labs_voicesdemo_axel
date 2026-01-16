import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Metric: a
    .model({
      text: a.string().required(),
      emotion: a.string().required(),
      voiceId: a.string().required(),
      timestamp: a.datetime().required(),
    })
    .authorization((allow) => [allow.guest(), allow.publicApiKey()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'iam',
  },
});
