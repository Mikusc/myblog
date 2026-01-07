---
title: "COMP4133AADS 期末复习总纲：全模块考点 + 练习题导向学习路线（Big-O / Maps&Trees / Graph / DP / Pattern Matching / Trie）"
date: 2026-01-08 19:00:00
math: true
categories:
  - COMP4133AADS
  - 期末复习
keywords:
  - Big-O
  - Primitive operations
  - Map ADT
  - Hash Tables
  - Collision handling
  - Sorted Map
  - BST
  - AVL
  - BFS
  - DFS
  - Topological Sort
  - MST
  - Prim
  - Dijkstra
  - Dynamic Programming
  - Knapsack
  - Matrix Chain Product
  - Pattern Matching
  - Boyer-Moore
  - KMP
  - Trie
  - Suffix Trie
---

# COMP4133AADS 期末复习总纲（以 Revision 大纲 + 练习题为主线）

> 目标：把“会考什么”压成一份**可直接背、可直接手算**的清单。  
> 建议复习顺序：**先刷练习 → 总结模板 → 无计算器限时手算**。

---

## 0. 考试形式与复习原则

### 考试形式（你需要匹配的输出能力）
- 四题全做（Answer all FOUR questions），总分 100。
- No calculators（所有题都能手算）。
- 每题常见结构：**定义/解释（短答） + 手推/计算（主分） + 复杂度分析/理由（加分点）**。

### 复习原则（效率最高）
1) 每个主题先做对应练习 md（不会就回看讲义/笔记）。
2) 每个主题写一张“模板卡片”（伪代码 + 关键公式 + 复杂度 + 常见坑）。
3) 最后做“手算训练”：哈希表插入、旋转、BFS/DFS 顺序、Prim/Dijkstra 表、DP 表、BM/KMP 表、Trie 结构。

---

## 1. Big-O 与 Primitive Operations（基础必考）

### 1.1 Big-O 定义（必须会写）
$f(n)$ 是 $O(g(n))$：存在常数 $c>0$ 与 $n_0\ge 1$，使得对所有 $n\ge n_0$，
$$
f(n)\le c\,g(n)
$$

#### 典型题型
- **证明题**：如证明 $2n+10$ 是 $O(n)$。
- **化简题**：如 $an^2+bn+c$ 是 $O(n^2)$。
- **比较增长率**：$\log n \ll n \ll n\log n \ll n^2 \ll 2^n$。

#### 证明模板（手写通用）
要证 $f(n)=O(g(n))$：
1) 对 $n$ 足够大时给上界：$f(n)\le c g(n)$  
2) 指定 $c$ 和 $n_0$  
3) 写一句：因此对所有 $n\ge n_0$ 成立。

---

### 1.2 Primitive Operations（会数操作 → 推复杂度）
常见 primitive ops：赋值、引用、算术、比较、数组按下标访问、方法调用、返回等。

#### 典型题型
- 给一段代码：数 primitive operations 得 $T(n)$ → 写 Big-O。
- 常见套路：
  - 双层循环：$n^2$
  - 三层循环：$n^3$
  - 一层循环 + 内部常数：$n$
  - 循环边界是 $n/2$、$3n$：仍是 $O(n)$

---

## 2. Maps 与 Hash Tables（Map ADT + 冲突处理必须会算）

### 2.1 Map ADT（会解释 + 会复杂度）
- 基本操作：`get(k)`, `put(k,v)`, `remove(k)` 等。
- list-based map（线性表实现）：
  - `get/put/remove` 最坏 $O(n)$（线性查找）。

### 2.2 Hash Table（会手算插入/查找）
#### 必会概念
- 哈希函数：$h(k)\in\{0,\dots,N-1\}$
- 冲突 collision：不同 key 映射到同一桶/槽
- 装载因子：$\alpha=\frac{n}{N}$（越大越容易冲突）

#### 冲突处理（考试常考三件套）
1) **Separate Chaining（拉链法）**
- 桶里放链表/动态数组
- 平均：$O(1+\alpha)$，最坏：$O(n)$

2) **Linear Probing（线性探测）**
- 探测序列：$h(k),h(k)+1,h(k)+2,\dots \pmod N$
- 常考：逐步填表、解释 clustering（主聚集）

3) **Double Hashing（双重散列）**
- 探测：$h(k)+i\cdot h_2(k)\pmod N$
- 常考：给 $h,h_2$ 手算插入序列

