import numpy as np
from sentence_transformers import SentenceTransformer
from collections import defaultdict

class LocalVectorStore:
    def __init__(self):
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.vectors = defaultdict(list)
        self.texts = defaultdict(list)

    def add(self, texts, user_id):
        embeddings = self.model.encode(texts)

        for t, e in zip(texts, embeddings):
            self.vectors[user_id].append(e)
            self.texts[user_id].append(t)

    def search(self, query, user_id, k=3):
        if user_id not in self.vectors:
            return []

        q = self.model.encode([query])[0]

        sims = []
        for idx, v in enumerate(self.vectors[user_id]):
            score = np.dot(q, v) / (np.linalg.norm(q) * np.linalg.norm(v))
            sims.append((score, idx))

        sims.sort(reverse=True)

        return [self.texts[user_id][i] for _, i in sims[:k]]
