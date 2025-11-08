'use client';

class SimpleRandom {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed || Date.now();
  }

  private next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 2147483647;
    return this.seed / 2147483647;
  }

  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

const providers = ['gmail.com', 'yahoo.com', 'outlook.com', 'email.com'];

export function generateRandomEmail(name?: { first: string; last: string }): string {
  const random = new SimpleRandom();

  if (!name) {
    // Generate completely random email
    const randomName = `user${random.int(1000, 9999)}`;
    return `${randomName}@${random.pick(providers)}`;
  }

  const formats = [
    () => `${name.first.toLowerCase()}.${name.last.toLowerCase()}`,
    () => `${name.first.toLowerCase()}${name.last.toLowerCase()}`,
    () => `${name.first.toLowerCase()}.${name.last.toLowerCase()}${random.int(1, 99)}`,
    () => `${name.first.charAt(0).toLowerCase()}${name.last.toLowerCase()}`,
  ];

  const format = random.pick(formats)();
  const provider = random.pick(providers);
  return `${format}@${provider}`;
}
