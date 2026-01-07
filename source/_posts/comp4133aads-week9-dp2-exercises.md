---
title: "COMP4133AADS 练习复习：Week 9 Dynamic Programming 2（Knapsack / Matrix-Chain / LCS / Interval&Tree&Subset DP + MDP建模）— 含答案"
date: 2026-01-08 19:00:00
math: true
categories:
  - COMP4133AADS
  - 练习复习
keywords:
  - Dynamic Programming
  - Knapsack O(nW)
  - Matrix Chain Multiplication O(n^3)
  - Longest Common Subsequence (LCS) O(nm)
  - Interval DP
  - Tree DP (Maximum Independent Set)
  - Subset DP (TSP) O(n^2 2^n)
  - Bellman Equation
  - Value Iteration
  - Policy Iteration
---

# Week 9 练习题复习（Dynamic Programming 2）— 含答案与思路

> 覆盖两份课件：**DP Examples.pdf** + **DP2—.pdf（Modeling for DP：MDP / Bellman / VI / PI + TSP）**  
> 数学公式已按 **KaTeX** 语法：行内 `$...$`、独立公式 `$$...$$`。

---

## Part A — 一维 DP / 铺砖（DP Examples.pdf）

### Exercise 1 — 用 1、3、5 表示整数：求 $D_{10}$

**题目**：给定 $n$，用 $\{1,3,5\}$ 的和表示 $n$ 的不同方法数为 $D_n$（顺序不同算不同）。求 $D_{10}$。

**思路（标准 3 步）**  
1) **子问题**：$D_n$ 表示凑出 $n$ 的方法数。  
2) **递推**：最后一步可能加 $1$、$3$ 或 $5$：
$$
D_n = D_{n-1} + D_{n-3} + D_{n-5}.
$$
3) **边界**：$D_0=1$（“什么都不选”算 1 种方式）；对负数 $D_n=0$。

**计算表（$n=0..10$）**

| $n$ | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| $D_n$ | 1 | 1 | 1 | 2 | 3 | 5 | 8 | 12 | 19 | 30 | **47** |

**答案**：$\boxed{D_{10}=47}$。

---

### 思考题（Tri-tiling）— 为什么 $B_n$ 与 $E_n$ 总是 0？

课件在为 $3\times n$ 铺砖引入多个“缺口形状”的子问题时问：**为什么 $B_n$ 和 $E_n$ 始终为 0？**

**核心原因（用一句话记）**：  
> 这些形状对应的区域含有**奇数个格子**（或在黑白染色下黑白格数不等），而多米诺骨牌覆盖 2 个格子，故不可能铺满，计数恒为 0。

---

### Exercise 2 — $2\times n$ 多米诺铺法数

**题目**：求 $2\times n$ 网格用 $2\times 1$ 多米诺铺满的铺法数。

**思路**  
令 $T_n$ 为 $2\times n$ 的铺法数。看最后一列怎么铺：  
- 竖着放 1 块：剩 $2\times (n-1)$ → $T_{n-1}$  
- 横着放 2 块（占最后两列）：剩 $2\times (n-2)$ → $T_{n-2}$

**递推与边界**
$$
T_n = T_{n-1} + T_{n-2},\qquad T_0=1,\ T_1=1.
$$
所以 $T_n$ 就是斐波那契型（$T_n=F_{n+1}$，取 $F_0=0,F_1=1$）。

---

## Part B — 0/1 Knapsack（DP Examples.pdf）

### Exercise 3 — 0/1 背包：$W=5$ 的最优解

**题目**（课件给定）：

| Item | Weight | Value |
|---:|---:|---:|
| 1 | 2 | 3 |
| 2 | 3 | 4 |
| 3 | 4 | 5 |
| 4 | 5 | 6 |

最大承重 $W=5$，求最优选择。

**思路**  
定义：
$$
\mathrm{OPT}(i,w)=\text{在只看前 }i\text{ 个物品、容量 }w\text{ 下的最大价值}.
$$
转移（第 $i$ 件要/不要）：
$$
\mathrm{OPT}(i,w)=
\begin{cases}
\mathrm{OPT}(i-1,w), & w_i>w \\
\max\big(\mathrm{OPT}(i-1,w),\ \mathrm{OPT}(i-1,w-w_i)+v_i\big), & w_i\le w
\end{cases}
$$

**快速枚举（本题更快）**  
- 选 4：重 5，值 6  
- 选 1+2：重 $2+3=5$，值 $3+4=7$ ✅  
- 其他组合要么超重要么更小

**答案**：选 **{1,2}**，总价值 $\boxed{7}$。

---

