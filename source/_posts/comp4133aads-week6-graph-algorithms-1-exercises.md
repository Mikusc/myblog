---
title: "COMP4133AADS 练习复习：Week 6 Graph Algorithms 1（Graphs, BFS, DFS）— 含答案"
date: 2026-01-08 19:00:00
math: true
categories:
  - COMP4133AADS
  - 练习复习
keywords:
  - Graph terminology
  - Graph ADT
  - Adjacency matrix
  - Adjacency list
  - BFS
  - DFS
  - Cycle detection
  - Complexity O(|V|+|E|)
---

# Week 6 练习题复习（Graph Algorithms 1）— 含答案与思路

> 覆盖内容：Graph 基本术语 + Graph ADT + 两种实现（matrix / list）+ **BFS / DFS（含手算过程）** + DFS 检测有向环 + BFS/DFS 复杂度 $O(|V|+|E|)$。  
> **注意：BFS/DFS 的访问顺序一般不唯一**（取决于“邻居遍历顺序”），本文件给出的是课件示例中的那一种顺序。

---

## 练习 0：Graph 术语速测（p12–p15）

### 题目（写定义/判断）
1) 用集合符号写出图：顶点集合 $V$、边集合 $E$，并说明 $E\subseteq V\times V$。  
2) **adjacent（相邻）**：什么时候说 “B is adjacent to A”？  
3) **path（路径）**：给出“更严格/更好的定义”。  
4) 定义：cycle、acyclic、connected、strongly connected。

### 解题思路
- 这类题考的是“术语是否说得标准”，最好用课件措辞：**path 是 vertices 与 edges 交替序列**。

### 参考答案
1) $V$ 是顶点集合；$E$ 是边集合，且 $E\subseteq V\times V$。  
2) 若存在从 A 到 B 的边（有向边）则 B adjacent to A。  
3) Path：一个以顶点开始、以顶点结束的 **顶点与边交替序列**，且每条边与它前后两个顶点相 incident（相接）。若 A 到 B 有边，那么 “A, (A,B), B” 也是一个 path。  
4)  
- cycle：从某顶点出发又回到自身的 path。  
- acyclic：没有 cycle。  
- connected（无向图）：任意两点之间都有 path。  
- strongly connected（有向图）：任意两点 u,v 都同时存在 u→v 与 v→u 的 path。

---

## 练习 1：Graph ADT 读题（p17–p19）

### 题目
根据课件列出的 Graph ADT 方法，解释下面这些函数“返回什么/做什么”（用一句话即可）：
- `numVertices(), vertices(), numEdges(), edges()`
- `getEdge(u,v), endVertices(e), opposite(v,e)`
- `outDegree(v), inDegree(v), outgoingEdges(v), incomingEdges(v)`
- `insertVertex(x), insertEdge(u,v,x), removeVertex(v), removeEdge(e)`

### 解题思路
- 这题常考“是否理解 Graph 是 Vertex/Edge 的抽象对象”，特别是 `endVertices / opposite`。

### 参考答案（极简版）
- `numVertices/numEdges`：返回顶点/边数量  
- `vertices/edges`：返回遍历器（iteration）  
- `getEdge(u,v)`：返回从 u 到 v 的边（不存在返回 null）；无向图里 `getEdge(u,v)=getEdge(v,u)`  
- `endVertices(e)`：返回 e 的两个端点（有向图：第一个是 origin，第二个 destination）  
- `opposite(v,e)`：给定 incident 的 (v,e)，返回 e 的另一个端点  
- `outDegree/inDegree`：出边/入边数量（无向图两者相同）  
- `outgoingEdges/incomingEdges`：返回所有出边/入边集合的遍历器（无向图通常相同集合）  
- `insertVertex/insertEdge`：创建并插入新顶点/新边  
- `removeVertex/removeEdge`：删除顶点及其 incident 边 / 删除边

---

## 思考题 1：Adjacency Matrix 的缺点（p26）

### 题目
为什么 adjacency matrix 对 **sparse graph（稀疏图）**不友好？  
如果图的节点数会变化，matrix 为什么“不灵活”？

### 解题思路
- 从 **空间浪费** 与 **扫描邻居成本** 两个角度答。

### 参考答案
- 稀疏图：边很少但矩阵是 $n\times n$，大量 0 浪费空间；找某点邻居要扫整行 $O(n)$，即使只有少量 1 也得扫完。  
- 节点数变化：矩阵大小固定，扩容/缩容代价高且实现不灵活（尤其不知道最大节点数时）。

---

## 思考题 2：Adjacency List 表示法（p27–p28）

### 题目
Adjacency list 是什么？它通常用什么数据结构组织？

### 解题思路
- 一句话：每个顶点存一个“邻居列表”。

### 参考答案
- 对每个顶点维护其相邻顶点（或相邻边）的列表。  
- 可以：  
  - 维护一个 vertices list，每个 vertex 里带 adjacency list；或  
  - 用 Map（如 HashMap）把 vertex 映射到它的邻接列表。

---

## 练习 2：BFS（Breadth-First Search）— 从 A 开始（p36–p46）

