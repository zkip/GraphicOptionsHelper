`change -> create / update / delete	targets`

## 4
```
let c = 2;

fn foo( ) {
	c = 3;
}
```

> delete $/c -> delete /0, delete /1/0

## 4
```
let c = 2;

fn foo( ) {
	c = 7;
	c = 3;
}
```

> deleteline: delete $/1/1 -> delete /1/1

```
c	rel_def = [ /0, /1/0, /1/1 ]
	rel_def_actually = [ /0 ]
	rel_apply = { /1: [ /1/0, /1/1 ] }

	result = /0

	deleteline( )

c	rel_def = [ /0, /1/0 ]

	result = /0
```

> call: add $/1 call $/1 -> delete /1/1

```
c	rel_def = [ /0, /1/0, /1/1 ]
	rel_def_actually = [ /0 ]
	rel_apply = { /1: [ /1/0, /1/1 ] }

	result = /0

	call( )

c	rel_def_actually = [ /0, /1/0, /1/1 ]

	result = /1/1
```

## 4
```
let c = 2;

fn foo( ) {
	c = 3;
}

fn anywhere_exc( a ) {
	c = a
}

go for {
	await rand * 1e10ms
	anywhere_exc( Int( rand * 100 ) )
}
```

> deleteline: delete $/1/1 -> delete /1/1