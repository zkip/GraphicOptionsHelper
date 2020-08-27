## 动作性质

-   瞬时动作，如 alert，生命周期 onCreated，onMounted
-   持续性动作，如 addEventListener

## 具有影响的动作清单

-   WebAPI Access
-   DOMEvent Access
-   DOM Accessing
-   Throw Hooks

## Throw Hooks

```js
// example 1
let count = 3;
function App() {
	count = 5;
	return {
		count,
	};
}
```

```
update( "-App\$0" )
```

> { count: 3 }

```js
// example 2
let count = 3;
function App() {
	function setCount(c) {
		count = c;
	}
	return {
		setCount,
		count,
	};
}
```

`example1`中一定会导致 count 的值发生了变化，而`example2`中却不一定。是什么原因导致了它们在变化预期不一致？

### 定义 & 执行

`example1`中 count 已经执行了，而`example2`中只有当 setCount 执行的时候 count 才会发生改变，这时候 count 最终值依赖于 setCount 函数执行的时机。

```js
// example 3
let count = 3;
function App() {
	function setCount(c) {
		count = c;
	}
	count = 5;
	setCount(7);
	return {
		setCount,
		count,
	};
}
```

```
uppdate( "-App$setCount$0" )
```

期望的 count 值是 5，它的影响因素堆由原来的 `[ 5, 7 ]` 变成了 `[ 5 ]`。在这里 count 的值影响因素堆发生了改变。由此得出结论：

> 当影响因素位于所在对应列表堆顶时，它将会使状态发生变化

### 记录状态
考虑以下情况（基于`example3`）
> setCount(6)
> update( "*App$setCount$0", count += c )

记录所有状态，包括事件被执行的次数