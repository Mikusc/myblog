---
title: "COMP4133AADS 练习复习：Week 8 Dynamic Programming 1（Shortest Path DP + MDP/VI/PI + TSP）— 含答案"
date: 2026-01-08 19:00:00
math: true
categories:
  - COMP4133AADS
  - 练习复习
keywords:
  - Dynamic Programming
  - Shortest Path
  - Backward DP
  - Forward DP
  - MDP
  - Bellman Equation
  - Bellman Operator
  - Value Iteration
  - Policy Iteration
  - Policy Evaluation
  - TSP
  - Bitmask
---

# Week 8 练习题复习（Dynamic Programming 1）— 含答案与思路

> 覆盖两份课件：**DP1_.pdf（Shortest Path DP）** + **DP2_.pdf（Modeling for DP：MDP / Bellman / VI / PI + TSP）**  
> 数学公式已按 **KaTeX** 语法：行内 `$...$`、独立公式 `$$...$$`。

---

## Part A — Shortest Path Problem by Dynamic Programming（DP1_.pdf）

### 图与边权（课件示例网络）
有向图顶点 $\{0,1,2,3,4,5,6,7\}$，终点为 7。边与成本如下：

- $0\to 1:7$, $0\to 2:6$
- $1\to 4:1$, $1\to 3:2$
- $2\to 3:4$, $2\to 5:7$
- $3\to 4:3$, $3\to 6:1$, $3\to 5:2$
- $5\to 6:1$, $5\to 7:5$
- $6\to 7:8$
- $4\to 7:10$

---

### Exercise 1 — 写出 Successor / Predecessor 集合 $S_i, B_i$

**题目**  
对任意节点 $i$，定义  
- $S_i = \{ j \in \mathcal N \mid (i,j)\in \mathcal A \}$（立即后继）  
- $B_i = \{ j \in \mathcal N \mid (j,i)\in \mathcal A \}$（立即前驱）  

(1) 写出 $S_3$ 与 $B_3$  
(2) 写出所有节点的 $S_i$

**思路**  
- 看“从 i 出去”的箭头就是 $S_i$  
- 看“指向 i”的箭头就是 $B_i$

**答案**  
1)  
- $S_3 = \{4,5,6\}$  
- $B_3 = \{1,2\}$  

2) 全部 $S_i$：  
- $S_0=\{1,2\}$  
- $S_1=\{3,4\}$  
- $S_2=\{3,5\}$  
- $S_3=\{4,5,6\}$  
- $S_4=\{7\}$  
- $S_5=\{6,7\}$  
- $S_6=\{7\}$  
- $S_7=\varnothing$

---

### Exercise 2 — Backward DP：计算所有 $V_i$ 并给出最短路

**题目**  
定义 $V_i$ 为从节点 $i$ 到终点 7 的最短路径长度。写出递推并计算所有 $V_i$，最后给出从 0 到 7 的最短路径与长度。

**思路（Backward DP 模板）**  
- 终止条件：$V_7 = 0$  
- 递推式（Bellman 型）：
$$
V_i = \min_{j\in S_i}\{c_{ij}+V_j\},\quad \forall i
$$
- 本图是 DAG，可从终点往前逐层 label 计算

**答案（逐步计算）**  
- $V_7=0$  
- $V_4=10+V_7=10$  
- $V_6=8+V_7=8$  
- $V_5=\min\{1+V_6,\;5+V_7\}=\min\{9,5\}=5$  
- $V_3=\min\{3+V_4,\;1+V_6,\;2+V_5\}=\min\{13,9,7\}=7$  
- $V_1=\min\{1+V_4,\;2+V_3\}=\min\{11,9\}=9$  
- $V_2=\min\{4+V_3,\;7+V_5\}=\min\{11,12\}=11$  
- $V_0=\min\{7+V_1,\;6+V_2\}=\min\{16,17\}=16$

**最短距离**  
$$
V_0 = 16
$$

**最短路径（回溯 argmin）**  
$0\to 1\to 3\to 5\to 7$（总成本 16）。

---

### Exercise 3 — Forward DP：计算 $F_j$ 并验证与 Backward 一致

**题目**  
定义 $F_j$ 为从起点 0 到节点 $j$ 的最短路径长度。写出递推并计算 $F_1..F_7$。

**思路（Forward DP 模板）**  
- 初始条件：$F_0=0$  
- 递推式：
$$
F_j = \min_{i\in B_j}\{F_i + c_{ij}\},\quad \forall j
$$
- 按拓扑序从小到大 label 计算

**答案**  
- $F_0=0$  
- $F_1=0+7=7$  
- $F_2=0+6=6$  
- $F_3=\min\{F_1+2,\;F_2+4\}=\min\{9,10\}=9$  
- $F_4=\min\{F_1+1,\;F_3+3\}=\min\{8,12\}=8$  
- $F_5=\min\{F_2+7,\;F_3+2\}=\min\{13,11\}=11$  
- $F_6=\min\{F_3+1,\;F_5+1\}=\min\{10,12\}=10$  
- $F_7=\min\{F_4+10,\;F_5+5,\;F_6+8\}=\min\{18,16,18\}=16$

