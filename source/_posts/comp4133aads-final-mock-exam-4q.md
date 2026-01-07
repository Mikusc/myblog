---
title: "COMP4133AADS 期末模拟卷：最可能的 4 道大题（含题型模板 + 仿真题 + 标准答案）"
date: 2026-01-08 19:30:00
math: true
categories:
  - COMP4133AADS
  - 期末复习
  - 模拟卷
keywords:
  - Big-O
  - Primitive Operations
  - Hash Tables
  - Collision Handling
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
  - Boyer-Moore
  - KMP
  - Trie
---

# COMP4133AADS 期末模拟卷（4 题必做）— 含模板与标准答案

> 使用方式：  
> - **先看每题的“模板速写区”**（背下来）  
> - 再做“仿真题”限时（建议每题 25 分钟）  
> - 对照标准答案，检查：**步骤是否完整、表格是否写清、复杂度是否给对**。  
> - 无计算器训练：所有数字都选为手算友好。

---

## Question 1 (25 marks) — Big-O + Hash Tables / Map ADT

### A. 模板速写区（考前 60 秒）
- Big-O 定义：存在 $c>0,n_0$ 使 $f(n)\le c g(n)$ 对所有 $n\ge n_0$ 成立  
- 计数循环：写 $T(n)$（可用求和），再化简成 $O(\cdot)$  
- Hash：$\alpha=n/N$；冲突处理三种：chaining / linear probing / double hashing  
- Linear probing：$h(k),h(k)+1,\dots$  
- Double hashing：$h(k)+i h_2(k)\pmod N$  
- 平均 vs 最坏：平均常写 $O(1)$（依赖 $\alpha$），最坏 $O(n)$

---

### B. 仿真题（25 marks）

#### (1) Big-O 证明（6 marks）
证明 $f(n)=2n+10$ 是 $O(n)$，给出一组可行的 $c$ 与 $n_0$。

**标准答案（示例写法）**  
当 $n\ge 10$，有 $10\le n$，因此
$$
2n+10\le 2n+n=3n
$$
取 $c=3,n_0=10$，则对所有 $n\ge 10$，$f(n)\le c\,n$ 成立，所以 $2n+10=O(n)$。

---

#### (2) Primitive operations / 循环复杂度（6 marks）
考虑伪代码：

```text
count = 0
for i = 1..n:
  j = 1
  while j <= n:
    count++
    j = 2*j
```

1) 写出 while 循环执行次数（用 $\log_2 n$ 表示）  
2) 写出总复杂度 Big-O

**标准答案**  
- while 中 $j$ 每次翻倍：$1,2,4,\dots$，执行次数为 $\lfloor \log_2 n \rfloor+1$  
- 外层 for 执行 $n$ 次，所以总次数：
$$
T(n)=n(\lfloor \log_2 n \rfloor+1)=O(n\log n)
$$

---

#### (3) Hash table（Linear probing）（7 marks）
表大小 $N=11$，哈希函数 $h(k)=k\bmod 11$。按顺序插入 keys：
$$
[21,\ 32,\ 43,\ 54,\ 65,\ 76]
$$
使用 **linear probing**，写出最终哈希表（下标 0..10）。

**标准答案（逐步）**  
- 21→10 放 10  
- 32→10 冲突，探测 0 放 0  
- 43→10 冲突，10/0 占，探测 1 放 1  
- 54→10 冲突，探测 2 放 2  
- 65→10 冲突，探测 3 放 3  
- 76→10 冲突，探测 4 放 4  

最终表（未填处为空）：

| idx | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---:|---|---|---|---|---|---|---|---|---|---|---|
| key | 32 | 43 | 54 | 65 | 76 |  |  |  |  |  | 21 |

---

#### (4) Hash table（Double hashing）（6 marks）
同样 $N=11$、$h(k)=k\bmod 11$，二次哈希：
$$h_2(k)=1+(k\bmod 5)$$
插入 keys $[21,32,43,54,65,76]$，写出最终表。

**标准答案（关键步）**  
先算 $h_2$：  
- 21: $1+(1)=2$  
- 32: $1+(2)=3$  
- 43: $1+(3)=4$  
- 54: $1+(4)=5$  
- 65: $1+(0)=1$  
- 76: $1+(1)=2$

插入：
- 21→10 放 10  
- 32→10 冲突，步长 3：探测 $(10+3)=2$ 放 2  
- 43→10 冲突，步长 4：探测 $(10+4)=3$ 放 3  
- 54→10 冲突，步长 5：探测 $(10+5)=4$ 放 4  
- 65→10 冲突，步长 1：探测 0 放 0  
- 76→10 冲突，步长 2：探测 1 放 1  

