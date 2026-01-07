---
title: "COMP4133AADS 练习复习：Week 10 Pattern-Matching Algorithms（BF / Boyer–Moore / KMP）— 含答案"
date: 2026-01-08 19:00:00
math: true
categories:
  - COMP4133AADS
  - 练习复习
keywords:
  - Pattern Matching
  - Brute Force
  - Boyer-Moore
  - Last-occurrence function
  - KMP
  - Failure function
  - Time Complexity
---

# Week 10 练习题复习（Pattern-Matching Algorithms）— 含答案与思路

> 来源：Week 10 **PM.pdf**。本文件只整理 **PDF 里出现的练习题（Exercise）与思考题/提问**，并给出标准解题思路与答案。  
> 公式为 KaTeX：行内 `$...$`，独立 `$$...$$`。

---

## 思考题 A（Boyer–Moore 示例页）：Why BM is better than BF?（p9）

### 题目
1. Why BM is better than BF?

### 思路（抓住“跳跃”与“比较方向”）
- BF（Brute Force）每次对齐通常只能右移 1 位，且从左到右比较，失败后大量比较被浪费。
- BM 从右向左比较 + 用 **bad-character（character-jump）** 等启发式，失败时可以一次右移多位，从而显著减少对齐次数与比较次数（尤其在自然语言文本中）。

### 参考答案
Boyer–Moore 通常更快的原因：
- **Right-to-left comparison**：更容易在靠右位置早发现 mismatch。  
- **Character-jump（bad-character）**：mismatch 时按“最后出现位置”计算可跳过多次对齐。  
- 在英文文本里字符分布不极端，BM 往往接近“亚线性”行为；而 BF 最坏仍是 $O(nm)$。

---

## 思考题 B（Boyer–Moore 示例页）：Why choose last occurrence?（p9）

### 题目
2. Why choose last occurrence?

### 思路
你要解释两点：
1) **正确性（不会漏解）**：对齐到“最后一次出现”仍保证所有可能匹配不会被跳过。  
2) **尽量大步跳（更快）**：同一 mismatch 字符，用最右出现位置能给出**最大安全位移**。

### 参考答案
发生 mismatch：Text 当前字符为 $c$。  
- 若 $c$ 在 Pattern 中出现过，把 Pattern 中 **最右（last）** 的 $c$ 与 Text 的该 $c$ 对齐；这样位移最大，同时不可能跳过一个潜在匹配（因为更右的 $c$ 才可能让 Pattern 仍覆盖当前 $c$）。  
- 若 $c$ 不在 Pattern 中，则可以把 Pattern 整体移到 Text 当前字符右侧（Pattern[0] 对齐到 Text[i+1]），因为任何覆盖当前 $c$ 的对齐都不可能匹配。

---

## 思考题 C（Last-occurrence 页）：How to implement it using hash table?（p12）

### 题目
“Last-occurrence function can be computed in time $O(|P|)$ using hash table.  
How to implement it using hash table?”

### 思路
- 用 `Map<Character, Integer>`（Java：`HashMap`）存：字符 $	o$ 最右索引。
- 扫一遍 Pattern，从左到右不断覆盖同一字符的值，最终留下最右索引。
- 对于 alphabet 里没出现的字符，默认值为 `-1`（可以 `getOrDefault`）。

### 参考答案（伪代码）
1) 初始化 `Map last = new HashMap<>()`  
2) 对 Pattern 扫描：  
   - for `i = 0..m-1`: `last.put(P[i], i)`  
3) 查询：  
   - `l = last.getOrDefault(c, -1)`  
时间：建立表 $O(|P|)$，查询均摊 $O(1)$。

---

## Exercise 1：Last-occurrence function（p14）

### 题目
Find the last-occurrence function, given  
- $S = \{a,b,c,d,r,s,t\}$  
- $P = \texttt{abstract}$

请给出 $L(c)$（每个字符在 Pattern 中最右出现的位置；若不存在则为 $-1$）。

### 思路
把 Pattern 写上索引：  
`abstract` = a b s t r a c t  
索引从 0 开始：  
- a: 0,5  
- b: 1  
- s: 2  
- t: 3,7  
- r: 4  
- c: 6  
- d: 不出现

### 答案
| char $c$ | a | b | c | d | r | s | t |
|---|---:|---:|---:|---:|---:|---:|---:|
| $L(c)$ | 5 | 1 | 6 | -1 | 4 | 2 | 7 |

---

## Exercise 2：Boyer–Moore algorithm（p18）

### 题目
Text（下标 0..9）：
`a b b a d b c a b b`  
Pattern：
`c a b`

用 Boyer–Moore（基于 last-occurrence 的 character-jump）求匹配位置（起始下标）。

