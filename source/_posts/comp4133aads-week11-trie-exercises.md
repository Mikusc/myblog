---
title: "COMP4133AADS 练习复习：Week 11 Trie（Standard / Compressed / Suffix Trie）— 含答案"
date: 2026-01-08 19:00:00
math: true
categories:
  - COMP4133AADS
  - 练习复习
keywords:
  - Trie
  - Standard Trie
  - Compressed Trie
  - Suffix Trie
  - Prefix Matching
  - Pattern Matching
  - Complexity O(m)
---

# Week 11 练习题复习（Trie）— 含答案与思路

> 资料来源：Week 11 **Trie.pdf**。本文件只整理 **PDF 中出现的“问题标题（What/Why）”与 Exercise 1–3**，并补全解题思路与标准答案。  
> KaTeX：行内 `$...$`、独立 `$$...$$`。

---

## 思考题 0：What is trie?（p3）

### 题目
What is trie?

### 思路
用一句“定义 + 用途”回答即可（课件强调 *pre-indexing* 与 *fast pattern matching*）。

### 参考答案
Trie（字典树/前缀树）是一种**树形**数据结构，用来存储一组字符串（或一段文本中的所有单词），通过把公共前缀共享来支持：
- **Pattern matching / word matching**
- **Prefix matching（前缀查询）**

---

## 思考题 1：Why we need trie?（p4）

### 题目
Why we need trie?

### 思路
对比 Week10：BM/KMP 是“预处理 pattern”；Trie 是“预处理 text”。

### 参考答案
需要 Trie 的原因（课件要点）：
- 预处理（pre-indexing）可以加速匹配  
  - BM：预处理 Pattern 得到 last-occurrence  
  - KMP：预处理 Pattern 得到 failure function  
- Trie：**预处理 Text**（把文本中出现的所有单词建成 trie），从而加速  
  - 单词匹配（word matching）  
  - 前缀匹配（prefix search）  
- 应用：information retrieval（信息检索）

---

## 练习 1：构建 Standard Trie（p7）

### 题目
Build the standard trie for:
$$
S=\{a,\; trie,\; is,\; tree,\; based,\; data,\; structure,\; for,\; storing,\; strings\}
$$

> 标准 trie 规则（课件 p5）：  
> - 根结点不带字符；其他节点带字符  
> - children 按字母序（alphabetical order）  
> - 从根到叶（external node）的路径拼起来得到集合中的字符串  
> - 这里用 `•` 表示“单词结束（terminal）”

---

### 解题思路
1) 先按首字母分组：`a / b / d / f / i / s / t`  
2) 同前缀共享：例如 `storing/strings/structure` 共享 `st`  
3) 每个单词末尾标记 `•`（否则 `a` 和 `am...` 这类会混淆）

---

### 参考答案（ASCII 标准 Trie）
```
(root)
├─ a •
├─ b
│  └─ a └─ s └─ e └─ d •
├─ d
│  └─ a └─ t └─ a •
├─ f
│  └─ o └─ r •
├─ i
│  └─ s •
├─ s
│  └─ t
│     ├─ o └─ r └─ i └─ n └─ g •          (storing)
│     └─ r
│        ├─ i └─ n └─ g └─ s •            (strings)
│        └─ u └─ c └─ t └─ u └─ r └─ e •  (structure)
└─ t
   └─ r
      ├─ i └─ e •                         (trie)
      └─ e └─ e •                         (tree)
```

> 检查点：  
> - `storing / strings / structure` 的公共前缀是 `st`，再分叉 `o...` 与 `r...`。  
> - `trie / tree` 的公共前缀是 `tr`，再分叉 `i...` 与 `e...`。

---

## 思考题 2：Standard trie 的复杂度（p8–p9）

### 题目
课件给出：标准 trie 空间 $O(n)$，操作时间 $O(dm)$。解释 $n,d,m$ 的含义，并说明如何把搜索优化到 $O(m)$。

### 参考答案
- $n$：集合 $S$ 中所有字符串长度的总和（total size）  
- $m$：要操作/查询的字符串参数长度  
- $d$：字母表大小（alphabet size）

标准 trie 每访问一个节点要找“下一个字符对应的孩子”：
- 若孩子用有序数组/列表存，可能要扫 $O(d)$  
- 若每个节点用二分/映射，能到 $O(\log d)$ 或 $O(1)$  
- 常见实现：每个节点维护 `HashMap<char, child>`，则搜索通常为：
$$
O(m)
$$

---

## 练习 2：构建 Compressed Trie（p12）

### 题目
Build the compressed trie for:
$$
S=\{a,\; trie,\; is,\; tree,\; based,\; data,\; structure,\; for,\; storing,\; strings\}
$$

