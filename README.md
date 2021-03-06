#Azetquizoid
http://azetquizoid.azurewebsites.net/

Hra začne, zobrazí se otázka, oba hráči odpoví. Vyhodnotí se odpovědi, ten co odpověděl správně vybere pole. Když ani jeden neodpověděl správně, tak se vybere náhodné pole. Když oba odpověděli správně, tak vyhrál ten, kdo odpověděl první. Zobrazí se další otázka. Oba hráči mohou kdykoliv hádat obrázek. Po každém hádání se pošle status report. Kdyže state=ended tak hra končí. Ten kdo má víc bodů, vyhrál.

Pořadí příkazů

```
create ->			|
create-confirm <-	|
					| <- connect
connect-confirm <-	| -> connect-confirm
question <-			| -> question
status-report <-	| -> status-report
answer ->			|
					| <- answer
answer-report <-	| -> answer-report
					| <- select
status-report <-	| -> status-report
question <-			| -> question
status-report <-	| -> status-report
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

odpověz na otázku
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

zvolit pole pro odkrytí
```js
{
    "type":"select",
    "data":{
		"x":0,
		"y":0
	}
}
```

hádej
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

connect confirmace (dostanou jí oba hráči )
```js
{
    "type":"connect-confirm",
    "data":{
        "id":"",
        "img_url":"", 
		"img_width":0,
        "img_height":0,
        "options":["",""], //možnosti pro pool odpovědí
		"size": {"x":0,"y":0} //počet polí
    }
}
```

nová otázka
```js
{
    "type":"question",
    "data":{
        "text":"",
        "question_options":[""],
		"timestamp":0,
		"answer_time":0 // čas na odpověď v MS
    }
}
```

info o odpovědi
```js
{
    "type":"answer-report",
    "data":{
        "correct":true|false, //byla správná
		"pick":true|false, //vybírá pole
		"correct_answer":"",
		"opponent_answer":""
    }
}
```

guess response
```js
{
    "type":"guess-rsponse",
    "data":{
        "correct":true|false
    }
}
```

status response (info o hře)
```js
{
    "type":"status-report",
    "data":{
        player1score:0,
        player2score:0,
		"options":["",""], //zbyvajici moznosti
		"state":"running|ended", //hra běží nebo je dohraná.
		"question":"",
		"question_options":[""],
		"uncovered":[] //dvourozměrné pole s odkrytými bloky [y][x]. true = odkrytý
    }
}
```