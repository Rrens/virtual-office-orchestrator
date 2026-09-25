import { prisma } from '../db.js';
import { modelRouter } from '../models/router.js';
import { createTask } from '../tasks/service.js';
import { publishEvent } from '../events/kafka.js';
import { randomUUID } from 'crypto';

export interface CustomerFeedbackInput {
  projectId: string;
  source: 'support_ticket' | 'user_survey' | 'crash_report' | 'app_review';
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  userEmail?: string;
}

export interface FeedbackAnalysis {
  issueCategory: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  featureRequest: boolean;
  bugReport: boolean;
  proposedTaskTitle: string;
  proposedTaskDescription: string;
  targetRole: string;
}

export class ClosedLoopService {
  async processFeedback(input: CustomerFeedbackInput): Promise<{
    analysis: FeedbackAnalysis;
    generatedTaskId?: string;
  }> {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      include: {
        workflowExecutions: {
          where: { status: 'completed' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) throw new Error(`Project '${input.projectId}' not found`);

    // Step 1: Customer Success agent analyzes the feedback
    const analysisResponse = await modelRouter.routeByTier('tier1_ollama', {
      messages: [
        {
          role: 'system',
          content: `You are the Customer Success Manager. Analyze incoming user feedback and extract actionable engineering/product tasks.
Output strict JSON matching:
{
  "issueCategory": "string",
  "severity": "low" | "medium" | "high" | "critical",
  "featureRequest": boolean,
  "bugReport": boolean,
  "proposedTaskTitle": "string",
  "proposedTaskDescription": "string",
  "targetRole": "backend-engineer" | "frontend-engineer" | "product-manager" | "qa-engineer"
}`,
        },
        {
          role: 'user',
          content: `Customer Feedback: "${input.content}"\nSource: ${input.source}\nProject: ${project.name}`,
        },
      ],
      temperature: 0.2,
      agentRole: 'customer-success',
    });

    let analysis: FeedbackAnalysis;
    try {
      const clean = analysisResponse.content
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      analysis = JSON.parse(clean);
    } catch {
      analysis = {
        issueCategory: 'general_improvement',
        severity: 'medium',
        featureRequest: true,
        bugReport: false,
        proposedTaskTitle: `User Feedback: ${input.content.slice(0, 50)}`,
        proposedTaskDescription: input.content,
        targetRole: 'product-manager',
      };
    }

    // Step 2: If actionable bug or high/critical severity, auto-create improvement task
    let generatedTaskId: string | undefined;
    const latestExecution = project.workflowExecutions[0];

    if (latestExecution && (analysis.bugReport || analysis.severity === 'high' || analysis.severity === 'critical')) {
      const newTask = await createTask({
        workflowExecutionId: latestExecution.id,
        title: `[Feedback Loop] ${analysis.proposedTaskTitle}`,
        description: `${analysis.proposedTaskDescription}\n\nOriginal feedback (${input.source}): "${input.content}"`,
        agentRole: analysis.targetRole as any,
        dependencies: [],
        inputArtifacts: [],
        outputArtifacts: [`feedback/${randomUUID().slice(0, 8)}.md`],
      });

      generatedTaskId = newTask.id;

      await publishEvent({
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        projectId: input.projectId,
        workflowExecutionId: latestExecution.id,
        type: 'task.created',
        taskId: newTask.id,
        title: newTask.title,
        agentRole: newTask.agentRole,
        dependencies: [],
      });
    }

    return { analysis, generatedTaskId };
  }
}

export const closedLoopService = new ClosedLoopService();
