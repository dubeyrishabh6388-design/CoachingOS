import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';

export const messagesRouter = Router();

// GET /api/v1/messages
messagesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req.query.organizationId as string) || 'org-kota-001';
    const messages = await db.getMessages(organizationId);
    res.json({
      data: messages,
      meta: { count: messages.length },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error fetching messages' },
    });
  }
});

// POST /api/v1/messages
messagesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      organizationId = 'org-kota-001',
      recipientType = 'BATCH_PARENTS',
      recipientTarget,
      target,
      channel = 'WHATSAPP',
      title,
      content,
      message: messageText,
      status = 'DELIVERED',
      sentBy,
      senderName,
      deliveredCount,
      recipientCount = 1,
    } = req.body;

    const actualContent = content || messageText;
    const actualTarget = recipientTarget || target || 'All Enrolled Parents';
    const actualSender = sentBy || senderName || 'Institute Director';
    const actualDelivered = deliveredCount || recipientCount;

    if (!title || !actualContent) {
      res.status(400).json({
        data: null,
        error: { message: 'title and content (or message) are required' },
      });
      return;
    }

    const message = await db.createMessage({
      organizationId,
      recipientType,
      recipientTarget: actualTarget,
      channel,
      title,
      content: actualContent,
      status,
      sentBy: actualSender,
      deliveredCount: actualDelivered,
    });

    res.status(201).json({
      data: message,
      meta: { message: 'Message dispatched successfully' },
      error: null,
    });
  } catch (err: any) {
    res.status(500).json({
      data: null,
      error: { message: err.message || 'Error sending message' },
    });
  }
});
