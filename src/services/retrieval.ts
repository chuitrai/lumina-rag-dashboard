/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Lightweight TF-IDF + cosine-similarity retrieval over the local RAG corpus.
 *
 * Replaces the old keyword-overlap heuristic, which scored matches with
 * `docContentNorm.includes(word)` — a plain substring check with no word
 * boundaries — and stripped Vietnamese tones before comparing, which collapses
 * distinct words like "đồng" and "động" into the same token "dong". Combined,
 * those two bugs caused frequent wrong-document retrieval (e.g. a currency
 * amount "đồng" would count as a match for the unrelated word "động").
 *
 * TF-IDF weighting fixes this in practice: rare, information-carrying tokens
 * (e.g. "hiv", "aids") dominate the similarity score, while common tokens that
 * appear in nearly every document (and are more likely to collide after tone
 * stripping) contribute almost nothing because their IDF is near zero.
 */

export interface IndexedDoc {
  id: string;
  source: string;
  content: string;
  date?: string | null;
  metadata: Record<string, any>;
}

interface DocVector {
  doc: IndexedDoc;
  terms: Map<string, number>; // term -> tf-idf weight
  norm: number; // precomputed L2 norm of the term vector
}

export interface RetrievedDoc {
  doc: IndexedDoc;
  score: number;
}

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

const STOPWORDS = new Set([
  'la', 'va', 'cac', 'nhung', 'nao', 'nay', 'do', 'dc', 'the', 'theo', 'cua',
  'co', 'khong', 'duoc', 'tai', 'de', 'cho', 'tu', 'den', 'voi', 'trong',
  've', 'mot', 'nhu', 'hay', 'hoac', 'khi', 'neu', 'thi', 'da', 'se', 'phai',
  'bi', 'con', 'nen', 'lai', 'ra', 'vao', 'len', 'xuong', 'boi', 'sau', 'truoc',
  'gi', 'ai', 'bao', 'nhieu', 'sao', 'a', 'an', 'i',
]);

export function tokenize(text: string): string[] {
  return removeVietnameseTones(text.toLowerCase())
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'‘’“”]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

function textOf(doc: IndexedDoc): string {
  const metaValues = Object.values(doc.metadata || {}).join(' ');
  return `${doc.source} ${metaValues} ${doc.content}`;
}

class RagIndex {
  private docVectors: DocVector[] = [];
  private idf = new Map<string, number>();

  constructor(documents: IndexedDoc[]) {
    const df = new Map<string, number>();
    const docTerms: { doc: IndexedDoc; tf: Map<string, number> }[] = [];

    for (const doc of documents) {
      const tokens = tokenize(textOf(doc));
      const tf = new Map<string, number>();
      for (const tok of tokens) {
        tf.set(tok, (tf.get(tok) || 0) + 1);
      }
      for (const tok of tf.keys()) {
        df.set(tok, (df.get(tok) || 0) + 1);
      }
      docTerms.push({ doc, tf });
    }

    const N = documents.length || 1;
    for (const [term, count] of df.entries()) {
      this.idf.set(term, Math.log(1 + N / count));
    }

    this.docVectors = docTerms.map(({ doc, tf }) => {
      const terms = new Map<string, number>();
      let sumSquares = 0;
      for (const [term, count] of tf.entries()) {
        const weight = count * (this.idf.get(term) || 0);
        terms.set(term, weight);
        sumSquares += weight * weight;
      }
      return { doc, terms, norm: Math.sqrt(sumSquares) };
    });
  }

  search(query: string, topK: number): RetrievedDoc[] {
    const qTokens = tokenize(query);
    if (qTokens.length === 0) return [];

    const qTf = new Map<string, number>();
    for (const tok of qTokens) {
      qTf.set(tok, (qTf.get(tok) || 0) + 1);
    }
    const qTerms = new Map<string, number>();
    let qSumSquares = 0;
    for (const [term, count] of qTf.entries()) {
      const weight = count * (this.idf.get(term) || 0);
      qTerms.set(term, weight);
      qSumSquares += weight * weight;
    }
    const qNorm = Math.sqrt(qSumSquares);
    if (qNorm === 0) return [];

    const results: RetrievedDoc[] = [];
    for (const dv of this.docVectors) {
      if (dv.norm === 0) continue;
      let dot = 0;
      for (const [term, qWeight] of qTerms.entries()) {
        const dWeight = dv.terms.get(term);
        if (dWeight) dot += qWeight * dWeight;
      }
      if (dot === 0) continue;
      results.push({ doc: dv.doc, score: dot / (qNorm * dv.norm) });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}

let cachedIndex: RagIndex | null = null;

export function getRagIndex(documents: IndexedDoc[]): RagIndex {
  if (!cachedIndex) {
    cachedIndex = new RagIndex(documents);
  }
  return cachedIndex;
}
