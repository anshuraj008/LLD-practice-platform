export interface EvaluationDispatcher {
  dispatch(evaluationId: string): Promise<void>;
}