**验证**  
$$
F_7 = 16 \quad \text{与 Backward 的 } V_0=16 \text{一致}
$$

---

### Exercise 4 — 思考题：为什么“纯 Greedy”可能错？

**题目**  
如果在每个节点都只走“当前最短边”（myopic greedy），是否一定得到最短路径？用本图举例说明。

**答案（用本图构造反例）**  
贪心会倾向于：$0\to2$（6）$\to3$（4）$\to6$（1）$\to7$（8），总成本 $6+4+1+8=19$。  
而最优是 $0\to1\to3\to5\to7$，成本 16。  
所以 **纯 Greedy 不保证最优**；DP 的关键是把“未来的 cost-to-go”用 $V_j$ 一起算进去。

---

## Part B — Modeling for Dynamic Programming（DP2_.pdf）

### Exercise 5 — MDP 基本元素辨认（Inventory 例子）

**题目（课件例）**  
需求 $d\in\{0,1,2\}$，概率分别为 $0.1,0.7,0.2$；最大库存为 2。  
(1) 写出状态空间 $S$  
(2) 写出动作集合 $A(i)$（每个状态可订货量）  
(3) 解释“为什么用转移矩阵 $\Pi(a)$ 方便”

**答案**  
1) $S=\{0,1,2\}$（库存水平）  
2)  
- $A(0)=\{0,1,2\}$  
- $A(1)=\{0,1\}$  
- $A(2)=\{0\}$  
3) 用矩阵 $\Pi(a)$：把 “选动作 $a$ 后从各状态到各状态的概率” 统一写成一个矩阵，方便做线性代数推导（如 $V=t+\gamma\Pi V$）、也方便程序实现。

---

### Exercise 6 — 读懂 $\Pi(a)$：算一个转移概率（Inventory）

**题目**  
假设当前库存为 0，订货动作 $a=2$（订 2 件），需求随机 $d\in\{0,1,2\}$。  
(1) 下一状态 $s'$ 可能是什么？  
(2) 分别给出 $P(s'=2)$、$P(s'=1)$、$P(s'=0)$。

**思路**  
订货后库存变为 2，再被需求消耗：$s' = \max(2-d,0)$。

**答案**  
- 若 $d=0$（0.1），$s'=2$  
- 若 $d=1$（0.7），$s'=1$  
- 若 $d=2$（0.2），$s'=0$  
因此：$P(2)=0.1$，$P(1)=0.7$，$P(0)=0.2$。

---

### Exercise 7 — Bellman Equation 两种形式 + 互相转换

**题目**  
解释两种即时项写法：  
1) 即时收益/成本只依赖 $(i,a)$：$f(i,a)$  
2) 即时收益/成本依赖 $(i,a,j)$：$h(i,a,j)$  
并写出它们的关系。

**答案**  
形式 1（用 $f$）：  
$$
V(i)=\operatorname{opt}_{a\in A(i)}\Big(f(i,a)+\gamma\sum_{j\in S}\pi(i,a,j)V(j)\Big)
$$

形式 2（用 $h$）：  
$$
V(i)=\operatorname{opt}_{a\in A(i)}\sum_{j\in S}\pi(i,a,j)\big(h(i,a,j)+\gamma V(j)\big)
$$

关系（期望）：  
$$
f(i,a)=\sum_{j\in S}\pi(i,a,j)\,h(i,a,j)
$$

---

### Exercise 8 — Bellman Operator：$T$ 与 $T_\mu$ 是什么？（概念题）

**题目**  
课件中把 Bellman 更新写成算子形式：$V\mapsto TV$。  
(1) 写出 $[TV](i)$ 的定义  
(2) 写出固定策略 $\mu$ 下 $[T_\mu V](i)$ 的定义  
(3) 用一句话说出：Value Iteration / Policy Iteration 分别在“迭代什么”。

**答案**  
1) 最优算子 $T$：  
$$
[TV](i)=\operatorname{opt}_{a\in A(i)}\Big(f(i,a)+\gamma\sum_{j\in S}\pi(i,a,j)V(j)\Big)
$$
2) 固定策略算子 $T_\mu$：  
$$
[T_\mu V](i)=f(i,\mu(i))+\gamma\sum_{j\in S}\pi(i,\mu(i),j)V(j)
$$
3)  
- Value Iteration：反复做 $V^{(k+1)}=TV^{(k)}$（逼近 $V^*$）  
- Policy Iteration：反复做 **Policy Evaluation**（求 $V_\mu$）+ **Policy Improvement**（用 $V_\mu$ 改进策略）

---

### Exercise 9 — 1-state MDP：求 $V^*$ 与 $V^\mu$（课件例）

**题目（课件 1-state 示例）**  
- 状态：Home（1 个）  
- 动作：$a_1=Read,\;a_2=Watch\ TV$  
- 转移：必回到 Home（概率 1）  
- 即时奖励：$h(i,a_1,i)=2,\;h(i,a_2,i)=3$  
- 折扣因子：$\gamma=0.5$  
(1) 求最优 $V^*(i)$  
(2) 若策略 $\mu$ 总选 Read，求 $V^\mu(i)$

