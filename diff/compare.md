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
	+ num number ( ) num * 2
}
```