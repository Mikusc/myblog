---
title: "COMP4133AADS 课程练习复习：Lecture 4 AVL Trees（含答案）"
date: 2026-01-08 19:00:00
math: true
categories:
  - COMP4133AADS
  - 练习复习
keywords:
  - AVL Tree
  - Height-Balance Property
  - Rotation
  - Trinode Restructuring
  - AVL Insert
  - AVL Delete
  - Complexity Proof
---

# Lecture 4 练习题复习（AVL Trees）— 含答案与思路

> 本讲核心：AVL 定义（高度平衡）+ **rotation / trinode restructuring** + 插入/删除后的 rebalance 规则 + 复杂度（高度 $O(\log n)$）。  
> 课件来源：Lecture 4 *AVLTrees_.pdf*（Balanced Search Trees & AVL Trees）。  

---

## 练习 1：旋转（Rotation）的作用是什么？（p4–p6）

### 题目（理解题）
1) 什么是 rotation？  
2) rotation 为什么能在**保持 BST 性质**的同时改变形状？  
3) rotation 对子树 $T_1,T_2,T_3$ 中节点深度的影响是什么？

### 解题思路
- rotation 本质：把“孩子”提到“父亲”上面（局部重连指针）。  
- BST 性质依赖**中序顺序**不变；rotation 只在局部交换父子关系，并保持 $T_1 < X < T_2 < Y < T_3$ 的相对顺序。

### 参考答案
- rotation：将某节点的子节点上提为新的根（局部），原根下沉为其孩子。  
- 保持 BST：因为节点的**中序（left-root-right）顺序不变**，仍满足左小右大。  
- 深度变化：被“提上去”的节点深度减少 1；被“压下去”的节点深度增加 1；两侧子树（如 $T_1,T_3$）整体深度会相应 ±1（课件 p6 提示你观察变化）。

---

## 练习 2：三节点重构 Trinode Restructuring 的算法理解（p7–p8）

### 题目
给定三代节点 $x$（孙）、$y$（父）、$z$（祖父），以及四棵子树 $T_1..T_4$。  
解释 **restructure(x)** 的关键步骤，并说明它等价于“单旋/双旋”。

### 解题思路（抓住“排序 + 重新拼装”）
- 把 $x,y,z$ 按 inorder 排序成 $(a,b,c)$（从小到大）。  
- 把四棵子树也按 inorder 顺序排成 $(T_1,T_2,T_3,T_4)$。  
- 让 **b 做新的局部根**，a 做左孩子（挂 $T_1,T_2$），c 做右孩子（挂 $T_3,T_4$）。

### 参考答案（按课件算法写即可）
- Step1：令 $(a,b,c)$ 为 $x,y,z$ 的 inorder 排序；令 $(T_1,T_2,T_3,T_4)$ 为四个子树的 inorder 排序。  
- Step2：用以 $b$ 为根的新子树替换原来以 $z$ 为根的子树。  
- Step3：令 $a$ 为 $b$ 的左孩子，并把 $T_1,T_2$ 挂到 $a$ 的左右。  
- Step4：令 $c$ 为 $b$ 的右孩子，并把 $T_3,T_4$ 挂到 $c$ 的左右。  
- 为什么等价于旋转：四种形态（LL/RR → 单旋；LR/RL → 双旋）都能用这一套“排序+拼装”统一处理。

---

## 自学题 1：证明 AVL 树高度是 $O(\log n)$（p19 + p34）

### 题目
Proposition: The height of an AVL tree storing $n$ entries is $O(\log n)$.  
Self-study: How to prove it? Write down your proof.

### 解题思路（最小节点数递推）
设 $n(h)$ 为**高度为 $h$** 的 AVL 树所需的**最少内部节点数**。  
AVL 的最“瘦”形态：一边高度 $h-1$，另一边高度 $h-2$。

### 标准证明（写到这个程度就能拿分）
- 基例：$n(1)=1,\; n(2)=2$。  
- 对 $h>2$：AVL 根的两棵子树高度分别至少为 $h-1$ 与 $h-2$，因此  
  $$
  n(h)=1+n(h-1)+n(h-2).
  $$
- 因为 $n(h-1) > n(h-2)$，有
  $$
  n(h)=1+n(h-1)+n(h-2) > 2n(h-2).
  $$
  迭代得到 $n(h) > 2^{i} n(h-2i)$。取 $i=\lfloor h/2 \rfloor - 1$ 回到基例，可得
  $$
  n(h) > 2^{h/2-1}.
  $$
- 取对数：
  $$
  h < 2\log_2 n(h) + 2 \;\Rightarrow\; h = O(\log n).
  $$

> 记忆点：**AVL 的“最瘦”形态像 Fibonacci**，所以高度是对数级。

---

## 思考题 1：AVL 树的子树还是 AVL 吗？（p20）

### 题目
Is a subtree of an AVL tree an AVL tree?

### 解题思路
AVL 定义：对每个内部节点，高度差 $\le 1$。  
若从 AVL 树中取任意节点作为根的子树，这个子树里每个节点仍然满足同样的约束。

### 标准答案
✅ **是。**  
理由：AVL 的高度平衡性质对整棵树的每个内部节点都成立；子树只是其中一部分节点集合，约束仍对其内部所有节点成立。

---

## 练习 3：AVL 插入后的 rebalance 规则（p22–p24）