**答案**  
1)  
$$
V^*(i)=\max\{2+0.5V^*(i),\;3+0.5V^*(i)\}=3+0.5V^*(i)
$$
$$
V^*(i)=6
$$
2)  
$$
V^\mu(i)=2+0.5V^\mu(i)\Rightarrow V^\mu(i)=4
$$

---

### Exercise 10 — Value Iteration：从 $V^{(0)}=0$ 开始做 3 轮（1-state）

**题目**  
从 $V^{(0)}(i)=0$ 开始，算 $V^{(1)},V^{(2)},V^{(3)}$，看是否向 6 收敛。

**答案**  
最优动作恒为 Watch TV：  
$$
V^{(k+1)}(i)=3+0.5V^{(k)}(i)
$$
- $V^{(1)}=3$  
- $V^{(2)}=4.5$  
- $V^{(3)}=5.25$  
收敛到 6（算子在 $\gamma<1$ 时是 contraction）。

---

### Exercise 11 — Policy Evaluation：线性系统 $(I-\gamma\Pi_\mu)V_\mu=t_\mu$

**题目**  
从固定策略 Bellman 方程推导线性系统，并用 1-state（总 Read）验证。

**答案**  
固定策略：  
$$
V_\mu(i)=f(i,\mu(i))+\gamma\sum_{j\in S}\pi(i,\mu(i),j)V_\mu(j)
$$
移项得：  
$$
(I-\gamma\Pi_\mu)V_\mu=t_\mu
$$
1-state：$I=[1],\Pi_\mu=[1],t_\mu=[2]$：  
$$
(1-0.5)V_\mu=2\Rightarrow V_\mu=4
$$

---

## Part C — TSP as an Episodic DP（DP2_.pdf）

### Exercise 12 — TSP（3 城市）求最优 tour 与最小成本（课件 Question）

**题目（课件给定成本矩阵）**  
从 A 出发，访问 A,B,C 各一次并回到 A。成本矩阵：

| From \ To | A | B | C |
|---|---:|---:|---:|
| A | 0 | 2 | 5 |
| B | 3 | 0 | 1 |
| C | 4 | 6 | 0 |

求最优 tour 与最小成本。

**思路（3 城市可直接枚举，也可用 DP 状态）**  
从 A 出发只有两种不同 tour：  
- A→B→C→A  
- A→C→B→A

**答案**  
- A→B→C→A：$2+1+4=7$  
- A→C→B→A：$5+6+3=14$  
最优：**A→B→C→A，最小成本 $=7$**。

---

### Exercise 13 — Bitmask：为什么 $0b111=7$？如何更新 mask？（课件题）

**题目**  
(1) 解释 $0b111$ 为什么代表“三城都访问过”，它对应十进制多少？  
(2) 城市编号 A=0,B=1,C=2，当前 mask 为 $0b001$（只访问过 A），下一站去 B，新的 mask 是多少？  
(3) 给出一般终止 mask 公式。

**答案**  
1) $0b111=1\cdot2^2+1\cdot2^1+1\cdot2^0=7$。每一位为 1 表示对应城市已访问。  
2) 更新规则：`newMask = mask | (1 << nextCity)`  
   $$0b001\;|\;(1\ll 1)=0b001\;|\;0b010=0b011$$  
3) 若共有 $n$ 个城市，则终止 mask：  
$$
\text{TERMINAL\_MASK}=(1\ll n)-1
$$

---

### Exercise 14 — 思考题：为什么 VI 里“没有显式的 $\pi$（policy）”？

**题目（课件 Why No Explicit π?）**  
Value Iteration 在更新时只算 $V$，看起来没有直接输出策略 $\mu$。为什么？

**答案**  
Value Iteration 先求 $V^*$（值函数固定点），策略是 **事后**从 $V^*$ 用 greedy 得到：  
$$
\mu^*(i)=\arg\min_{a\in A(i)}\Big(f(i,a)+\gamma\sum_j\pi(i,a,j)V^*(j)\Big)
$$
也就是说：VI “隐式地”在靠近最优策略，但先把最优价值算准，再从价值反推出策略。

---

## 一页速记（考前 60 秒）

- Backward DP（最短路）：
$$
V_7=0,\quad V_i=\min_{j\in S_i}(c_{ij}+V_j)
$$

- Forward DP（最短路）：
$$
F_0=0,\quad F_j=\min_{i\in B_j}(F_i+c_{ij})
$$

- Bellman Optimality（MDP）：
$$
V(i)=\operatorname{opt}_{a\in A(i)}\Big(f(i,a)+\gamma\sum_{j\in S}\pi(i,a,j)V(j)\Big)
$$

- Value Iteration：$V^{(k+1)}=TV^{(k)}$（$\gamma<1$ 时收敛到 $V^*$）  
- Policy Iteration：Policy Evaluation（解线性系统） + Policy Improvement（greedy 改进）  
- TSP 状态常写：$(current, visitedMask)$，终止 mask：$(1\ll n)-1$

---