## Part C — Matrix Chain Multiplication（DP Examples.pdf）

### 复习：矩阵乘法代价
若 $A$ 是 $d\times e$，$B$ 是 $e\times f$，则
- $A\cdot B$ 结果是 $d\times f$
- 标量乘法次数为 $d\cdot e\cdot f$

---

### Exercise 4 — 矩阵链乘（已给答案的那题）

**题目**：  
$A_1:30\times 2$，$A_2:2\times 40$，$A_3:40\times 10$，$A_4:10\times 25$。  
填 $N_{i,j}$（最少标量乘法次数）。

**思路（区间 DP 模板）**  
子问题：$N_{i,j}$ 表示 $A_i\cdots A_j$ 的最少代价。  
边界：$N_{i,i}=0$。  
转移：最后一次切分点 $k$：
$$
N_{i,j} = \min_{i\le k<j}\Big(N_{i,k} + N_{k+1,j} + d_i\, d_{k+1}\, d_{j+1}\Big),
$$
其中维度向量 $d=[30,2,40,10,25]$。

**答案表（与课件一致）**
- $N_{1,2}=30\cdot2\cdot40=2400$
- $N_{2,3}=2\cdot40\cdot10=800$
- $N_{3,4}=40\cdot10\cdot25=10000$
- $N_{1,3}=\min\{(N_{1,1}+N_{2,3}+30\cdot2\cdot10)=1400,\ (N_{1,2}+N_{3,3}+30\cdot40\cdot10)=14400\}=1400$
- $N_{2,4}=\min\{(N_{2,2}+N_{3,4}+2\cdot40\cdot25)=12000,\ (N_{2,3}+N_{4,4}+2\cdot10\cdot25)=1300\}=1300$
- $N_{1,4}=\min\{2800, 42400, 8900\}=2800$

**最优括号化**：$\boxed{A_1\cdot((A_2\cdot A_3)\cdot A_4)}$  
**最优代价**：$\boxed{2800}$。

---

### Exercise 5 — 矩阵链乘（你需要自己算的那题）

**题目**：  
$A_1:30\times 40$，$A_2:40\times 2$，$A_3:2\times 10$，$A_4:10\times 25$。

维度向量 $d=[30,40,2,10,25]$。

**直接对 5 种括号化算代价（考试最常用）**

1) $((A_1A_2)A_3)A_4$：
- $A_1A_2$: $30\cdot40\cdot2=2400$，得 $30\times2$
- $\cdot A_3$: $30\cdot2\cdot10=600$（累计 3000），得 $30\times10$
- $\cdot A_4$: $30\cdot10\cdot25=7500$（累计 10500）

2) $(A_1(A_2A_3))A_4$：$800 + 12000 + 7500 = 20300$

3) $(A_1A_2)(A_3A_4)$：
- $A_1A_2=2400$（得 $30\times2$）
- $A_3A_4=2\cdot10\cdot25=500$（得 $2\times25$）
- 相乘：$30\cdot2\cdot25=1500$
- 总计：$2400+500+1500=\boxed{4400}$

4) $A_1((A_2A_3)A_4)$：$800+10000+30000=40800$

5) $A_1(A_2(A_3A_4))$：$500+2000+30000=32500$

**答案**：最优是 $\boxed{(A_1A_2)(A_3A_4)}$，最少乘法次数 $\boxed{4400}$。

---

## Part D — Longest Common Subsequence（LCS）（DP Examples.pdf）

### LCS 核心转移（必须会写）
定义 $L[i][j]$：$X[0..j-1]$ 与 $Y[0..i-1]$ 的 LCS 长度（注意这里是“前缀长度”定义）。  
边界：$L[i][0]=0$、$L[0][j]=0$。  
转移：
$$
L[i][j]=
\begin{cases}
L[i-1][j-1]+1, & Y[i-1]=X[j-1] \\
\max\{L[i-1][j],\ L[i][j-1]\}, & Y[i-1]\ne X[j-1]
\end{cases}
$$
时间复杂度：$O(nm)$。

---

### Exercise 6 — 填 LCS 表

**题目**：  
$X=\texttt{CGATCGAT}$（长度 8）  
$Y=\texttt{CCGTA}$（长度 5）  
填出 $L$ 表。

**答案（完整 L 表，行是 $Y$，列是 $X$）**

```text
      ∅  C  G  A  T  C  G  A  T
  ∅ | 0  0  0  0  0  0  0  0  0
  C | 0  1  1  1  1  1  1  1  1
  C | 0  1  1  1  1  2  2  2  2
  G | 0  1  2  2  2  2  3  3  3
  T | 0  1  2  2  3  3  3  3  4
  A | 0  1  2  3  3  3  3  4  4
```

