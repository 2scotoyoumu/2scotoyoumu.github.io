---
title: 矩陣快速冪與線性遞推關係
date: 2026-08-20
category: 算法
tags: ["算法", "线性代数", "快速幂"]
summary: 利用矩陣乘法在 O(log n) 時間內求解斐波那契數列與高階線性遞推，並結合生成函數深入剖析。
---

# 矩陣快速冪與線性遞推關係

求解線性遞推數列的最優複雜度通常依賴於**矩陣快速冪**或**特徵多項式求逆**。

## 1. 斐波那契數列的矩陣形式

定義斐波那契數列：
$$F_0 = 0, \quad F_1 = 1, \quad F_n = F_{n-1} + F_{n-2} \quad (n \ge 2)$$

將其寫為向量與轉移矩陣的形式：
$$\begin{pmatrix} F_{n} \\ F_{n-1} \end{pmatrix} = \begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix} \begin{pmatrix} F_{n-1} \\ F_{n-2} \end{pmatrix}$$

遞推可得：
$$\begin{pmatrix} F_{n} \\ F_{n-1} \end{pmatrix} = \begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}^{n-1} \begin{pmatrix} F_{1} \\ F_{0} \end{pmatrix}$$

## 2. 快速冪求解 $O(\log n)$

利用二進制拆分，在 $O(K^3 \log n)$ 時間內求得 $M^{n-1}$，其中 $K=2$ 為轉移矩陣維度。

```cpp
// 核心矩陣乘法與快速冪
Matrix power(Matrix base, int64_t exp, int64_t mod) {
    Matrix res = Matrix::identity(base.size);
    while (exp > 0) {
        if (exp & 1) res = (res * base) % mod;
        base = (base * base) % mod;
        exp >>= 1;
    }
    return res;
}
```

## 3. 文章間連結與對偶視角

除了矩陣快速冪，求解斐波那契通項公式的另一個強大工具是**普通型母函數 (OGF)**。

> **站內互聯導讀**：
> 如果你希望從解析組合學的角度推導閉式解：
> 🔗 [生成函數學習筆記：利用生成函數由遞推式求通項公式](./article/2026/generating_function_an.html)
> 同時，關於底層高效矩陣運算的內存優化：
> 🔗 [C++ 現代內存管理與指針機制](./markdown_reader.html?post=cpp-memory)
