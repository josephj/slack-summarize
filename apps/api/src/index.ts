import { HttpFunction } from '@google-cloud/functions-framework';
import cors from 'cors';
import express from 'express';

const app = express();
app.use(cors());
app.use(express.json());

export const slack: HttpFunction = async (req, res) => {
  // Conversation Replies API
  // https://api.slack.com/methods/conversations.replies

  // Auth Test API
  // https://api.slack.com/methods/auth.test

  // Auth Refresh API
  // https://api.slack.com/methods/auth.refresh

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    res.status(200).json({ message: 'Hello World!' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
