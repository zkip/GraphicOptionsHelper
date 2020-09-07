```
fn fibonacci( n ) {
	if n > 1 {
		return fibonacci( n - 1 ) + fibonacci( n - 2 )
	}
	return 1
}

fn sum( n ) {
	if n > 1 {
		return n + sum( n - 1 )
	}
	return 1
}
```

```
process a {
	fibonacci( 4 )
}

process b {
	sum( 5 )
}

past {
	diff state ( a, b ) {
		number
	}
}

future {
	diff defintion ( a, b ) {
		...
	}
}
```

```
process a {
	create( "Jackie", 176, 62kg, id = 2744335 )
	User/2744335 joinToFightRoom( "SuperFightingRoom_f6xf30934qgzj3" )
}
```