> Compressed trie 定义（课件 p11）：把“只有一个孩子的内部节点”与孩子合并，使**所有内部节点至少有两个孩子**。边允许用字符串作为 label。

---

### 解题思路
- 先画出标准 trie（练习 1）  
- 从根向下把所有“单链（single-child chain）”压缩成一条边  
- 分叉点（degree ≥ 2）保留为节点

---

### 参考答案（ASCII 压缩 Trie）
```
(root)
├─ "a" •
├─ "based" •
├─ "data" •
├─ "for" •
├─ "is" •
├─ "st"                         (分叉点)
│   ├─ "oring" •                => storing
│   └─ "r"                      (分叉点)
│      ├─ "ings" •              => strings
│      └─ "ucture" •            => structure
└─ "tr"                         (分叉点)
   ├─ "ie" •                    => trie
   └─ "ee" •                    => tree
```

---

## 思考题 3：Word matching with a trie（p10）

### 题目
课件图示：把文本中的 words 插入 trie。每个 leaf 关联一个 word，并在 leaf 存该 word 在文本中出现的起始 index（例如 “see” 在 0 与 24 位置出现）。  
为什么这样能支持快速 word matching？查询复杂度大概是多少？

### 参考答案
- 因为 trie 共享前缀，查询一个长度为 $m$ 的单词只需沿边走（最多访问 $m+1$ 个节点）  
- 若每个节点用 hash/map 找孩子，典型查询复杂度：
$$
O(m)
$$
- leaf 里存的 index 列表可以直接返回该单词所有出现位置（information retrieval 的常见做法）。

---

## 练习 3：构建 Suffix Trie（p15）

### 题目
Build the suffix trie for **“amalgamation”**.

> 课件提示（p13）：在末尾加 `$`，可保证“没有一个 suffix 是另一个 suffix 的前缀”。  
> 所以这里构建 $X=\texttt{amalgamation}\$ 的 suffix trie（用压缩边 label 的方式写，类似课件示例）。

---

### 解题思路（标准套路）
1) 写出所有后缀（suffixes）：$X[i..]$  
2) 把这些 suffix 全部插入 trie  
3) 若画“compressed suffix trie”，就把单链压缩成字符串边（更好写）

---

### Step 1：列出所有 suffix（加 `$`）
令 $X=\texttt{amalgamation}\$$（长度 13，包括 `$`），则后缀集合：

| 起点 i | suffix |
|---:|---|
| 0 | amalgamation$ |
| 1 | malgamation$ |
| 2 | algamation$ |
| 3 | lgamation$ |
| 4 | gamation$ |
| 5 | amation$ |
| 6 | mation$ |
| 7 | ation$ |
| 8 | tion$ |
| 9 | ion$ |
| 10 | on$ |
| 11 | n$ |
| 12 | $ |

---

### 参考答案（Compressed Suffix Trie，用字符串做边 label）
> 说明：这是“压缩后”的 suffix trie（便于在 md 中展示）。每个叶子对应一个 suffix。

```
(root)
├─ "$" •
├─ "a"                               (多个 suffix 以 a 开头)
│  ├─ "lgamation$" •                 => algamation$
│  ├─ "tion$" •                      => ation$
│  └─ "ma"                            (共享前缀 "ama")
│     ├─ "lgamation$" •              => amalgamation$
│     └─ "tion$" •                   => amation$
├─ "ma"                               (多个 suffix 以 "ma" 开头)
│  ├─ "lgamation$" •                 => malgamation$
│  └─ "tion$" •                      => mation$
├─ "lgamation$" •                    => lgamation$
├─ "gamation$" •                     => gamation$
├─ "tion$" •                         => tion$
├─ "ion$" •                          => ion$
├─ "on$" •                           => on$
└─ "n$" •                            => n$
```

---

## 思考题 4：Using a suffix trie 做 substring 查询的复杂度（p14）

### 题目
如何用 suffix trie 判断模式串 $P$ 是否是文本 $T$ 的子串？时间复杂度是多少？

### 参考答案
把 $T$ 的所有后缀建成 suffix trie。  
判断 $P$ 是否为子串：从根出发沿着 $P$ 的字符尝试走一条路径：
- 若能走完 $P$（路径存在），则 $P$ 是 $T$ 的 substring  
- 若中途断开，则不是

时间复杂度（课件结论）：
$$
O(m)
$$
其中 $m=|P|$。

---

## 一页速记（考前 60 秒）

- Standard trie：共享前缀；查找/插入/删除 $O(dm)$，用 hash/map 可到典型 $O(m)$  
- Compressed trie：消灭 single-child internal node；边可标字符串  
- Suffix trie：存 $T$ 的所有后缀（通常加 `$`）；substring 查询 $O(|P|)$  
- Leaf 常存：该词在文本中出现的位置 index（信息检索）

---
