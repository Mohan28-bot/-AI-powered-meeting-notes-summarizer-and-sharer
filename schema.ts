import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const transcripts = pgTable("transcripts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  content: text("content").notNull(),
  fileName: text("file_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const summaries = pgTable("summaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transcriptId: varchar("transcript_id").references(() => transcripts.id).notNull(),
  content: text("content").notNull(),
  customInstructions: text("custom_instructions"),
  wordCount: text("word_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailShares = pgTable("email_shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  summaryId: varchar("summary_id").references(() => summaries.id).notNull(),
  recipients: text("recipients").notNull(), // JSON string of email array
  subject: text("subject").notNull(),
  message: text("message"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export const insertTranscriptSchema = createInsertSchema(transcripts).pick({
  content: true,
  fileName: true,
});

export const insertSummarySchema = createInsertSchema(summaries).pick({
  transcriptId: true,
  content: true,
  customInstructions: true,
  wordCount: true,
});

export const insertEmailShareSchema = createInsertSchema(emailShares).pick({
  summaryId: true,
  recipients: true,
  subject: true,
  message: true,
});

export type InsertTranscript = z.infer<typeof insertTranscriptSchema>;
export type Transcript = typeof transcripts.$inferSelect;
export type InsertSummary = z.infer<typeof insertSummarySchema>;
export type Summary = typeof summaries.$inferSelect;
export type InsertEmailShare = z.infer<typeof insertEmailShareSchema>;
export type EmailShare = typeof emailShares.$inferSelect;

// API request/response schemas
export const generateSummarySchema = z.object({
  transcriptContent: z.string().min(1, "Transcript content is required"),
  customInstructions: z.string().optional(),
});

export const sendEmailSchema = z.object({
  summaryId: z.string().min(1, "Summary ID is required"),
  recipients: z.array(z.string().email("Invalid email address")).min(1, "At least one recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().optional(),
});

export type GenerateSummaryRequest = z.infer<typeof generateSummarySchema>;
export type SendEmailRequest = z.infer<typeof sendEmailSchema>;
