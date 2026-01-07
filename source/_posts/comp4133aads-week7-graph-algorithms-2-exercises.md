---
title: "COMP4133AADS 练习复习：Week 7 Graph Algorithms 2（Topological Sort, MST, Dijkstra）— 含答案"
date: 2026-01-08 19:00:00
math: true
categories:
  - COMP4133AADS
  - 练习复习
keywords:
  - Topological Sort
  - Minimum Spanning Tree
  - Prim
  - Greedy Algorithm
  - Dijkstra
  - Shortest Path
  - Graph Algorithms
---

# Week 7 练习题复习（Graph Algorithms 2）— 含答案与思路

> 本讲核心：Topological Sort、Minimum Spanning Tree (Prim)、Greedy Counterexample、Dijkstra Shortest Path。  
> **考点方向**：判环、cut property、Prim 追踪步骤、Dijkstra 的正确性与复杂度推导。

---

## 1. Topological Sort（拓扑排序）

### Exercise 1 — Topological Sort 的输出（“造房子”例子）
**题目（课件例）**  
给出一组任务（形成 DAG），输出一个合法拓扑序。

**参考答案**
- **Foundations → Walls → Roof → Windows → Plumbing → Decorating**

**思路**  
拓扑序定义：若有边 $(u \to v)$，则 $u$ 在 $v$ 之前。DAG 中一定存在至少一个入度为 0 的节点。

---

### Exercise 2 — 若图中存在环
**题目**  
If we run topological sort on a cyclic graph, what happens?

**答案**
- 算法无法输出所有顶点（最终剩下的节点入度 $> 0$）  
- 若输出节点数 $< |V|$，则说明 **图有环**

**思路**  
Kahn 算法在每轮删除入度为 0 的节点；若无可删节点则说明有环。

---

## 2. Minimum Spanning Tree (MST)

### Exercise 3 — 求 MST（课件例）
顶点：$A,B,C,D,E$，权重如下：  
$w(A,B)=8$, $w(A,E)=10$, $w(A,C)=12$, $w(B,C)=6$, $w(C,D)=3$, $w(C,E)=6$, $w(D,E)=6$。

**答案**
选边：
- $(C,D)=3$
- $(B,C)=6$
- $(C,E)=6$
- $(A,B)=8$

总代价：
$$
3 + 6 + 6 + 8 = 23
$$

**思路**  
挑最小权且不成环的 4 条边即可（因为 $|V|-1$ 条边构成生成树）。

---

### Exercise 4 — Prim 算法追踪
从 $A$ 开始，每次挑跨越 cut 的最小权边。

| 步骤 | 当前 $S$ | 候选边（跨越 cut） | 选取边 | $S$ 更新 |
|------|----------|-------------------|--------|----------|
| 0 | $\{A\}$ | $(A,B)=8,(A,E)=10,(A,C)=12$ | $(A,B)=8$ | $\{A,B\}$ |
| 1 | $\{A,B\}$ | $(B,C)=6,(A,E)=10,(A,C)=12$ | $(B,C)=6$ | $\{A,B,C\}$ |
| 2 | $\{A,B,C\}$ | $(C,D)=3,(C,E)=6,(A,E)=10$ | $(C,D)=3$ | $\{A,B,C,D\}$ |
| 3 | $\{A,B,C,D\}$ | $(C,E)=6$ 或 $(D,E)=6$ | 任选其一（如 $(C,E)=6$） | $\{A,B,C,D,E\}$ |

总权重仍为 23。

**思路（Prim 的 cut property）**  
Prim 每一步只从跨越 cut $(S, V\setminus S)$ 的边里选最小权边：  
- 一定不会成环（每次拉进一个新顶点）  
- 由 cut property 保证最终得到 MST

---

### Exercise 5 — 思考题：边权互异时 MST 唯一。Why?
**题目**  
Let $G$ be a weighted connected graph. If all weights are distinct then the minimum spanning tree is unique. Why?

**答案**
- 若所有边权互不相同，则任意 cut 的最小跨边都是唯一的；任何 MST 必须包含它。  
- 所有“被强制包含”的边共同决定了一棵唯一的 MST。

**思路（Cut Property + 反证）**  
若某个 MST 不包含某个 cut 的唯一最小跨边 $e$，则它必包含另一条跨边 $f$ 且 $w(f) > w(e)$。用 $e$ 替换 $f$ 可得到更小权重生成树，矛盾。

---

## 3. Greedy Algorithm（贪心反例）

### Exercise 6 — 硬币找零
硬币面值为 $\{4,3,1\}$，凑金额 7。  
贪心策略：每次选不超过剩余金额的最大面值。

**答案**
- 贪心结果：$7 \to 4$（剩 3）$\to 1$（剩 2）$\to 1$（剩 1）$\to 1$（剩 0）  
  得到 $4+1+1+1$，共 **4 枚**  
- 最优结果：$4+3$，共 **2 枚**  
因此该贪心 **不是最优**。

**思路**
贪心只保证局部最优，并不保证全局最优；必须证明（如交换论证/结构性质）才可靠。

---

## 4. Dijkstra Shortest Path（非负权最短路）

> Dijkstra 适用前提：所有边权非负，即 $w(e) \ge 0$。

### Exercise 7 — 路径与距离
边权：$w(A,B)=10$, $w(A,C)=2$, $w(C,D)=2$, $w(D,B)=2$。  

**答案**
最短路径：$A \to C \to D \to B$  
最短距离：
$$
2 + 2 + 2 = 6
$$
比直接边 $A \to B$ 的 10 更小。

---

### Exercise 8 — 为什么 Dijkstra 正确？
**题目**  
So, why is Dijkstra’s algorithm optimal (gives the shortest path)?

**答案（核心结论）**  
当顶点 $u$ 被 extract-min（从优先队列取出当前最小 $dist$ 的未确定点）时，$dist[u]$ 已经是从源点到 $u$ 的最短距离，之后不会再被减小。

**思路（不变式 / 反证）**  
假设存在更短路径到 $u$，必经过某个未确定点 $x$。由于边权非负，走到 $x$ 的距离不可能小于当前队列里最小的 $dist[u]$，再从 $x$ 到 $u$ 只会增加距离，矛盾。

---

### Exercise 9 — 如何返回“路径”而不仅是距离？
**答案**
加入前驱数组（或 map）$prev[v]$：当 relax 边 $(u,v)$ 成功更新 $dist[v]$ 时，设
$$
prev[v] = u
$$
最后从终点 $t$ 反向回溯 $t \to prev[t] \to \cdots \to s$，再反转即可得到路径。

---

## 一页速记（考前 60 秒）

- Topological Sort：只适用于 DAG；若输出顶点数 $< |V|$ 则有环  
- Prim：每次选 cut 上最小跨边；保证无环；构造 MST  
- MST 唯一：边权互异 $\Rightarrow$ MST 唯一  
- 贪心：未必最优；硬币找零是经典反例  
- Dijkstra：非负权；extract-min 后点的最短距离固定；常见复杂度
$$
O\big((|V|+|E|)\log |V|\big)
$$

---