最终表：

| idx | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---:|---|---|---|---|---|---|---|---|---|---|---|
| key | 65 | 76 | 32 | 43 | 54 |  |  |  |  |  | 21 |

---

## Question 2 (25 marks) — BST + AVL (Rotations / Trinode restructuring)

### A. 模板速写区
- BST 性质：left < node < right  
- BST delete 三种情况：0/1/2 个孩子；两孩子用 inorder successor（右子树最小）  
- AVL：$|h_L-h_R|\le 1$  
- 插入后：找第一个失衡点 $z$，取 $y$（更高子树根）、$x$（更高子树根），做 LL/RR/LR/RL  
- AVL 时间：$O(\log n)$

---

### B. 仿真题（25 marks）

#### (1) BST 构建与查询（8 marks）
按顺序插入 keys：
$$
[50,\ 30,\ 70,\ 20,\ 40,\ 60,\ 80]
$$
1) 画出 BST  
2) 查找 key=60 的访问路径（写出依次比较的节点）

**标准答案**  
BST（ASCII）：
```
        50
      /    \
    30      70
   / \     / \
 20  40   60  80
```
查找 60：50 → 70 → 60（找到）

---

#### (2) BST 删除（两孩子）（7 marks）
在上题 BST 中删除 key=30。  
1) 写出 inorder successor 是谁  
2) 画出删除后的 BST

**标准答案**  
- key=30 的右子树最小节点是 40，因此 successor=40  
- 用 40 替换 30，再删除原来的 40（叶子）

结果：
```
        50
      /    \
    40      70
   /       / \
 20      60  80
```

---

#### (3) AVL 插入与旋转（10 marks）
从空 AVL 树开始插入：
$$
[30,\ 20,\ 10,\ 25,\ 27]
$$
要求：每次插入后如果需要重平衡，指出属于 LL/RR/LR/RL，并画出最终 AVL。

**标准答案（关键旋转点）**  
- 插 30,20,10：在 30 处失衡（LL），右旋 30：
```
    20
   /  \
 10   30
```
- 插 25：成为 30 的左孩子（仍平衡）
- 插 27：插到 25 右边，导致 30 处失衡（LR：z=30，y=25，x=27）
  - 先左旋 25，再右旋 30

最终 AVL：
```
      20
     /  \
   10    27
        /  \
      25    30
```

---

## Question 3 (25 marks) — Graph Algorithms (BFS/DFS/Topo/MST/Dijkstra)

### A. 模板速写区
- 邻接表遍历复杂度：$O(|V|+|E|)$  
- BFS：Queue；DFS：Stack/递归  
- Topo sort：DAG；若输出 < |V| 则有环  
- Prim：每次选跨 cut 的最小边加入（无环）  
- Dijkstra：非负权；extract-min 后 dist 固定；维护 `prev[]` 可回溯路径

---

### B. 仿真题（25 marks）

#### (1) BFS / DFS（10 marks）
给无向图 $G$，顶点 $\{A,B,C,D,E,F\}$，边：
$$
\{(A,B),(A,C),(B,D),(B,E),(C,F),(E,F)\}
$$
邻居访问顺序按字母序。

1) 从 A 开始的 BFS 访问顺序  
2) 从 A 开始的 DFS 访问顺序（递归 DFS）

**标准答案**  
- BFS（层序）：A, B, C, D, E, F  
  - A 入队；出 A 入 B,C；出 B 入 D,E；出 C 入 F；其余已发现  
- DFS（字母序递归）：A → B → D → (回) → E → F → C  
  访问序列：A, B, D, E, F, C

---

#### (2) Topological sort（5 marks）
给有向图（DAG）顶点 $\{1,2,3,4,5\}$，边：
$$
1\to 2,\ 1\to 3,\ 3\to 4,\ 2\to 4,\ 4\to 5
$$
写出一个合法拓扑序。

**标准答案（举例即可）**  
- 1, 2, 3, 4, 5  
或 1, 3, 2, 4, 5（都合法）

---

#### (3) Prim 求 MST（5 marks）
无向加权图顶点 $\{A,B,C,D\}$，边权：
- AB=1, AC=4, AD=3, BC=2, BD=5, CD=6  
从 A 开始 Prim，写出选边顺序与总权重。

**标准答案**  
- 初始 S={A}：选 AB=1  
- S={A,B}：候选 BC=2, AD=3, AC=4, BD=5 → 选 BC=2  
- S={A,B,C}：候选 AD=3, AC=4, BD=5, CD=6 → 选 AD=3  
MST 边：AB, BC, AD；总权重 $1+2+3=6$。

---

