/**
 * Reviews API routes
 * Handles approval/rejection of skill imports
 */

import http from 'node:http';
import { createAttestation } from '../../signing.js';
import { type PublishedAttestation } from '../../publisher.js';

// Import the pendingImports map from ingest module
// In production, this would be a shared database
import { pendingImports } from './ingest.js';

export interface ReviewRequest {
  reviewer: string;
  note?: string;
  reason?: string;
}

export interface ReviewResponse {
  status: 'approved' | 'rejected';
  ingestId: string;
  skillId: string;
  reviewer: string;
  reviewedAt: string;
  note?: string;
  reason?: string;
  attestation?: PublishedAttestation;
}

// Store for completed reviews
const completedReviews = new Map<string, ReviewResponse>();

/**
 * Handle POST /api/v1/reviews/:ingestId/approve
 */
export async function handleReviewApprove(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const ingestId = (req as any).params[0];

        // Check if import exists
        const importRecord = pendingImports.get(ingestId);
        if (!importRecord) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Import not found' }));
          resolve();
          return;
        }

        // Check if already reviewed
        if (completedReviews.has(ingestId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Already reviewed' }));
          resolve();
          return;
        }

        const reviewRequest = JSON.parse(body) as ReviewRequest;
        const { reviewer, note } = reviewRequest;

        if (!reviewer) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Reviewer is required' }));
          resolve();
          return;
        }

        // Create approval response
        const response: ReviewResponse = {
          status: 'approved',
          ingestId,
          skillId: importRecord.skillId,
          reviewer,
          reviewedAt: new Date().toISOString(),
          note,
        };

        // Store the review
        completedReviews.set(ingestId, response);

        // Update import status
        pendingImports.set(ingestId, {
          ...importRecord,
          status: 'completed',
          message: 'Approved and ready for publishing',
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        resolve();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: errorMessage }));
        resolve();
      }
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Handle POST /api/v1/reviews/:ingestId/reject
 */
export async function handleReviewReject(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const ingestId = (req as any).params[0];

        // Check if import exists
        const importRecord = pendingImports.get(ingestId);
        if (!importRecord) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Import not found' }));
          resolve();
          return;
        }

        // Check if already reviewed
        if (completedReviews.has(ingestId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Already reviewed' }));
          resolve();
          return;
        }

        const reviewRequest = JSON.parse(body) as ReviewRequest;
        const { reviewer, reason } = reviewRequest;

        if (!reviewer) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Reviewer is required' }));
          resolve();
          return;
        }

        // Create rejection response
        const response: ReviewResponse = {
          status: 'rejected',
          ingestId,
          skillId: importRecord.skillId,
          reviewer,
          reviewedAt: new Date().toISOString(),
          reason,
        };

        // Store the review
        completedReviews.set(ingestId, response);

        // Update import status
        pendingImports.set(ingestId, {
          ...importRecord,
          status: 'failed',
          message: `Rejected: ${reason || 'No reason provided'}`,
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        resolve();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: errorMessage }));
        resolve();
      }
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Get review status
 */
export async function handleReviewStatus(
  req: http.IncomingMessage,
  res: http.ServerResponse
): Promise<void> {
  const ingestId = (req as any).params[0];
  const review = completedReviews.get(ingestId);

  if (!review) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Review not found', reviewed: false }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ...review, reviewed: true }));
}
