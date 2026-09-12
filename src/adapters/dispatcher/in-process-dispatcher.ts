import { EvaluationDispatcher } from '../../domain/interfaces/evaluation-dispatcher';
import { EvaluationService } from '../../services/evaluation-service';

export class InProcessEvaluationDispatcher implements EvaluationDispatcher {
  private static instance: InProcessEvaluationDispatcher | null = null;
  private evaluationService: EvaluationService;
  private runningJobs = new Set<string>();

  constructor(evaluationService?: EvaluationService) {
    this.evaluationService = evaluationService || new EvaluationService();
  }

  public static getInstance(): InProcessEvaluationDispatcher {
    if (!InProcessEvaluationDispatcher.instance) {
      InProcessEvaluationDispatcher.instance = new InProcessEvaluationDispatcher();
    }
    return InProcessEvaluationDispatcher.instance;
  }

  public async dispatch(evaluationId: string): Promise<void> {
    if (this.runningJobs.has(evaluationId)) {
      console.log(`Evaluation ${evaluationId} is already currently running.`);
      return;
    }

    this.runningJobs.add(evaluationId);

    // Run asynchronously without blocking caller
    (async () => {
      try {
        console.log(`🚀 In-process dispatcher starting evaluation ${evaluationId}...`);
        await this.evaluationService.processEvaluation(evaluationId);
        console.log(`✅ In-process dispatcher completed evaluation ${evaluationId}`);
      } catch (err) {
        console.error(`❌ In-process dispatcher error for evaluation ${evaluationId}:`, err);
      } finally {
        this.runningJobs.delete(evaluationId);
      }
    })();
  }
}

export const evaluationDispatcher = InProcessEvaluationDispatcher.getInstance();
