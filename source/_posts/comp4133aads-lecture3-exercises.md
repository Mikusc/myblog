---
title: "COMP4133AADS 课程练习复习：Lecture 3 Binary Search Trees（含答案）"
date: 2026-01-08 19:00:00
math: true
categories:
  - COMP4133AADS
  - 练习复习
keywords:
  - Sorted Map ADT
  - Binary Search Tree
  - Inorder Traversal
  - BST Search/Insert/Delete
  - Balanced Tree
  - Tree Height
---

# Lecture 3 练习题复习（Binary Search Trees）— 含答案与思路

> 本讲核心：**Sorted Map ADT**（有序映射接口）+ **BST（二叉搜索树）**（性质、搜索、插入、删除）+ 为什么需要 **Self-Balancing**（为 AVL/红黑树做铺垫）。  
> 刷题建议：**BST性质判断 → inorder遍历输出 → “为什么要平衡”与“如何重建平衡”**。

---

## 练习 1：判断是否是 BST（例题 A）（Slide 29）

**题目：**Is this a binary search tree?

给定树（关键节点）：

```
        6
      /   \
     2     9
    / \   /
   1   4  8
```

### 解题思路（判 BST 的套路）
BST 的全局约束不是“只看父子”，而是：
- **左子树所有 key < 根 key**
- **右子树所有 key > 根 key**
- 递归对每个子树都成立

### 标准答案
✅ **是 BST**。  
理由：
- 左子树 {1,2,4} 都 < 6；右子树 {8,9} 都 > 6  
- 在节点 2：左 1 < 2，右 4 > 2  
- 在节点 9：左 8 < 9（且 8 > 6 也满足“在 6 的右子树”）

---

## 练习 2：判断是否是 BST（例题 B）（Slide 30）

**题目：**Is this a binary search tree?

给定树（关键节点）：

```
        6
      /   \
     2     9
    / \   /
   1   7  8
```

### 解题思路（抓“全局违规点”）
只要出现一个节点落在**错误的祖先范围**，就不是 BST。  
例如：在根 6 的**左子树**中出现了 `7`（>6），就立刻违规。

### 标准答案
❌ **不是 BST**。  
理由：节点 `7` 在 6 的左子树里，但 `7 > 6`，违反 BST 性质。

---

## 练习 3：Inorder Traversal 定义 + 输出（Slide 33）

**题目：**
1) What is an inorder traversal of a tree?  
2) Exercise: what does an inorder traversal of the following search tree produce?

树与练习 1 的结构一致：

```
        6
      /   \
     2     9
    / \   /
   1   4  8
```

### 解题思路
- **Inorder（中序）**：Left → Visit → Right  
- 对 BST 有一个关键性质：  
  **BST 的 inorder 输出一定是升序（in increasing order）**

### 标准答案
1) inorder 定义：先访问左子树，再访问根，再访问右子树（Left-Root-Right）。  
2) inorder 输出序列：  
\[
1,\; 2,\; 4,\; 6,\; 8,\; 9
\]

---

## 思考题 1：很不平衡的 BST 是否总能对应一个平衡 BST？（Slide 44）

**题目：**
- Suppose you have a very imbalanced search tree. Is there always a corresponding balanced search tree?

### 解题思路
“对应”指的是：**包含同一组 keys** 的 BST。  
BST 的形状不是唯一的：同一组 keys 可以对应很多不同结构的 BST。

### 标准答案
✅ **总是存在**。  
理由：对任意一组 keys，把它们排序后，总能用“取中位数作根、递归构造左右子树”的方式构造出高度尽量小（接近平衡）的 BST。

---

## 练习 4：把给定的极度不平衡 BST 变成平衡 BST（Slide 44）

**题目：**Exercise (online): find a balanced tree for（给定的树）

给定不平衡 BST（右斜）包含 keys：`{3, 5, 7, 8, 9}`。

### 解题思路（最常用：选中位数做根）
1) 排序（本身已排序）：`3, 5, 7, 8, 9`
2) 选中位数 `7` 做根
3) 左边 `{3,5}` 构成左子树，右边 `{8,9}` 构成右子树
4) 子问题继续选中位数

### 参考答案（满足 BST 且高度较小的一种）
```
        7
      /   \
     5     8
    /       \
   3         9
```

> 说明：平衡树通常不唯一；只要保持 BST 性质并让高度明显降低即可。

---

## 思考题 2：为什么“任意节点数都能有平衡树”？如何从一棵树得到平衡树？（Slide 45）

**题目：**
- For any number of nodes, there is a balanced tree. Why?
- How to get a balanced tree given a binary tree?

### 解题思路
- “平衡”本质是**高度尽量小**（接近 \(\log n\)）
- 构造法：**按层填充**或**按中位数递归构造**

### 参考答案（考试写法）
**Why（为什么总存在）**  
- 对任意 \(n\)，总能构造一个高度最小/接近平衡的二叉树形状（例如尽量按层填满）。
- 若是 BST：对 keys 排序后用“中位数递归”能得到高度 \(O(\log n)\) 的 BST。

**How（怎么从现有树得到平衡树）**（常考“说流程”）
- 如果是 **BST**：  
  1) inorder 遍历得到升序 keys（或 entries）列表（\(O(n)\)）  
  2) 用“中位数递归”从有序列表**直接构建**平衡 BST（\(O(n)\)）
- 如果是一般二叉树（不要求 BST 性质）：  
  - 可以先收集所有节点，再按“尽量按层填满”的方式重连指针，得到更平衡的形状（核心思想同样是让高度变小）。

---

## 思考题 3：Total rebuild（整体重建）平衡 BST 的时间复杂度？（Slide 46）

**题目：**
- Could balance a tree by a “total rebuild”
  - Just placing the keys into a new tree in the correct order
  - What the time complexity of it?

### 解题思路（关键：你说清楚“怎么 rebuild”）
总复杂度 =（取出 keys）+（构建新树）

### 参考答案（两种常见口径，写一种并说明假设即可）
**口径 A：直接从有序数组递归建树（推荐写法）**  
- inorder 得到有序 keys：\(O(n)\)  
- 递归“中位数建树”：每个节点建一次：\(O(n)\)  
- **总计：\(O(n)\)**

**口径 B：用 insert 一个个插入到新 BST（要说明）**  
- 若每次插入都保持平衡（理想）：每次 \(O(\log n)\)，共 \(n\) 次 → **\(O(n\log n)\)**  
- 若插入顺序不当（如升序插入）：会退化 → **最坏 \(O(n^2)\)**

> 考试最稳：写 **\(O(n)\)**（inorder + 递归建树），并补一句“如果用 repeated insert，则可能是 \(O(n\log n)\)”。

---

## 一页速记（考前 60 秒）

- BST 性质：左子树全小于根，右子树全大于根（是“全局范围约束”）。
- inorder（左-根-右）：对 BST 输出一定是**升序**。
- 搜索/插入/删除：时间 \(O(h)\)，h 是树高；最坏退化链表 \(h=n\)。
- 平衡的意义：让 \(h\approx \log n\)，从而保证操作接近 \(O(\log n)\)。
- “总重建”平衡：inorder 取出 keys + 中位数递归建树（通常 \(O(n)\)）。