#### 你要练到的程度（自测）
- 给定 $N$、keys、hash 函数：**写出每一次插入的探测过程 + 最终表格**。
- 给定一次 search：写出探测路径直到成功/失败。

---

## 3. Sorted Map ADT 与 BST（定义 + 更新操作 + 复杂度）

### 3.1 Sorted Map ADT（会说“按 key 有序”）
典型操作（知道概念即可）：
- `first/last`
- `floor/ceiling`
- `lower/higher`
核心：依赖“有序结构”（BST/AVL）。

### 3.2 BST 定义（必须背）
- 左子树 key < 当前 key < 右子树 key（无重复时）。

### 3.3 BST 基本操作（会画树 + 会删节点）
- Search：沿左右走到底，时间 $O(h)$
- Insert：找到外部节点插入，$O(h)$
- Delete（最爱考）三种情况：
  1) 叶子：直接删
  2) 一个孩子：孩子替换
  3) 两个孩子：用 inorder successor（右子树最小）或 predecessor 替换，再删替换节点（最终落到 1/2）

复杂度：
- 最坏：退化成链 $h=n$ → $O(n)$
- 一般写 $O(h)$ 即可。

---

## 4. AVL（旋转/三节点重构是核心）

### 4.1 AVL 定义（必须背）
AVL 是 BST，且任意节点左右子树高度差不超过 1：
$$
|h(L)-h(R)|\le 1
$$

### 4.2 插入后的重平衡（会找 z-y-x）
- 插入按 BST 做完
- 向上找第一个失衡点 $z$
- 令 $y$ 为 $z$ 的更高子树根，$x$ 为 $y$ 的更高子树根
- 对 $(x,y,z)$ 做 trinode restructuring（对应 LL/RR/LR/RL）

### 4.3 删除后的重平衡（会“aligned child”规则）
- 删除后可能一路向上多次重平衡
- 若 $y$ 两个孩子等高，选择与 $y$ 同侧 aligned 的孩子（避免错误结构）

### 4.4 AVL 复杂度（必须会写）
树高 $O(\log n)$，因此 search/insert/delete：
$$
O(\log n)
$$

---

## 5. Graph Algorithms（术语 + 表示 + BFS/DFS + Topo/MST/Dijkstra）

### 5.1 术语（必背）
vertex/edge、directed/undirected、weighted、path、cycle、connected、in-degree/out-degree

### 5.2 图的表示（会对比）
1) Adjacency Matrix：
- 空间 $O(|V|^2)$，稀疏图浪费
- 找邻居要扫整行

2) Adjacency List：
- 空间 $O(|V|+|E|)$
- 稀疏图更好，遍历更高效

### 5.3 BFS / DFS（会写伪代码 + 会给遍历序）
- BFS：Queue，按层扩展
- DFS：Stack/递归，尽可能深再回溯
复杂度（邻接表）：
$$
O(|V|+|E|)
$$

常考：
- 给图 + 起点：写 BFS/DFS 访问序（按题目规定的邻居顺序）
- 用 BFS/DFS 判连通/找路径/判环（概念题）

### 5.4 Topological Sort（DAG）
- 关键：有环则无法拓扑排序
- 常考：输出一个拓扑序或判断是否存在环

### 5.5 MST 与 Prim（会手推每一步）
- MST：权重总和最小的生成树
- Prim：从任意点开始，每次选跨 cut 的最小边加入

### 5.6 Dijkstra（非负权最短路）
- 维护 `dist[]` + 优先队列
- relax：若 $dist[v]>dist[u]+w(u,v)$ 则更新，并可维护 `prev[]` 输出路径
复杂度（常用写法）：
$$
O((|V|+|E|)\log |V|)
$$

---

## 6. Dynamic Programming（DP）（定义三要素 + 经典题）

### 6.1 DP 三要素（必背）
1) Define subproblem（状态定义）
2) Optimal substructure（最优子结构）
3) Overlap（子问题重叠）

### 6.2 DP 通用解题模板（考试通杀）
必须写清楚：
1) $dp[...]$ 含义  
2) 递推式  
3) base cases  
4) 计算顺序  
5) 返回值（答案在哪）  
6) 回溯（若要输出方案）

### 6.3 经典题型（Revision 明确点名）
#### (A) 1-D DP
- 常见：Fibonacci、爬楼梯、最大子段和等
- 形式多为：
  $dp[i]=\min/\max\{\dots\}$

#### (B) Tri tiling
- 常考：写递推或算前几项（若需要辅助状态要会解释“为什么必须扩展状态”）

