```
fn AppDouble( num ) {
	return {
		num: num * 2
	}
}

fn AppSum( a, b ) {
	return {
		sum: a + b
	}
}
```

```
// 仅结构
diff( AppDouble, AppSum ) => {
	input {
		+ num number
	}
	
	state {
		+ num ( num * 2 )
	}
}
diff( AppSum, AppDouble ) => {
	input {
		+ sum number
	}
	
	state {
		+ sum ( a + b )
	}
}
```


---
```
fn App( count ) {
	let cc = count * 4
	return {
		num: cc
	}
}

fn App2( count ) {
	return {
		num: count
	}
}
```

```
diff( App, App2 ) => {
	sequence {
		+ $0 ( #cc: count * 4 )
	}

	state {
		* num ( cc )
	}
}
```

---
```
fn App( count, operations ) {
	let cc = count * 4

	let {  } = operations

	return {
		num: cc
	}
}

fn App2( count ) {
	return {
		num: count
	}
}

App({
	count: 20,
	operations: [
		(add 3 muliply 4 6 )
		(divide 3 7 )
	]
})
App2({
	count: 3
})
```