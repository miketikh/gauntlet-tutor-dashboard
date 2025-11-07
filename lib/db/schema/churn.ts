// Re-export churn-related tables from alerts.ts
// This file exists to maintain the module structure referenced in db/index.ts
export { churnAlgorithmWeights, churnWeightHistory } from './alerts';
