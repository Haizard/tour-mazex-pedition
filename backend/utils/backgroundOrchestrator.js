import { createClient } from "redis";

/**
 * High-fidelity background task orchestrator.
 * Uses Redis as a message broker to decouple heavy operations from the request/response cycle.
 */
class BackgroundOrchestrator {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.queueName = "tour_maze_task_queue";
  }

  async init(env = globalThis.process?.env || {}) {
    if (this.isReady) return;
    
    try {
      this.client = createClient({
        url: env.REDIS_URL || "redis://localhost:6379"
      });

      this.client.on("error", (err) => console.error("Redis Orchestrator Error:", err));
      
      await this.client.connect();
      this.isReady = true;
      console.log("🚀 Background Orchestrator Initialized (Redis)");
    } catch (error) {
      console.warn("⚠️ Redis not available. Background tasks will fall back to sync-simulated mode.");
      this.isReady = false;
    }
  }

  /**
   * Enqueues a task for background processing.
   * Falls back to setImmediate if Redis is unavailable.
   */
  async enqueue(taskType, payload) {
    const task = {
      id: crypto.randomUUID?.() || Date.now().toString(),
      type: taskType,
      payload,
      timestamp: new Date().toISOString(),
    };

    if (this.isReady) {
      try {
        await this.client.lPush(this.queueName, JSON.stringify(task));
        // Also publish an event for real-time workers if any are listening
        await this.client.publish("task_events", JSON.stringify({ type: "NEW_TASK", taskId: task.id }));
        return task.id;
      } catch (error) {
        console.error("Failed to enqueue to Redis, falling back:", error);
      }
    }

    // Fallback: Fire and forget locally
    setImmediate(() => this.processLocally(task));
    return task.id;
  }

  /**
   * Simulates background processing when Redis is down or for low-priority environments.
   */
  async processLocally(task) {
    // In a real worker, this would be handled by a separate process
    // For the "Orchestrator" utility, we provide a unified entry point
    try {
      console.log(`[Local Worker] Processing ${task.type} (${task.id})`);
      // Add logic hooks here if needed for sync-simulation
    } catch (error) {
      console.error(`[Local Worker] Failed task ${task.id}:`, error);
    }
  }
}

export const orchestrator = new BackgroundOrchestrator();
