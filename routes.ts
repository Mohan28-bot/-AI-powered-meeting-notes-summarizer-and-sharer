import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateSummarySchema, sendEmailSchema } from "@shared/schema";
import multer from "multer";
import Groq from "groq-sdk";
import nodemailer from "nodemailer";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/plain' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only .txt and .docx files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_ENV_VAR || "default_key",
});

// Initialize nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER || "default_user",
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || "default_pass",
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload transcript file
  app.post("/api/transcripts/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      let content = "";
      if (req.file.mimetype === 'text/plain') {
        content = req.file.buffer.toString('utf-8');
      } else {
        // For .docx files, we would need a library like mammoth
        // For now, we'll treat it as text (simplified)
        content = req.file.buffer.toString('utf-8');
      }

      const transcript = await storage.createTranscript({
        content,
        fileName: req.file.originalname,
      });

      res.json(transcript);
    } catch (error) {
      console.error("Error uploading transcript:", error);
      res.status(500).json({ message: "Failed to upload transcript" });
    }
  });

  // Create transcript from text
  app.post("/api/transcripts", async (req, res) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Content is required" });
      }

      const transcript = await storage.createTranscript({
        content: content.trim(),
        fileName: null,
      });

      res.json(transcript);
    } catch (error) {
      console.error("Error creating transcript:", error);
      res.status(500).json({ message: "Failed to create transcript" });
    }
  });

  // Generate summary using Groq AI
  app.post("/api/summaries/generate", async (req, res) => {
    try {
      const validatedData = generateSummarySchema.parse(req.body);
      const { transcriptContent, customInstructions } = validatedData;

      // Create transcript first
      const transcript = await storage.createTranscript({
        content: transcriptContent,
        fileName: null,
      });

      // Prepare the prompt
      const defaultInstructions = "Summarize the following meeting transcript in a clear, organized format with key discussion points and action items.";
      const instructions = customInstructions || defaultInstructions;
      
      const prompt = `${instructions}\n\nTranscript:\n${transcriptContent}`;

      // Call Groq API
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 2048,
      });

      const summaryContent = completion.choices[0]?.message?.content || "";
      const wordCount = summaryContent.trim().split(/\s+/).length;

      // Save summary
      const summary = await storage.createSummary({
        transcriptId: transcript.id,
        content: summaryContent,
        customInstructions: instructions,
        wordCount: wordCount.toString(),
      });

      res.json(summary);
    } catch (error) {
      console.error("Error generating summary:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  // Update summary content
  app.patch("/api/summaries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Content is required" });
      }

      const updatedSummary = await storage.updateSummary(id, content);
      if (!updatedSummary) {
        return res.status(404).json({ message: "Summary not found" });
      }

      res.json(updatedSummary);
    } catch (error) {
      console.error("Error updating summary:", error);
      res.status(500).json({ message: "Failed to update summary" });
    }
  });

  // Get summary by ID
  app.get("/api/summaries/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const summary = await storage.getSummary(id);
      
      if (!summary) {
        return res.status(404).json({ message: "Summary not found" });
      }

      res.json(summary);
    } catch (error) {
      console.error("Error fetching summary:", error);
      res.status(500).json({ message: "Failed to fetch summary" });
    }
  });

  // Send email with summary
  app.post("/api/summaries/email", async (req, res) => {
    try {
      const validatedData = sendEmailSchema.parse(req.body);
      const { summaryId, recipients, subject, message } = validatedData;

      // Get the summary
      const summary = await storage.getSummary(summaryId);
      if (!summary) {
        return res.status(404).json({ message: "Summary not found" });
      }

      // Prepare email content
      const emailBody = `
${message ? message + '\n\n' : ''}
---
${summary.content}
---

This summary was generated using AI and may require review.
      `.trim();

      // Send email to each recipient
      const emailPromises = recipients.map(async (recipient) => {
        return transporter.sendMail({
          from: process.env.SMTP_USER || process.env.EMAIL_USER || "noreply@example.com",
          to: recipient,
          subject: subject,
          text: emailBody,
          html: emailBody.replace(/\n/g, '<br>'),
        });
      });

      await Promise.all(emailPromises);

      // Save email share record
      const emailShare = await storage.createEmailShare({
        summaryId,
        recipients: JSON.stringify(recipients),
        subject,
        message: message || null,
      });

      res.json({ 
        message: `Summary sent successfully to ${recipients.length} recipient(s)`,
        emailShare 
      });
    } catch (error) {
      console.error("Error sending email:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send email" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
