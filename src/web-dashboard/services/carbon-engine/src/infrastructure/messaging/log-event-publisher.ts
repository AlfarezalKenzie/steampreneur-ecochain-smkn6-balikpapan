import type { DomainEvent, EventPublisher } from "../../application/ports";
import type { Logger } from "../logger";

/**
 * Publisher sementara: hanya mencatat event ke log. Adapter RabbitMQ/Redis Streams
 * cukup mengimplementasikan port `EventPublisher` yang sama, tanpa mengubah use case.
 */
export class LogEventPublisher implements EventPublisher {
  constructor(private readonly logger: Logger) {}

  async publish(event: DomainEvent): Promise<void> {
    this.logger.info({ event: event.name, occurredAt: event.occurredAt, payload: event.payload }, "domain event");
  }
}