**结论**：$\boxed{\mathrm{LCS\ length}=L[5][8]=4}$。  
一个可行 LCS：$\boxed{\texttt{CCGT}}$（也可能得到别的长度为 4 的答案，例如 `CGTA`）。

---

### Exercise 7 — 显示字符串的 LCS 数组

**题目**：  
$X=\texttt{skullandbones}$  
$Y=\texttt{lullabybabies}$  
给出 LCS 数组 $L$。

**答案（完整 L 表，较大，用等宽文本给出）**

```text
      ∅  s  k  u  l  l  a  n  d  b  o  n  e  s
  ∅ | 0  0  0  0  0  0  0  0  0  0  0  0  0  0
  l | 0  0  0  0  1  1  1  1  1  1  1  1  1  1
  u | 0  0  0  1  1  1  1  1  1  1  1  1  1  1
  l | 0  0  0  1  2  2  2  2  2  2  2  2  2  2
  l | 0  0  0  1  2  3  3  3  3  3  3  3  3  3
  a | 0  0  0  1  2  3  4  4  4  4  4  4  4  4
  b | 0  0  0  1  2  3  4  4  4  5  5  5  5  5
  y | 0  0  0  1  2  3  4  4  4  5  5  5  5  5
  b | 0  0  0  1  2  3  4  4  4  5  5  5  5  5
  a | 0  0  0  1  2  3  4  4  4  5  5  5  5  5
  b | 0  0  0  1  2  3  4  4  4  5  5  5  5  5
  i | 0  0  0  1  2  3  4  4  4  5  5  5  5  5
  e | 0  0  0  1  2  3  4  4  4  5  5  5  6  6
  s | 0  1  1  1  2  3  4  4  4  5  5  5  6  7
```

**结论**：$\boxed{\mathrm{LCS\ length}=7}$。  
一个可行 LCS：$\boxed{\texttt{ullabes}}$。

---

## Part E — Interval DP：最少插入变回文（DP Examples.pdf）

### Exercise 8 — `banana` 最少插入几个字符变回文？

**题目**：给定字符串 `banana`，求最少插入多少字符使其变成回文串。

**思路 1：区间 DP（课件主方法）**  
令 $D[i][j]$：把子串 $s[i..j]$ 变回文的最少插入数。  
边界：$D[i][i]=0$。  
转移：
$$
D[i][j]=
\begin{cases}
D[i+1][j-1], & s_i=s_j \\
\min\{D[i+1][j],\ D[i][j-1]\}+1, & s_i\ne s_j
\end{cases}
$$
填表顺序：按区间长度递增（即按 $j-i$ 递增）。

**`banana` 的 $D$ 表（上三角）**

```text
i\j  0:b  1:a  2:n  3:a  4:n  5:a
0:b    0   1   2   1   2   1
1:a        0   1   0   1   0
2:n            0   1   0   1
3:a                0   1   0
4:n                    0   1
5:a                        0
```

**答案**：$\boxed{D[0][5]=1}$，最少插入 1 个字符。  
例如插入一个 `'b'` 得到回文：$\texttt{bananab}$。

**思路 2（课件提示的替代法）**：  
最少插入 $= n - \mathrm{LPS}$，其中 LPS 是最长回文子序列长度；  
而 $\mathrm{LPS}=\mathrm{LCS}(s, s^R)$。

---

## Part F — Tree DP：树上最大独立集（DP Examples.pdf）

### Exercise 9 — 尽量多染黑（相邻不能同黑）

**题目**：给定树，尽量多染黑节点，要求任意边两端不能同时黑。

**思路（课件的 $B_v/W_v$ 模板）**  
任选根 $r$。  
- $B_v$：以 $v$ 为根的子树中，**把 $v$ 染黑**时的最优黑点数  
- $W_v$：以 $v$ 为根的子树中，**不染黑 $v$**时的最优黑点数

转移：
$$
B_v = 1 + \sum_{u\in \mathrm{child}(v)} W_u,
\qquad
W_v = \sum_{u\in \mathrm{child}(v)} \max\{B_u, W_u\}.
$$
答案：$\max\{B_r,W_r\}$。

**把题目树（课件图）按层级命名（便于你复算）**  
- 根：$r$，孩子：$L,R$  
- $L$ 的孩子：$a,b,c,d$，其中 $c$ 有一个叶子孩子 $c_1$，$d$ 有两个叶子孩子 $d_1,d_2$  
- $R$ 的孩子：$e,f,g,h$，其中 $f$ 有两个叶子孩子 $f_1,f_2$，$g$ 有一个叶子孩子 $g_1$

