
## 动作性质
-   瞬时动作，如 alert，生命周期 onCreated，onMounted
-   持续性动作，如addEventListener

## 具有影响的动作清单
-	WebAPI Access
-	DOMEvent Access
-	DOM Accessing
-	Throw Hooks

## Throw Hooks
```js
	let count = 3;
	function App(){
		count = 5;
		return {
			count,
		}
	}
```

> update( "-App$0" )

```js
	let count = 3;
	function App(){
		return {
			count,
		}
	}
```