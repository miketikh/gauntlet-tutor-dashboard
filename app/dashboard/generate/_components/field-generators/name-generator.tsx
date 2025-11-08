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
}

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

export function generateRandomName(): { full: string; first: string; last: string } {
  const random = new SimpleRandom();
  const first = random.pick(firstNames);
  const last = random.pick(lastNames);
  return { first, last, full: `${first} ${last}` };
}
