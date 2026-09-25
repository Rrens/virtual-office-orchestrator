import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';
import { KAFKA_TOPICS, type VirtualOfficeEvent } from '@virtual-office/shared';

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'virtual-office-server',
  brokers: (process.env.KAFKA_BROKER || 'localhost:9092').split(','),
  logLevel: logLevel.WARN,
});

let producer: Producer | null = null;

export async function getProducer(): Promise<Producer> {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
  }
  return producer;
}

export async function publishEvent(event: VirtualOfficeEvent): Promise<void> {
  const p = await getProducer();

  const topicMap: Record<string, string> = {
    'agent.': KAFKA_TOPICS.AGENT_EVENTS,
    'task.': KAFKA_TOPICS.TASK_EVENTS,
    'workflow.': KAFKA_TOPICS.WORKFLOW_EVENTS,
    'tool.': KAFKA_TOPICS.TOOL_EVENTS,
    'approval.': KAFKA_TOPICS.APPROVAL_EVENTS,
  };

  const topic = Object.entries(topicMap).find(([prefix]) =>
    event.type.startsWith(prefix)
  )?.[1] ?? KAFKA_TOPICS.SYSTEM_LOGS;

  await p.send({
    topic,
    messages: [
      {
        key: event.projectId,
        value: JSON.stringify(event),
      },
    ],
  });
}

export async function createConsumer(groupId: string): Promise<Consumer> {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  return consumer;
}

export async function disconnectKafka(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
}

export { KAFKA_TOPICS };
