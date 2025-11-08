// Random generation utilities with seed support

export class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  // Linear congruential generator
  private next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 2147483647;
    return this.seed / 2147483647;
  }

  // Random float between min and max
  float(min: number = 0, max: number = 1): number {
    return min + this.next() * (max - min);
  }

  // Random integer between min and max (inclusive)
  int(min: number, max: number): number {
    return Math.floor(this.float(min, max + 1));
  }

  // Random boolean with optional probability
  boolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  // Pick random element from array
  pick<T>(array: T[]): T {
    return array[this.int(0, array.length - 1)];
  }

  // Pick multiple unique elements from array
  pickMultiple<T>(array: T[], count: number): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  }

  // Weighted random selection
  weightedPick<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = this.float(0, totalWeight);

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }

  // Weighted selection from object (key -> weight)
  weightedPickFromObject<K extends string | number>(
    weights: Record<K, number>
  ): K {
    const keys = Object.keys(weights) as K[];
    const values = keys.map(k => weights[k]);
    return this.weightedPick(keys, values);
  }

  // Generate a normally distributed value using Box-Muller transform
  gaussian(mean: number = 0, stdDev: number = 1): number {
    const u1 = this.next();
    const u2 = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  // Generate value within range with normal distribution
  gaussianInRange(min: number, max: number, skew: number = 0.5): number {
    const mean = min + (max - min) * skew;
    const stdDev = (max - min) / 6; // 99.7% within range
    let value = this.gaussian(mean, stdDev);
    // Clamp to range
    return Math.max(min, Math.min(max, value));
  }

  // Generate random string ID
  id(length: number = 8): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => this.pick([...chars])).join('');
  }

  // Generate realistic name
  name(): { first: string; last: string; full: string } {
    const firstNames = [
      'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Elijah', 'Charlotte', 'William',
      'Sophia', 'James', 'Amelia', 'Benjamin', 'Isabella', 'Lucas', 'Mia',
      'Mason', 'Harper', 'Ethan', 'Evelyn', 'Alexander', 'Sarah', 'Michael',
      'Jessica', 'David', 'Emily', 'Daniel', 'Madison', 'Robert', 'Ashley',
      'Christopher', 'Samantha', 'Kevin', 'Kayla', 'Brian', 'Rachel',
    ];

    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
      'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
      'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
      'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark',
      'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King',
    ];

    const first = this.pick(firstNames);
    const last = this.pick(lastNames);
    return { first, last, full: `${first} ${last}` };
  }

  // Generate email from name
  email(name: { first: string; last: string }): string {
    const providers = ['gmail.com', 'yahoo.com', 'outlook.com', 'email.com'];
    const formats = [
      () => `${name.first.toLowerCase()}.${name.last.toLowerCase()}`,
      () => `${name.first.toLowerCase()}${name.last.toLowerCase()}`,
      () => `${name.first.toLowerCase()}.${name.last.toLowerCase()}${this.int(1, 99)}`,
      () => `${name.first.charAt(0).toLowerCase()}${name.last.toLowerCase()}`,
    ];

    const format = this.pick(formats)();
    const provider = this.pick(providers);
    return `${format}@${provider}`;
  }

  // Apply probability with modifiers
  applyProbability(
    base: number,
    modifiers?: Record<string, number>,
    conditions?: Record<string, boolean>
  ): number {
    let probability = base;

    if (modifiers && conditions) {
      for (const [condition, modifier] of Object.entries(modifiers)) {
        if (conditions[condition]) {
          probability = modifier;
          break; // Use first matching condition
        }
      }
    }

    return probability;
  }
}

// Default instance
export const random = new SeededRandom();

// Utility function to create a new seeded instance
export function createSeededRandom(seed?: number): SeededRandom {
  return new SeededRandom(seed);
}