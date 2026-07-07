import { RetrievalResult, RerankResult, Metrics } from '../types';
import ragDb from './rag_database.json';

export interface SampleQA {
  id: string;
  question: string;
  answer: string;
  retrieval: RetrievalResult[];
  rerank: RerankResult[];
  prompt: string;
  metrics: Metrics;
}

// Convert JSON database to structured SampleQA runtime format
export const SAMPLE_QAS: SampleQA[] = ragDb.questions.map((q) => {
  const retrieval: RetrievalResult[] = q.retrievalIds.map((docId, index) => {
    const doc = ragDb.documents.find((d) => d.id === docId);
    return {
      id: docId,
      score: index === 0 ? 0.9412 : 0.6542,
      source: doc ? doc.source : 'Unknown.pdf',
      content: doc ? doc.content : 'Document content not found.',
      date: doc ? doc.date : '2025-01-01',
      metadata: doc ? doc.metadata : {}
    };
  });

  const rerank: RerankResult[] = q.rerankIds.map((docId, index) => {
    const doc = ragDb.documents.find((d) => d.id === docId);
    return {
      id: docId,
      originalRank: index + 2,
      newRank: index + 1,
      score: index === 0 ? 0.982 : 0.823,
      content: doc ? doc.content : 'Document content not found.'
    };
  });

  return {
    id: q.id,
    question: q.question,
    answer: q.answer,
    retrieval,
    rerank,
    prompt: q.prompt,
    metrics: q.metrics
  };
});

