---
title: "COMP4133AADS 课程练习复习：Lecture 2 Maps & Hash Tables"
date: 2026-01-08 19:00:00
math: true
categories:
  - COMP4133AADS
  - 练习复习
keywords:
  - Map ADT
  - Hash Table
  - Hash Function
  - Collision Handling
  - Linear Probing
  - Double Hashing
---

# Lecture 2 练习题复习（Maps & Hash Tables）

> 本讲核心：Map ADT（接口与复杂度）+ Hash Table 实现（哈希函数设计、压缩函数、冲突处理：链地址 / 线性探测 / 双哈希）  
> 建议刷题顺序：**Map 操作追踪 → 哈希函数思考题 → 线性探测（插入/查找/删除）→ 双哈希（为何要素数表长 + 计算探测序列）**。

---

## 练习 0：Map ADT 操作追踪（Lecture2 p7）

**题目（按顺序执行操作，填 Output，并写出每一步 Map 的内容）：**

| Operation | Output | Map（key→value） |
|---|---|---|
| `isEmpty()` |  |  |
| `put(5, A)` |  |  |
| `put(7, B)` |  |  |
| `put(2, C)` |  |  |
| `put(8, D)` |  |  |
| `put(2, E)` |  |  |
| `get(7)` |  |  |
| `get(4)` |  |  |
| `get(2)` |  |  |
| `size()` |  |  |
| `remove(5)` |  |  |
| `remove(2)` |  |  |
| `get(2)` |  |  |
| `isEmpty()` |  |  |

**复习要点 / 得分点：**
- `put(k,v)`：若 key 不存在，返回 `null`；若 key 已存在，**替换 value** 并返回旧值。
- `get(k)`：不存在返回 `null`。
- `remove(k)`：不存在返回 `null`；存在则删除并返回旧值。
- 这题常用来考你**是否真正理解 Map ADT 语义**（不是考 Hash）。

---

## 思考题 1：为什么把 hash function 拆成 hash code + compression function？（Lecture2 p22）

**题目：**  
What is the advantage of separating the hash function into two components, namely, hash code and compression function? Why?

**答题要点（写 3~5 点即可）：**
- **职责分离**：`h1`（hash code）把任意类型 key 变成整数；`h2`（compression）把整数映射到 `[0, N-1]`。
- **可复用性**：同一个 `h1` 可以配不同表长 `N` 的 `h2`；扩容/rehash 时主要改 `h2` 或 `N`。
- **更易优化分布**：针对 key 类型改 `h1`（字符串用多项式累积等），针对表长/范围改 `h2`（mod / MAD）。
- **工程实现方便**：语言/对象自带 `hashCode()`（`h1`）+ 自己实现压缩（`h2`）。

---

## 思考题 2：为什么要“disperse”（分散）？为什么要“random”（看起来随机）？（Lecture2 p23）

**题目：**
- Why disperse?
- Why random?

**答题要点：**
- 分散：减少 collision（碰撞），让桶/槽位利用更均匀 → 操作更接近 **O(1) expected**。
- 随机（“apparently random”）：避免 key 的规律性导致聚集（clustering），例如很多 key 有相同后缀/模式时仍能均匀分布。
- 本质目标：让每个槽位被命中的概率尽量接近 `1/N`。

---

## 自测 1：为什么 table size 选素数更好？（Lecture2 p27–28）

**题目（根据课件例子解释）：**
- hash codes 形成序列：`100, 105, 110, 115, ...`
- 若 `N=10`（非素数）会发生什么？  
- 若 `N=11`（素数）会发生什么？  
- 用 `gcd(m, d)` 的结论解释：什么时候能遍历所有槽位？什么时候只落在少数槽位导致 clustering？

**答题要点：**
- `mod N` 会把等差序列映射成周期序列。
- 若步长 `d` 与 `N` 不互素（`gcd(N,d)>1`），只会访问 `N/gcd(N,d)` 个槽位 → 大量槽位永远用不到。
- 若 `gcd(N,d)=1`（互素），能遍历全部 `N` 个槽位 → 分布更均匀。