### 准备：last-occurrence 表
Pattern `c a b`（索引 0..2）：
- $L(c)=0$，$L(a)=1$，$L(b)=2$，其他字符 $=-1$

### 解题思路（按课件 BM 伪代码）
- 从右往左比较（先比 Pattern 最右字符 `b`）
- mismatch 时令 $l=L(T[i])$，更新：
$$
i \leftarrow i + m - \min(j, 1+l),\quad j\leftarrow m-1
$$

### 过程（关键步，够你复盘）
- $m=3$  
- 初始：$i=2, j=2$（Pattern 末尾对齐 Text[2]）

1) 对齐起点 $s=i-(m-1)=0$：  
   - Text[2]=b 与 P[2]=b ✅  
   - Text[1]=b 与 P[1]=a ❌（mismatch，$T[i]=T[1]=b$，$l=L(b)=2$）  
   - 更新：$i=1+3-\min(1,3)=1+3-1=3$，$j=2$

2) 对齐起点 $s=3-2=1$：  
   - Text[3]=a 与 P[2]=b ❌（$l=L(a)=1$）  
   - $i=3+3-\min(2,2)=4$，$j=2$

3) 对齐起点 $s=4-2=2$：  
   - Text[4]=d 与 P[2]=b ❌（$l=L(d)=-1$）  
   - $i=4+3-\min(2,0)=7$，$j=2$

4) 对齐起点 $s=7-2=5$：  
   - Text[7]=a 与 P[2]=b ❌（$l=L(a)=1$）  
   - $i=7+3-\min(2,2)=8$，$j=2$

5) 对齐起点 $s=8-2=6$：  
   - Text[8]=b 与 P[2]=b ✅  
   - Text[7]=a 与 P[1]=a ✅  
   - Text[6]=c 与 P[0]=c ✅ → 匹配成功

### 答案
匹配起始下标：**6**（Pattern 出现在 Text[6..8]）。

---

## 思考题 D（BM→KMP 过渡）：Can we pre-index mismatched Pattern characters in Pattern?（p23）

### 题目
“Pre-indexing mismatched Text characters in Pattern” 已有（BM 的 last-occurrence）。  
Can we pre-indexing mismatched Pattern characters in Pattern?

### 参考答案
可以，这就是 **KMP** 的核心：预处理 Pattern 的 **self-overlap（前后缀重叠）**，得到 failure function（或 prefix function）。  
当 mismatch 发生时，不再把 Pattern 只右移 1 位，而是根据 failure function 直接跳到“仍可能匹配”的最长前缀位置，复用已成功比较的信息。

---

## Exercise 3：KMP algorithm（p32）

### 题目
Text（下标 0..12）：
`a b b a a b b a a b b a b`  
Pattern：
`a b b a b`  

要求：  
1) 计算 Pattern 的 failure function（课件记为 $f(k)$ 或数组 $F$）  
2) 用 KMP 找到 Pattern 在 Text 中的匹配起始位置（若有）

---

### (1) Failure function

#### 思路（定义）
$f(k)$：Pattern 的前缀中，**既是** $P[0..k]$ 的后缀的最长长度（课件说明：$P[0]$ 不计入“零位移”，所以 $f(0)=0$）。  
实操就是：对每个 $k$，找最长 proper prefix = suffix 的长度。

#### 答案（Pattern = a b b a b）
索引 0..4：

| $k$ | 0 | 1 | 2 | 3 | 4 |
|---|---:|---:|---:|---:|---:|
| $P[k]$ | a | b | b | a | b |
| $f(k)$ | 0 | 0 | 0 | 1 | 2 |

解释要点：  
- $k=3$（`abba`）有前后缀 `a` 重叠，长度 1  
- $k=4$（`abbab`）有前后缀 `ab` 重叠，长度 2

---

### (2) KMP 匹配位置

#### 思路（KMP 的“复用成功比较”）
- 维护 Text 指针 $j$、Pattern 指针 $k$  
- 若 mismatch 且 $k>0$：$k \leftarrow f(k-1)$（把 Pattern 右移到能复用的位置）  
- 若 mismatch 且 $k=0$：$j++$

#### 答案
该 Pattern 在 Text 中匹配起始下标为：**8**（Text[8..12] = `a b b a b`）。

---

## 速记区（考试常问的点）

- BF：最坏时间 $O(nm)$  
- BM：预处理 last-occurrence（可用 HashMap，建表 $O(|P|)$）；平均快，但最坏仍可能 $O(nm)$  
- KMP：预处理 failure function $O(|P|)$，匹配 $O(|T|)$，总复杂度：
$$
O(|P|+|T|)
$$
- KMP 正确性/复杂度常用解释（课件）：定义 $s=j-k$，while 循环每轮至少让 $s$ 或 $j$ 增加 1，因此循环次数 $\le 2n$（$n=|T|$）。

---