### 题目（课件的 Exercise：What might we do?）
给定图（起点 A），用**队列**进行 BFS，写出：
1) 访问顺序（BFS order）  
2) 队列 Q 每一步的内容（按课件示例）

### 解题思路（BFS 模板）
- 把起点入队并标记 visited  
- 循环：出队一个 u，把 u 的所有未访问邻居按某顺序入队并标记  
- **BFS 的层次性**：离起点更近的点更早出现（但同层内顺序不唯一）

### 标准答案（课件示例给出的 BFS order）
- BFS order：**A, B, G, C, F, D, E**（课件说明：B 和 G 的先后不唯一）  

### 队列状态（与课件示例一致）
- 初始：`Q = {A}`
- 处理 A 后：`Q = {B, G}`
- 处理 B 后：`Q = {G, C, F}`
- 处理 G 后：`Q = {C, F}`
- 处理 C 后：`Q = {F, D, E}`
- 处理 F 后：`Q = {D, E}`
- 处理 D 后：`Q = {E}`
- 处理 E 后：`Q = {}`（结束）

---

## 练习 3：DFS（Depth-First Search）— 从 A 开始（p47–p62）

### 题目
给定同一张图，从 A 开始做 DFS（用**栈**），写出：
1) 访问顺序（DFS order）  
2) 栈 S 在关键步骤的变化（按课件示例）

### 解题思路（DFS 模板：peek + 尽可能往深处走）
- 栈顶 u 若还有未访问邻居 w → push(w)  
- 若没有未访问邻居 → pop(u)（回溯）
- DFS 的特点：会“dive（潜下去）”，先走到底再回退

### 标准答案（课件示例的 DFS order）
- DFS order：**A, B, C, D, E, F, G**（课件说明：B 和 G 的先后也不唯一）

### 栈状态（摘取课件示例的关键状态）
- `S={A}`
- `S={A,B}`
- `S={A,B,C}`
- `S={A,B,C,D}`
- 回溯（D 无未访问邻居）：`S={A,B,C}`
- 继续：`S={A,B,C,E}`
- `S={A,B,C,E,F}`
- `S={A,B,C,E,F,G}`
- 之后不断回溯直到 `S={}`

---

## 练习 4：用 DFS 检测有向图中的环（Cycle Detection）（p63–p72）

### 题目
课件给出思路：如果 DFS 过程中遇到“已经在栈上的顶点”，说明存在 cycle。  
要求：
1) 解释三色标记（white/grey/black）分别代表什么  
2) 写出“发现环”的判定条件  
3) 在课件示例中，指出发现环的那一步（哪个顶点遇到了哪个 grey 邻居）

### 解题思路
- grey = “在当前 DFS 路径上”（也就是“在栈里”）  
- 如果从当前顶点 u 看见一个 grey 邻居，就出现 back-edge → 形成有向环

### 标准答案
1)  
- white：未访问  
- grey：在栈上（当前 DFS 路径上）  
- black：已完成（从它出发能到的都探索完，已回溯）

2) 判定条件：  
- 当处理栈顶 u 时，若 u 存在 **grey 邻居** → **there is a cycle**

3) 课件示例中：  
- 在处理 **E** 时，发现它有一个 grey neighbour：**B** → “Found a loop!”（说明路径上已包含 B，再回到 B 形成环）

---

## 练习 5：BFS/DFS 的时间复杂度（Adjacency List）= $O(|V|+|E|)$（p73–p86）

### 题目
课件用 adjacency list 实现，并且对每个顶点维护一个指针/迭代器（避免每次都从邻接表头重新扫）。  
要求：
1) 解释为什么每个顶点最多入队/出队（或入栈/出栈）一次  
2) 解释为什么“扫描邻接表”的总代价是 $O(|E|)$  
3) 得出 BFS 和 DFS 的总复杂度

### 解题思路
- **顶点层面**：每个顶点只会第一次被标记 visited，然后不会再次入队/入栈 → 所以和 $|V|$ 成正比  
- **边层面**：每条边只会在扫描某个顶点的邻接表时被看一遍（总邻接表长度之和 = $|E|$）

### 标准答案
1) BFS：每个顶点最多 enqueue 一次、dequeue 一次；DFS：每个顶点最多 push 一次、pop 一次。  
2) adjacency list 中所有邻接表长度总和 = $|E|$（有向图正好是 $|E|$，无向图若存双向则是 $2|E|$，仍是 $O(|E|)$）。  
3) 所以 BFS 与 DFS：  
$$T = O(|V|) + O(|E|) = O(|V|+|E|).$$

### 小例子（课件的 v0..v3 示例）
邻接表：
- v0: {v1, v2}
- v1: {v3}
- v2: {v3}
- v3: {}

总扫描步数：$|V| + (2+1+1+0) = |V|+|E|$。

---

## 一页速记（考前 60 秒）

- 术语：adjacent / path / cycle / connected / strongly connected。  
- 实现：matrix（空间 $n^2$，找邻居扫行） vs list（稀疏图更省）。  
- BFS：queue，层层扩展；DFS：stack，尽量往深走再回溯。  
- 有向环检测：DFS 三色；**遇到 grey 邻居 = 有环**。  
- 复杂度（adjacency list）：BFS/DFS 都是 $O(|V|+|E|)$。