---

## 练习 1：线性探测（Linear Probing）插入（Lecture2 p31）

**题目：**
- `h(x) = x mod 13`
- 按顺序插入 keys：`18, 41, 22, 44, 59, 32, 31, 73`
- 用线性探测处理冲突：冲突就 `(i+1) mod N` 继续找空位  
- **要求：**画出最终 hash table（0..12），并写出每个 key 的 probe 序列或 probe 次数。

**复习要点：**
- Linear probing 容易出现 **primary clustering**（一段连续块越来越长）。
- 插入/查找都沿着同一套 probe 规则走。

---

## 练习 2：线性探测查找过程（Lecture2 p32–34）

**题目 A（概念题）：**How to search with linear probing?

**题目 B（手算题）：**给定课件中的表（p34），**追踪查找 key=32 的 probe 过程**，写出访问的下标序列，直到找到为止或遇到空槽。

**答题要点：**
- 从 `i=h(k)` 开始；若槽空 → 失败；若 key 匹配 → 成功；否则继续 `i=(i+1) mod N`。
- 最多 probe `N` 次，避免死循环。

---

## 练习 3：线性探测删除（Lecture2 p35–36）

**题目：**How do you remove an element x?

**标准要点（必须写到）：**
- **不能直接置空**（否则会截断 probe chain，导致后续元素查找失败）。
- 使用特殊标记 **DEFUNCT**（墓碑）：删除时把该槽置为 DEFUNCT。
- `get`：遇到 DEFUNCT 不能停，必须继续 probe；遇到真正空槽才停。
- `put`：可把 DEFUNCT 槽当作“可插入位置”。

---

## 练习 4：双哈希（Double Hashing）为什么要求 N 为素数？（Lecture2 p38）

**题目：**
- 课件声明：table size `N` must be a prime to allow probing of all the cells. Why?
- probe 位置：`(h(k) + j*d(k)) mod N`，`j=0..N-1`
- 例：`h(k)=1, d(k)=3`
  - 若 `N=12`，会访问哪些 positions？
  - 若 `N=13`，会访问哪些 positions？

**解题提示：**
- 你本质上在看等差序列 mod N 的循环长度。
- `N=12` 时 `gcd(12,3)=3` → 只能访问 `12/3=4` 个槽位（会很快循环）。
- `N=13`（素数）且 `d(k)=3` 不为 0 → `gcd(13,3)=1` → 能遍历所有 13 个槽位。

---

## 练习 5：双哈希插入整套演算（Lecture2 p39–40）

**题目：**
- `N = 13`
- `h(k) = k mod 13`
- `d(k) = 7 - (k mod 7)`
- 按顺序插入 keys：`18, 41, 22, 44, 59, 32, 31, 73`
- **要求：**画出最终表，并为每个 key 写出 probe 序列（至少写到落位为止）。

**复习要点：**
- 双哈希能减轻 clustering（比线性探测更“分散”）。
- `d(k)` 不能为 0；`N` 取素数更易保证探测能覆盖全表。

---

## 一页速记（考前 60 秒）

- Map ADT：`get/put/remove` 语义要清楚（存在/不存在返回什么）。
- List-based map：`get/remove/put` 最坏都 **O(n)**（因为要找 key）。
- Hash table：期望 **O(1)**，最坏 **O(n)**（全碰撞）。
- Hash function：`h(x)=h2(h1(x))`；目标：分散、看起来随机。
- Compression：`mod N` 常用；**N 选素数**通常更均匀。
- Collision：
  - Chaining：简单，但额外内存。
  - Linear probing：primary clustering；删除要 **DEFUNCT**。
  - Double hashing：`(h + j*d) mod N`；`d!=0`，`N` 常取素数确保覆盖全表。
