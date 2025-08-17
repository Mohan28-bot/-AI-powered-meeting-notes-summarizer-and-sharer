import { type Transcript, type InsertTranscript, type Summary, type InsertSummary, type EmailShare, type InsertEmailShare } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Transcript operations
  createTranscript(transcript: InsertTranscript): Promise<Transcript>;
  getTranscript(id: string): Promise<Transcript | undefined>;
  
  // Summary operations
  createSummary(summary: InsertSummary): Promise<Summary>;
  getSummary(id: string): Promise<Summary | undefined>;
  updateSummary(id: string, content: string): Promise<Summary | undefined>;
  getSummariesByTranscriptId(transcriptId: string): Promise<Summary[]>;
  
  // Email share operations
  createEmailShare(emailShare: InsertEmailShare): Promise<EmailShare>;
  getEmailSharesBySummaryId(summaryId: string): Promise<EmailShare[]>;
}

export class MemStorage implements IStorage {
  private transcripts: Map<string, Transcript>;
  private summaries: Map<string, Summary>;
  private emailShares: Map<string, EmailShare>;

  constructor() {
    this.transcripts = new Map();
    this.summaries = new Map();
    this.emailShares = new Map();
  }

  async createTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    const id = randomUUID();
    const transcript: Transcript = {
      ...insertTranscript,
      id,
      fileName: insertTranscript.fileName || null,
      createdAt: new Date(),
    };
    this.transcripts.set(id, transcript);
    return transcript;
  }

  async getTranscript(id: string): Promise<Transcript | undefined> {
    return this.transcripts.get(id);
  }

  async createSummary(insertSummary: InsertSummary): Promise<Summary> {
    const id = randomUUID();
    const summary: Summary = {
      ...insertSummary,
      id,
      customInstructions: insertSummary.customInstructions || null,
      wordCount: insertSummary.wordCount || null,
      createdAt: new Date(),
    };
    this.summaries.set(id, summary);
    return summary;
  }

  async getSummary(id: string): Promise<Summary | undefined> {
    return this.summaries.get(id);
  }

  async updateSummary(id: string, content: string): Promise<Summary | undefined> {
    const summary = this.summaries.get(id);
    if (!summary) return undefined;
    
    const updatedSummary = {
      ...summary,
      content,
      wordCount: content.trim().split(/\s+/).length.toString(),
    };
    this.summaries.set(id, updatedSummary);
    return updatedSummary;
  }

  async getSummariesByTranscriptId(transcriptId: string): Promise<Summary[]> {
    return Array.from(this.summaries.values()).filter(
      (summary) => summary.transcriptId === transcriptId
    );
  }

  async createEmailShare(insertEmailShare: InsertEmailShare): Promise<EmailShare> {
    const id = randomUUID();
    const emailShare: EmailShare = {
      ...insertEmailShare,
      id,
      message: insertEmailShare.message || null,
      sentAt: new Date(),
    };
    this.emailShares.set(id, emailShare);
    return emailShare;
  }

  async getEmailSharesBySummaryId(summaryId: string): Promise<EmailShare[]> {
    return Array.from(this.emailShares.values()).filter(
      (emailShare) => emailShare.summaryId === summaryId
    );
  }
}

export const storage = new MemStorage();