#### (C) 0/1 Knapsack（最爱考表格）
- 状态：$dp[i][w]$ 表示前 $i$ 个物品、容量 $w$ 的最优值
$$
dp[i][w]=\max\big(dp[i-1][w],\ dp[i-1][w-w_i]+v_i\big)
$$
- 时间：$O(nW)$

#### (D) Matrix Chain Product（最优括号）
- $m[i][j]$：$A_i\cdots A_j$ 最少乘法次数
$$
m[i][j]=\min_{i\le k<j}\{m[i][k]+m[k+1][j]+p_{i-1}p_kp_j\}
$$
- 按链长递增计算

### 6.4 练习中出现过的“图上 DP / 最短路 DP”（强烈建议掌握）
- Backward（DAG 最短路）：
$$
V(t)=0,\quad V(i)=\min_{(i,j)\in E}\{c_{ij}+V(j)\}
$$
- Forward：
$$
F(s)=0,\quad F(j)=\min_{(i,j)\in E}\{F(i)+c_{ij}\}
$$

---

## 7. Pattern Matching（BF / BM / KMP：算表 + 手推过程）

### 7.1 Brute Force
最坏：
$$
O(nm)
$$

### 7.2 Boyer–Moore（BM）
必会：
1) last-occurrence function：$L(c)$ 为字符 $c$ 在 Pattern 中最右位置；无则 $-1$  
2) 手推 BM：右到左比较，mismatch 用 $L(c)$ 计算跳跃

### 7.3 KMP
必会：
1) failure function（prefix function）：每个位置最长 proper prefix = suffix 长度  
2) 手推 KMP：mismatch 时 $k\leftarrow f(k-1)$ 复用比较结果  
复杂度：
$$
O(|T|+|P|)
$$

---

## 8. Trie（Standard / Compressed / Suffix Trie）

### 8.1 为什么 Trie 快（会一句话解释）
预索引文本/词典，前缀共享；查询长度 $m$ 通常：
$$
O(m)
$$

### 8.2 Standard Trie（会画）
- 根无字符
- 路径拼成词
- 终止标记（terminal）

### 8.3 Compressed Trie（会画）
- 合并 single-child chain 为字符串边
- 内部节点度数至少 2

### 8.4 Suffix Trie（会构建思路）
- 把文本所有后缀插入（常加 `$`）
- substring 查询：沿模式串走路径，走完则存在，时间 $O(|P|)$

---

## 9. 用“练习题 md”反向复习（最省时间）

按考试覆盖面刷一遍（做完就能上考场）：

- Lecture 2（Map & Hash Tables）：`comp4133aads-lecture2-exercises.md`
- Lecture 3（BST / Sorted Map）：`comp4133aads-lecture3-exercises.md`
- Lecture 4（AVL）：`comp4133aads-lecture4-exercises.md`
- Week 6（Graph 1：ADT/表示/BFS/DFS）：`comp4133aads-week6-graph-algorithms-1-exercises.md`
- Week 7（Graph 2：Topo/MST/Prim/Dijkstra）：`comp4133aads-week7-graph-algorithms-2-exercises.md`
- Week 8（DP 1）：`comp4133aads-week8-dp1-exercises.md`
- Week 9（DP 2）：`comp4133aads-week9-dp2-exercises.md`
- Week 10（Pattern Matching）：`comp4133aads-week10-pattern-matching-exercises.md`
- Week 11（Trie）：`comp4133aads-week11-trie-exercises.md`

---

## 10. 最后一小时冲刺清单（Checklist）

1) Big-O：能写定义 + 完成一次证明（如 $2n+10=O(n)$）  
2) 循环计数：能从代码数出 $T(n)$ 并给 Big-O  
3) Hash：能手推三种冲突处理填完整表  
4) BST：能画出 delete 三种情况（两孩子用 successor）  
5) AVL：能定位 z-y-x 并完成 LL/RR/LR/RL 重构；删除后会“aligned child”  
6) 图表示：能比较矩阵 vs 邻接表优缺点  
7) BFS/DFS：能给遍历序 + 写复杂度 $O(|V|+|E|)$  
8) Prim：能一步一步构 MST  
9) Dijkstra：能填 dist/prev 表并写出最终路径（非负权）  
10) BM/KMP/Trie：能“算表 + 手推过程 + 写复杂度”

---

## 附：不需要花时间的部分
- Optimization methods（优化方法）主要针对 project，不在考试范围（别再投入时间）。

---