#### (4) Dijkstra（5 marks）
有向非负权图，顶点 $\{S,A,B,C,T\}$，边：
- S→A:2, S→B:5  
- A→B:1, A→C:2  
- B→C:3, B→T:6  
- C→T:1  
从 S 做 Dijkstra，给出到 T 的最短距离与一条最短路径。

**标准答案**  
- S→A=2  
- S→A→B=3（比 5 更小）  
- S→A→C=4  
- 到 T：S→A→C→T = 2+2+1 = 5  
最短距离 5；路径 S-A-C-T。

---

## Question 4 (25 marks) — Dynamic Programming + String Indexing (BM/KMP/Trie)

### A. 模板速写区
- DP 三要素：子问题定义 + 最优子结构 + 重叠  
- DP 答题必须写：状态、递推、初始、顺序、答案位置（可回溯）  
- 0/1 Knapsack：
$$
dp[i][w]=\max(dp[i-1][w],\ dp[i-1][w-w_i]+v_i)
$$
- Matrix chain：
$$
m[i][j]=\min_{k}(m[i][k]+m[k+1][j]+p_{i-1}p_kp_j)
$$
- BM：last-occurrence 表；KMP：failure 表；Trie：standard/compressed/suffix（会画）

---

### B. 仿真题（25 marks）

#### (1) 0/1 Knapsack（12 marks）
容量 $W=7$，3 个物品（重量 $w_i$，价值 $v_i$）：
- 物品1：$w_1=3,v_1=4$
- 物品2：$w_2=4,v_2=5$
- 物品3：$w_3=2,v_3=3$

1) 写出 $dp[i][w]$ 含义  
2) 填出 $i=0..3$、$w=0..7$ 的 DP 表  
3) 写最优价值与选取的物品

**标准答案**  
1) $dp[i][w]$：用前 $i$ 个物品、容量为 $w$ 的最大价值。  
2) 表（只给关键结果行，考试可画表格填满）：

- $dp[0][w]=0$  
- $i=1$（物品1:3,4）：
  - $w<3$：0；$w\ge3$：4  
- $i=2$（物品2:4,5）：
  - $dp[2][4]=5$  
  - $dp[2][7]=\max(dp[1][7]=4,\ dp[1][3]+5=9)=9$  
- $i=3$（物品3:2,3）：
  - $dp[3][7]=\max(dp[2][7]=9,\ dp[2][5]+3)$  
    而 $dp[2][5]=5$，所以 $dp[3][7]=\max(9,8)=9$

结论：最优价值 **9**。  
3) 回溯：来自 $dp[2][3]+5$，因此选物品2（4,5）和物品1（3,4），总重 7，总值 9。

---

#### (2) Matrix Chain Product（8 marks）
矩阵维度：$A_1(10\times 30)$，$A_2(30\times 5)$，$A_3(5\times 60)$。  
1) 计算最少标量乘法次数  
2) 给出最优括号化

**标准答案**  
两种括号：
- $(A_1A_2)A_3$：
  - $A_1A_2$：$10\cdot30\cdot5=1500$，结果 $10\times5$  
  - 再乘 $A_3$：$10\cdot5\cdot60=3000$  
  - 总 $4500$
- $A_1(A_2A_3)$：
  - $A_2A_3$：$30\cdot5\cdot60=9000$，结果 $30\times60$  
  - 再乘 $A_1$：$10\cdot30\cdot60=18000$  
  - 总 $27000$

最少次数：**4500**；最优括号：**$(A_1A_2)A_3$**。

---

#### (3) KMP failure function + 一次匹配（5 marks）
Pattern $P=\texttt{abbab}$  
1) 写出 failure function $f(k)$（$k=0..4$）  
2) Text $T=\texttt{abbaabbab}$ 中第一次出现的位置（起始下标）

**标准答案**  
1) $P= a b b a b$：
| k | 0 | 1 | 2 | 3 | 4 |
|---:|---:|---:|---:|---:|---:|
| f(k) | 0 | 0 | 0 | 1 | 2 |

2) 在 $T$ 中第一次匹配起始下标为 **4**（$T[4..8]=\texttt{abbab}$）。

---

## 附：评分提醒（写答案时最容易丢分的点）
- Big-O 证明必须写出 **$c,n_0$**（只写“显然”容易扣分）  
- Hash / Prim / Dijkstra 必须写“步骤”（只写最终结果常拿不到满分）  
- BST/AVL 必须画出“前后结构”（旋转类型写明 LL/LR/RL/RR）  
- DP 必须写：状态含义 + 递推 + base cases（只写最终数字不够）  
- BM/KMP 必须给出表（last-occurrence 或 failure）  

---