### 题目（流程题）
插入一个新 key 后：
1) 哪些节点的高度可能改变？  
2) 如何选择 $z,y,x$？  
3) 为什么只需要在 $z$ 处做一次 trinode restructuring 就能全局恢复平衡？

### 解题思路（考试最常考的“套路”）
- 只有从插入叶子 $p$ 到根的路径可能高度变化。  
- $z$：从 $p$ 往上遇到的第一个 **unbalanced** 节点。  
- $y$：$z$ 的更高的孩子；$x$：$y$ 的更高的孩子。  
- restructure(x) 之后，局部子树高度会恢复到插入前的高度（或不再增加），所以不会继续把失衡“传上去”。

### 标准答案（写成要点即可）
1) 可能改变的只有路径 $p \rightarrow \text{root}$ 上的祖先节点。  
2) $z$：路径上第一个失衡节点；$y$：$z$ 的高子树根；$x$：$y$ 的高子树根。  
3) restructure 在 $z$ 局部把三代节点重排，使得该局部重新满足高度平衡，并且该局部子树的高度不再导致更高祖先失衡，因此全局恢复（课件明确说该重构能“restore globally”）。

---

## 练习 4：形式化论证插入过程正确性（p25）

### 题目
Exercise: Formally argue the correctness of the insertion process.

### 解题思路（给你一个可直接背的“证明模板”）
要证明“正确”，通常分两块：
1) **BST 性质保持**（key 的相对大小不被破坏）  
2) **AVL 平衡恢复**（所有节点的高度差 $\le 1$）

### 参考答案（考试可直接写）
- BST 性质：插入阶段与普通 BST 插入相同（只在外部节点处扩展），不会破坏中序顺序；重平衡使用 rotation/trinode restructuring，而 restructuring 通过 inorder 排序 $(a,b,c)$ 与子树 $(T_1..T_4)$ 重新连接，**保持 inorder 顺序不变**，因此 BST 性质保持。  
- AVL 平衡：插入只可能使从新叶 $p$ 到根路径上的节点高度增加 1。令 $z$ 为该路径上第一个失衡节点，则 $z$ 的失衡形态必落在 $x,y,z$ 形成的 4 种局部结构之一。对 $z$ 执行 restructure(x) 后，局部恢复高度平衡；并且该局部子树的高度恢复为插入前的高度（或高度不再继续增加），因此不会导致更高祖先出现新的失衡。故一次重构即可恢复全局 AVL 性质。

---

## 练习 5：AVL 删除后的 rebalance（含“aligned”规则）（p27–p30）

### 题目
删除后从节点 $w$（被结构删除节点的父亲）往上：
1) 如何选择 $z,y,x$？  
2) 当 $y$ 的两个孩子高度相同，为什么要选择与 $y$ “aligned” 的那个孩子作为 $x$？  
3) 为什么删除可能需要一路检查到根？

### 解题思路
- 删除可能让某个子树高度**减少**，从而让祖先节点失衡；并且一次重构后，新的高度变化仍可能继续向上传播。  
- “aligned” 规则是为了避免选错 $x$ 造成局部重构后仍可能产生更糟的高度配置（课件 p29 用“problem”示意）。

### 标准答案
1) 令 $z$ 为从 $w$ 往上遇到的第一个失衡节点；$y$ 为 $z$ 的更高孩子；  
  - 若 $y$ 的一个孩子更高：令 $x$ 为更高孩子；  
  - 若两孩子等高：令 $x$ 为与 $y$ 同侧（aligned）的孩子（即 $y$ 是左孩子则选左；$y$ 是右孩子则选右）。  
2) aligned 的原因：当两边等高时，选择 aligned 能保证重构后高度变化符合 AVL 删除的正确性要求；若选不 aligned，可能得到课件 p29 圈出的“problem”形态（局部重构后导致不符合预期的高度/结构）。  
3) 删除可能让某次重构后子树高度继续减少，进而使更高祖先失衡，因此必须继续向上检查直到根（课件 p30–p31 明确写“must continue checking ... until root”）。

---

## 练习 6：AVL 性能总结（p33）

### 题目（记忆题）
写出 AVL 的空间与三种操作复杂度，并说明为什么。

### 标准答案（按课件）
- 空间：$O(n)$  
- 搜索：$O(\log n)$（高度 $O(\log n)$，无需重构）  
- 插入：$O(\log n)$：先查找插入位置 $O(\log n)$，之后最多一次重构 $O(1)$（维护高度也是 $O(1)$）  
- 删除：$O(\log n)$：先定位 $O(\log n)$，之后可能沿路径多次重构，总计 $O(\log n)$

---

## 一页速记（考前 60 秒）

- AVL 定义：任意节点左右子树高度差 $\le 1$。  
- 插入：找第一个失衡 $z$，取高孩子 $y$，再取高孩子 $x$，做 restructure(x)，通常只需一次。  
- 删除：从 $w$ 往上找失衡 $z$，同样选 $y,x$；若 $y$ 两边等高，**选 aligned 的孩子**；可能一路重构到根。  
- 高度证明：最小节点数递推 $n(h)=1+n(h-1)+n(h-2)\Rightarrow h=O(\log n)$。  
- 复杂度：search/insert/delete 都是 $O(\log n)$，空间 $O(n)$。

