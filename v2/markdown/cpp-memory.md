---
title: C++ 現代內存管理與指針機制
date: 2026-03-14
category: 计算机
tags: ["C++", "内存管理", "软件工程"]
summary: 深入探討 C++11 以後的智能指針 (unique_ptr, shared_ptr)、RAII 原則與虛擬內存映射機制。
---

# C++ 現代內存管理與指針機制

在現代 C++ 軟體工程中，手動調用 `new` 和 `delete` 已經被視為一種反模式。RAII（Resource Acquisition Is Initialization）才是現代 C++ 的靈魂。

## 1. RAII 與智能指針家族

C++11 引入了三種核心智能指針：

1. **`std::unique_ptr`**：獨佔所有權，禁止拷貝，僅支持移動語義 (`std::move`)。幾乎零運行時開銷。
2. **`std::shared_ptr`**：共享所有權，採用引用計數機制。
3. **`std::weak_ptr`**：解決 `shared_ptr` 循環引用導致的內存洩漏問題。

```cpp
#include <memory>
#include <iostream>

struct Resource {
    Resource() { std::cout << "Resource allocated\n"; }
    ~Resource() { std::cout << "Resource released\n"; }
};

void demo() {
    auto ptr = std::make_unique<Resource>();
    // 函數退出時自動調用析構函數，釋放內存
}
```

## 2. 演算法與數學的跨學科應用

在演算法實現中，數據結構的內存布局直接影響 CPU Cache 命中率。例如矩陣快速冪中的多維陣列，扁平化連續存儲 (`std::vector<int64_t>` 連續一維內存) 相比指針陣列能提升數倍運算速度。

> **站內互聯導讀**：
> 關於矩陣快速冪的具體數論實現，請參閱本站相關文章：
> 🔗 [矩陣快速冪與線性遞推實踐](./markdown_reader.html?post=fibonacci-matrix)
