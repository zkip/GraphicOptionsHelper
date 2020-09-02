```
fn A( ... ) {
	return A( ... )
}
```

> died

```
fn A( ... ) {
	if Condition {
		return A( ... )
	} else {
		return A( ... )
	}
}
```

> maybe die, weight on Condition
