#Azetquizoid
http://azetquizoid.azurewebsites.net/

Hra začne, zobrazí se otázka, oba hráči odpoví. Vyhodnotí se odpovědi, ten co odpověděl správně vybere pole. Když ani jeden neodpověděl správně, tak se vybere náhodné pole. Když oba odpověděli správně, tak vyhrál ten, kdo odpověděl první. Zobrazí se další otázka. Oba hráči mohou kdykoliv hádat obrázek. Po každém hádání se pošle status report. Kdyže state=ended tak hra končí. Ten kdo má víc bodů, vyhrál.

Pořadí příkazů

```
create ->			|
create-confirm <-	|
					| <- connect
connect-confirm <-	| -> connect-confirm
status-report <-	| -> status-report
question <-			| -> question
answer ->			|
					| <- answer
answer-report <-	| -> answer-report
					| <- select
status-report <-	| -> status-report
question <-			| -> question
...
guess ->			|
guess-response <-	|
status-report <-	| -> status-report
```

ws protocol @ /game

client -> server
----------------

vytvoř hru
```js
{
    "type":"create",
    "data":{}
}
```

připoj se ke hře
```js
{
    "type":"connect",
    "data":{
        "id":""
    }
}
```

odpověz na otázku //TODO
```js
{
    "type":"answer",
    "data":{
        "text":""
    }
}
```

získej status o aktuální hře
```js
{
    "type":"status",
    "data":{}
}
```

zvolit pole pro odkrytí //TODO
```js
{
    "type":"select",
    "data":{
		"x":0,
		"y":0
	}
}
```

hádej //TODO
```js
{
    "type":"guess",
    "data":{
		"text":"' // co je na obrázku?
	}
}
```

server -> client
----------------

error
```js
{
    "type":"error",
    "data":{
        "message":""
    }
}
```

create confirmace
```js
{
    "type":"create-confirm",
    "data":{
        "id":""
    }
}
```

connect confirmace (dostanou jí oba hráči //TODO)
```js
{
    "type":"connect-confirm",
    "data":{
        "id":"",
        "img-url":"", //TODO,
        "img-width":0, //TODO,
        "img-height":0, //TODO,
        "options":["",""], //možnosti pro pool odpovědí //TODO
		"size": {"x":0,"y":0} //počet polí //TODO
    }
}
```

nová otázka //TODO
```js
{
    "type":"question",
    "data":{
        "text":"",
		"timestamp":0,
		"answer-time":0 // čas na odpověď
    }
}
```

info o odpovědi //TODO
```js
{
    "type":"answer-report",
    "data":{
        "correct":true|false, //byla správná
		"pick":true|false //vybírá pole
    }
}
```

guess response /TODO
```js
{
    "type":"guess-rsponse",
    "data":{
        "correct":true|false
    }
}
```

status response (info o hře) /TODO
```js
{
    "type":"status-report",
    "data":{
        player1score:0,
        player2score:0,
		"options":["",""], //zbyvajici moznosti
		"state":"running|ended" //hra běží nebo je dohraná.
    }
}
```