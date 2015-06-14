#Azetquizoid
http://azetquizoid.azurewebsites.net/

Pořadí příkazů

```
create ->			|
					| <- connect
connect-confirm <-	| -> connect-confirm
status-report <-	| -> status-report
question <-			| -> question
answer ->			|
answer-report <-	| // špatná odpověď
					| <- answer
					| -> answer-report //správná odpověď
status-report <-	| -> status-report
question <-			| -> question
...
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
        "img-url":"" //TODO,
        "options":["",""] //možnosti pro pool odpovědí //TODO
    }
}
```

nová otázka //TODO
```js
{
    "type":"question",
    "data":{
        "text":""
    }
}
```

info o odpovědi //TODO
```js
{
    "type":"answer-report",
    "data":{
        "correct":true|false //byla správná
    }
}
```

status response (info o hře)
```js
{
    "type":"status-report",
    "data":{
        status data
    }
}
```