**自底向上计算（叶子：$B=1,W=0$）**
- $c$: $B_c=1+W_{c_1}=1$，$W_c=\max(1,0)=1$
- $d$: $B_d=1$，$W_d=2$
- $f$: $B_f=1$，$W_f=2$
- $g$: $B_g=1$，$W_g=1$

再算：
- $B_L=1+0+0+W_c+W_d=4$，$W_L=1+1+\max(1,1)+\max(1,2)=5$
- $B_R=1+0+W_f+W_g+0=4$，$W_R=1+\max(1,2)+\max(1,1)+1=5$
- 根：
$$
B_r=1+W_L+W_R=11,\qquad W_r=\max(4,5)+\max(4,5)=10.
$$

**答案**：最多能染黑 $\boxed{11}$ 个节点（取 $B_r$）。

---

## Part G — Subset DP / MDP 建模与 VI/PI（DP2—.pdf）

> Week 9 的第二份课件更多是“把 DP 写成 Bellman 方程”的统一建模视角。

### 思考题 1 — Bellman 方程两种写法有什么区别？

**两种常见形式（课件给出）**

- **确定型即时收益** $f(i,a)$：
$$
V(i)=\operatorname{opt}_{a\in A(i)}\left(
f(i,a)+\gamma\sum_{j\in S}\pi(i,a,j)V(j)
\right).
$$

- **随机型即时收益** $h(i,a,j)$：
$$
V(i)=\operatorname{opt}_{a\in A(i)}\sum_{j\in S}\pi(i,a,j)\big(h(i,a,j)+\gamma V(j)\big).
$$

**要点**：$f(i,a)$ 是“选动作就确定”的即时收益；$h(i,a,j)$ 依赖落到的下一状态 $j$。它们在期望意义下可互相转换：
$$
f(i,a)=\mathbb{E}[h(i,a,j)]=\sum_{j\in S}\pi(i,a,j)\,h(i,a,j).
$$

---

### 思考题 2 — Value Iteration vs Policy Iteration 怎么区分？

**Value Iteration（VI）**：反复应用最优算子 $T$：
$$
V_{k+1} = TV_k,
\quad
[TV](i)=\operatorname{opt}_a\sum_j \pi(i,a,j)\big(h(i,a,j)+\gamma V(j)\big).
$$

**Policy Iteration（PI）**：交替做  
1) Policy Evaluation（固定策略 $\mu$，求 $V^\mu$）  
2) Policy Improvement（对 $V^\mu$ 贪心改进策略）

**一句话记**：  
- VI：直接逼近 $V^*$（不显式存策略，最后再用 $\arg\min/\arg\max$ 抽策略）  
- PI：显式维护策略 $\mu$，并反复“评估→改进”

---

### Exercise 10 — TSP（3 城市）用子集 DP / VI 得最优路线

**题目（课件）**：3 城市 A、B、C（从 A 出发并回到 A）。代价矩阵：

| From \ To | A | B | C |
|---|---:|---:|---:|
| A | 0 | 2 | 5 |
| B | 3 | 0 | 1 |
| C | 4 | 6 | 0 |

求最小总代价的 tour。

**思路：子集 DP（也等价于 VI 的“确定转移、无折扣”情形）**  
状态：$(v,S)$ 表示“当前在 $v$，已访问集合 $S$”。  
用 bitmask 表示集合（3 城市：A=0,B=1,C=2）：
- 终止：访问完所有城市后回到 A
- 递推：
$$
D[S,v]=\min_{u\in S\setminus\{v\}}\big(D[S\setminus\{v\},u] + w(u,v)\big)
$$
并在最后加上回到起点的代价。

**直接算（3 城市可以枚举两条 tour）**  
- $A\to B\to C\to A$: $2+1+4=\boxed{7}$ ✅  
- $A\to C\to B\to A$: $5+6+3=14$

**答案**：最优路线 $\boxed{A\to B\to C\to A}$，总代价 $\boxed{7}$。

---

## 考试“快速模板”小抄（把 DP 写出来就能拿分）

- **定义子问题**（状态变量是啥？）  
- **写转移**（最后一步/最后一次切分/最后一个字符/最后一个动作）  
- **边界**（空串、单元素、容量为 0、$i=j$）  
- **填表顺序**（按 $i$、按 $j$、按区间长度、按子集大小）  
- **复杂度**（常见：LCS $O(nm)$、矩阵链 $O(n^3)$、背包 $O(nW)$、子集 DP $O(n^2 2^n)$）
