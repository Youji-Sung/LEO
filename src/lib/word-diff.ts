// 원문과 교정문의 단어 단위 차이. 최장 공통 부분열(LCS)로 같은 단어를 맞추고 나머지를 뺀/더한 단어로 표시한다.
// 리포트의 교정·제안 표시에 쓴다(콘솔 시안이 바뀐 단어를 강조). 비교는 대소문자·구두점을 무시하되 출력은 원문 그대로.
export type DiffToken = { text: string; kind: "same" | "removed" | "added" };

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function key(word: string): string {
  const k = word.toLowerCase().replace(/[^\p{L}\p{N}']+/gu, "");
  // 구두점만 있는 토큰("—", ",")은 서로 같은 단어로 묶이지 않게 원문을 키로 쓴다.
  return k || word;
}

export function diffWords(
  original: string,
  revised: string,
): { original: DiffToken[]; revised: DiffToken[] } {
  const a = words(original);
  const b = words(revised);
  const n = a.length;
  const m = b.length;
  // lcs[i][j] = a[i..] 와 b[j..] 의 LCS 길이
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i]![j] =
        key(a[i]!) === key(b[j]!)
          ? lcs[i + 1]![j + 1]! + 1
          : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  }
  const outA: DiffToken[] = [];
  const outB: DiffToken[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (key(a[i]!) === key(b[j]!)) {
      outA.push({ text: a[i]!, kind: "same" });
      outB.push({ text: b[j]!, kind: "same" });
      i++;
      j++;
    } else if (lcs[i + 1]![j]! >= lcs[i]![j + 1]!) {
      outA.push({ text: a[i]!, kind: "removed" });
      i++;
    } else {
      outB.push({ text: b[j]!, kind: "added" });
      j++;
    }
  }
  while (i < n) outA.push({ text: a[i++]!, kind: "removed" });
  while (j < m) outB.push({ text: b[j++]!, kind: "added" });
  return { original: outA, revised: outB };
}
