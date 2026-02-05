type Task<T> = () => Promise<T>;

export class RateLimiter {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(private maxConcurrent: number) {}

  run<T>(task: Task<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const start = () => {
        this.active += 1;
        task()
          .then(resolve, reject)
          .finally(() => {
            this.active -= 1;
            const next = this.queue.shift();
            if (next) next();
          });
      };

      if (this.active < this.maxConcurrent) {
        start();
      } else {
        this.queue.push(start);
      }
    });
  }
}
