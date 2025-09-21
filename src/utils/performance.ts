import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: Date;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics: number = 1000;

  /**
   * Measure execution time of an async function
   */
  public async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await fn();
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      this.recordMetrics({
        operation,
        duration: endTime - startTime,
        memoryUsage: endMemory,
        timestamp: new Date(),
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      this.recordMetrics({
        operation,
        duration: endTime - startTime,
        memoryUsage: endMemory,
        timestamp: new Date(),
      });
      
      throw error;
    }
  }

  /**
   * Measure execution time of a sync function
   */
  public measureSync<T>(
    operation: string,
    fn: () => T
  ): T {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = fn();
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      this.recordMetrics({
        operation,
        duration: endTime - startTime,
        memoryUsage: endMemory,
        timestamp: new Date(),
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      this.recordMetrics({
        operation,
        duration: endTime - startTime,
        memoryUsage: endMemory,
        timestamp: new Date(),
      });
      
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get metrics for a specific operation
   */
  public getMetricsForOperation(operation: string): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.operation === operation);
  }

  /**
   * Get average performance for an operation
   */
  public getAveragePerformance(operation: string): {
    averageDuration: number;
    averageMemoryUsage: number;
    callCount: number;
  } {
    const operationMetrics = this.getMetricsForOperation(operation);
    
    if (operationMetrics.length === 0) {
      return {
        averageDuration: 0,
        averageMemoryUsage: 0,
        callCount: 0,
      };
    }

    const totalDuration = operationMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    const totalMemory = operationMetrics.reduce((sum, metric) => sum + metric.memoryUsage.heapUsed, 0);
    
    return {
      averageDuration: totalDuration / operationMetrics.length,
      averageMemoryUsage: totalMemory / operationMetrics.length,
      callCount: operationMetrics.length,
    };
  }

  /**
   * Get slow operations
   */
  public getSlowOperations(threshold: number = 100): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.duration > threshold);
  }

  /**
   * Clear metrics
   */
  public clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get memory usage statistics
   */
  public getMemoryStats(): {
    current: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
    average: NodeJS.MemoryUsage;
  } {
    const current = process.memoryUsage();
    const allMetrics = this.metrics;
    
    if (allMetrics.length === 0) {
      return {
        current,
        peak: current,
        average: current,
      };
    }

    const peak = allMetrics.reduce((max, metric) => {
      return {
        rss: Math.max(max.rss, metric.memoryUsage.rss),
        heapTotal: Math.max(max.heapTotal, metric.memoryUsage.heapTotal),
        heapUsed: Math.max(max.heapUsed, metric.memoryUsage.heapUsed),
        external: Math.max(max.external, metric.memoryUsage.external),
        arrayBuffers: Math.max(max.arrayBuffers, metric.memoryUsage.arrayBuffers),
      };
    }, allMetrics[0].memoryUsage);

    const average = allMetrics.reduce((sum, metric) => {
      return {
        rss: sum.rss + metric.memoryUsage.rss,
        heapTotal: sum.heapTotal + metric.memoryUsage.heapTotal,
        heapUsed: sum.heapUsed + metric.memoryUsage.heapUsed,
        external: sum.external + metric.memoryUsage.external,
        arrayBuffers: sum.arrayBuffers + metric.memoryUsage.arrayBuffers,
      };
    }, {
      rss: 0,
      heapTotal: 0,
      heapUsed: 0,
      external: 0,
      arrayBuffers: 0,
    });

    const count = allMetrics.length;
    return {
      current,
      peak,
      average: {
        rss: average.rss / count,
        heapTotal: average.heapTotal / count,
        heapUsed: average.heapUsed / count,
        external: average.external / count,
        arrayBuffers: average.arrayBuffers / count,
      },
    };
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      return await performanceMonitor.measureAsync(
        `${target.constructor.name}.${propertyName}`,
        () => method.apply(this, args)
      );
    };
    
    return descriptor;
  };
}

/**
 * Utility function to format memory usage
 */
export function formatMemoryUsage(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Utility function to format duration
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds.toFixed(2)}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(2)}s`;
  } else {
    return `${(milliseconds / 60000).toFixed(2)}m`;
  }
}
