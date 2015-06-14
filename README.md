#Azetquizoid
http://azetquizoid.azurewebsites.net/

ws echo @ /echo
ws game @ /game

client -> server
----------------

create game
```js
{
    "type":"create",
    "data":{}
}
```

connect to game
```js
{
    "type":"connect",
    "data":{
        "id":""
    }
}
```

get status about current game
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

create confirmation
```js
{
    "type":"create-confirm",
    "data":{
        "id":""
    }
}
```

connect confirmation
```js
{
    "type":"connect-confirm",
    "data":{
        "id":""
    }
}
```

status response (debugging only)
```js
{
    "type":"status-report",
    "data":{
        status data
    }
}
```