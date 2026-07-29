import path from 'node:path';
import express from 'express';
import { app, ensureReady, internals, projectDir } from './app.js';

const port = Number(process.env.PORT || 3000);

async function start(): Promise<void> {
  await ensureReady();

  if (process.argv.includes('--build-index')) {
    await internals.buildDenseIndex(internals.defaultEmbeddingModel);
    console.log(`Dense index sẵn sàng: ${internals.getDocuments().length} chunks, model ${internals.defaultEmbeddingModel}.`);
    return;
  }

  if (process.argv.includes('--smoke')) {
    const examples = internals.getExamples();
    const question = examples[0]?.question || 'Hồ sơ bệnh án nào cần được hoàn thiện?';
    const hits = internals.retrieveBm25(question, 3);
    console.log(JSON.stringify({
      datasetExamples: examples.length,
      evaluationExamples: internals.getEvaluationReferences().size,
      fewShotExamples: internals.getFewShotExamples().length,
      evidenceChunks: internals.getDocuments().length,
      question,
      topHits: hits,
    }, null, 2));
    return;
  }

  if (process.argv.includes('--production')) {
    const distDir = path.join(projectDir, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_request, response) => response.sendFile(path.join(distDir, 'index.html')));
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      root: projectDir,
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`ViHERMES RAG demo: http://localhost:${port}`);
    console.log(`Dataset: ${internals.getDocuments().length} evidence chunks từ ${internals.getExamples().length} câu hỏi`);
    console.log(`Providers: Gemini (model ${internals.defaultLlmModel}) generation + BM25/Jina retrieval`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
