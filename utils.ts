
export const normalize = (text: string, stripAccents = false) => {
  let res = text.toLowerCase().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();
  if (stripAccents) {
    res = res.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  return res;
};

export const calculateSimilarity = (s1: string, s2: string, stripAccents = false) => {
  const n1 = normalize(s1, stripAccents);
  const n2 = normalize(s2, stripAccents);
  if (n1 === n2) return 100;
  
  // Levenshtein-based similarity
  const len = Math.max(n1.length, n2.length);
  if (len === 0) return 100;
  
  const editDistance = (a: string, b: string) => {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
      }
    }
    return matrix[a.length][b.length];
  };

  const dist = editDistance(n1, n2);
  return Math.round(((len - dist) / len) * 100);
};

export const getDiff = (target: string, transcript: string) => {
  const tWords = target.split(' ');
  const rWords = transcript.split(' ');
  // This is a simple visual diff. For complex speech matching, word-by-word alignment is better.
  return tWords.map((word, i) => {
    const matched = rWords.find(rw => normalize(rw, true) === normalize(word, true));
    return {
      word,
      status: matched ? (normalize(matched) === normalize(word) ? 'correct' : 'accent-error') : 'missing'
    };
  });
};

export const formatTime = (ms: number) => {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hrs = Math.floor(min / 60);
  if (hrs > 0) return `${hrs}h ${min % 60}m`;
  if (min > 0) return `${min}m ${sec % 60}s`;
  return `${sec}s`;
};

// Fisher-Yates Shuffle
export function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}
