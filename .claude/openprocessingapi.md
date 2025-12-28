<!--- 
retrieved from https://openprocessing.org/api/
 last updated: 2025-12-27
--->

Get User
Get User Sketches
Get User Followers
Get Users Following
Get User Hearts
Get Sketch
Get Sketch Code
Get Sketch Files
Get Sketch Libraries
Get Sketch Forks
Get Sketch Hearts
Get Curation
Get Curation Sketches
Get Tags

OpenProcessing Public API
=========================

Using this API, you can access certain public information directly. Documentation is in work-in-progress, and but feel free to reach out [info@openprocessing.org](https://mailto:info@openprocessing.org/) for any questions. To hear the future updates, please [sign up to our API Updates newsletter in your notification settings](https://openprocessing.org/user/notifications?sub=apiUpdates) on OpenProcessing.

Read-only
---------

At the moment, all the API calls are read-only and available as GET requests.

Public-only
-----------

All the data received via the API is all the public information you can find on the website. Authorization methods to receive private data will be available in the future.

Pagination on Arrays
--------------------

All endpoints that return an array (such as `/user/1/sketches`) also accept limit, offset and sort as a query parameters. If available, the server response headers will also include `hasMore` boolean value. Based on this value, you can use a separate call to retrieve further data. Sorting ['asc' or 'desc'] is done on the most logical column per result set (such as createdOn date for sketches, submittedOn date for curation sketches, heart date for user/1/hearts, etc.).

[Example Endpoint](https://openprocessing-api.postman.co/workspace/OpenProcessing~48fc0333-1f24-40f1-a2c0-48b40b459b9c/request/16936458-9b6ab14a-e4d5-468e-9154-c7f0b2a9c6f7?ctx=documentation): `https://openprocessing.org/user/1/sketches?limit=10&offset=0&sort=desc`

Rate Limit
----------

To prevent web-scaping and server overload, there is a rate limit for 40 API calls per minute.

### Get User

https://openprocessing.org/api/user/1

You can access the public user information with this call.


#### Example Request:

```js
var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://openprocessing.org/api/user/1',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

```



#### Example Response:

```json
{
  "userID": "1",
  "fullname": "Sinan Ascioglu",
  "bio": "OpenProcessing master magician. Trying to stop obsessing with icon alignment.",
  "memberSince": "2008-02-06 22:58:37",
  "website": "https://wiredpieces.com",
  "location": "Brooklyn, NY"
}
```

### ### Get User Sketches

https://openprocessing.org/api/user/1/sketches


#### Example Request:

```js
var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://openprocessing.org/api/user/1/sketches',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

```



#### Example Response:

```json
[
  {
    "visualID": "13481",
    "title": "Sugar buildings in HTML5",
    "description": "To see if it is going to work in HTML5, I just copy pasted the code of Sugar Buildings by Jean-no:\nhttp://www.openprocessing.org/visuals/?visualID=2921\nPerformance is not too bad unless there are more than 100 blocks, but probably depends on the computer"
  },
  {
    "visualID": "19142",
    "title": "Swirlies in HTML5",
    "description": "Html5 version of Swirlies by Tymm.\n\nPerformance drops a lot if you increase the SIZEW, SIZEH"
  },
  {
    "visualID": "19220",
    "title": "Leaf Experience",
    "description": "A project I did when I was at ITP."
  },
  {
    "visualID": "40563",
    "title": "testing sketch\"s opengl",
    "description": "testing OpenGL sketch"
  },
  {
    "visualID": "51522",
    "title": "sugar buildings for bus-tops",
    "description": "Original code belongs to Jean-no, I just copy pasted the code of Sugar Buildings, and changed the color, dimensions and framerate for bus-tops competition:\nhttp://www.openprocessing.org/visuals/?visualID=2921"
  },
  ...
  ... TRUNCATED FOR BREVITY
  ...
  {
    "visualID": "1844031",
    "title": "iframe test",
    "description": ""
  }
]
```

### Get User Followers

https://openprocessing.org/api/user/1/followers?limit=10&offset=0&sort=desc

PARAMS

limit: 10
offset: 0
sort: desc


#### Example Request:

```js
var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://openprocessing.org/api/user/1/followers',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

```



#### Example Response:

```json
[
  {
    "userID": "2",
    "fullname": "OP Test Account",
    "membershipType": "3",
    "followedOn": "2022-04-13 15:13:26"
  },
  {
    "userID": "53",
    "fullname": "Daniel Shiffman",
    "membershipType": "0",
    "followedOn": "2018-04-27 23:16:47"
  },
  {
    "userID": "84",
    "fullname": "DEC_HL",
    "membershipType": "0",
    "followedOn": "2021-04-05 15:36:05"
  },
  {
    "userID": "264",
    "fullname": "mitchell whitelaw",
    "membershipType": "3",
    "followedOn": "2012-05-02 05:16:23"
  },
  {
    "userID": "618",
    "fullname": "Giovanni Carlo Mingati",
    "membershipType": "0",
    "followedOn": "2012-03-23 06:16:07"
  },
  ...
  ... TRUNCATED FOR BREVITY
  ...
  {
    "userID": "387225",
    "fullname": "justAnotherAnotherUser",
    "membershipType": "0",
    "followedOn": "2023-08-15 18:10:26"
  }
]
```

### Get Users Following

https://openprocessing.org/api/user/1/following?limit=10&offset=0&sort=desc

PARAMS

limit: 10
offset: 0
sort: desc

#### Example Request:

```js
var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://openprocessing.org/api/user/1/following',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

```


#### Example Response:

```json
[
  {
    "userID": "259116",
    "fullname": "alexthescott",
    "membershipType": "0",
    "followedOn": "2023-07-05 22:39:15"
  },
  {
    "userID": "324894",
    "fullname": "Dippinlow",
    "membershipType": "0",
    "followedOn": "2023-02-20 15:38:12"
  },
  ...
  ... TRUNCATED FOR BREVITY
  ...
  {
    "userID": "278169",
    "fullname": "mattywillo_",
    "membershipType": "0",
    "followedOn": "2022-12-14 16:01:57"
  }
]
```

### Get User Hearts

https://openprocessing.org/api/user/1/hearts?limit=10&offset=0&sort=desc

PARAMS

limit: 10
offset: 0
sort: desc


#### Example Request:

```js
var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://openprocessing.org/api/user/1/hearts',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

```



#### Example Response:

```json
[
  {
    "visualID": "75",
    "title": "Swirlies",
    "mode": "applet"
  },
  {
    "visualID": "154",
    "title": "Spheres Rotating Within Spheres",
    "mode": "applet"
  },
  {
    "visualID": "157",
    "title": "Meander",
    "mode": "applet"
  },
  ...
  ... TRUNCATED FOR BREVITY
  ...
  {
    "visualID": "1996327",
    "title": "Lignes de beauté",
    "mode": "p5js"
  }
]
```

### Get Sketch

https://openprocessing.org/api/sketch/1029981

Get sketch information.

Mode can be one of ["p5js","processingjs","html","applet"]. Based on this, you can also find the selected engine URL for p5js and processingjs in engineURL.


#### Example Request:

```js
var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://openprocessing.org/api/sketch/1029981',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

```

#### Example Response:

```json
{
  "visualID": "1142958",
  "title": "Emojisweeper",
  "description": "I found myself playing minesweeper on DOSBox Win 3.1 recently, and got pissed off because it had a bug in the game rules so I thought why not create one on OpenProcessing.",
  "instructions": "Click to reveal all blocks that are not bombs. You click on a bomb, you die.  You find all the blocks that are not a bomb, you win.\nNumbers indicate the number of  bombs around each block. Use it to strategize. Press 'F' to flag any block that you suspect as a bomb.",
  "tags": [],
  "license": "by-nc-sa",
  "isDraft": "0",
  "createdOn": "2021-03-22 01:11:15",
  "updatedOn": null,
  "filesUpdatedOn": null,
  "thumbnailUpdatedOn": "2021-03-22 03:16:36",
  "parentID": null,
  "engineID": "1999",
  "isTutorial": "0",
  "isTemplate": "0",
  "hasTimeline": "0",
  "libraries": [
    {
      "libraryID": "2096",
      "url": "https://cdn.jsdelivr.net/npm/p5@v1.5.0/lib/addons/p5.sound.min.js"
    },
    {
      "libraryID": "2109",
      "url": "https://cdn.jsdelivr.net/gh/msawired/OPC@v0.2.4/opc.js"
    }
  ],
  "templateID": null,
  "userID": "1",
  "engineURL": "https://cdn.jsdelivr.net/npm/p5@v1.3.0/lib/p5.js",
  "mode": "p5js",
  "fileBase": "https://openprocessing-usercontent-test.s3.amazonaws.com/files/user1/visual1142958/h47576ae9713d39b64d21e8a34fe2e996/"
}
```

### Get Sketch Code

https://openprocessing.org/api/sketch/1029981/code

Get code for a given sketch. This returns an array of text files as seen in the tabs when you are viewing a sketch.

OrderID provides the tab order they are in. Order is important to follow if you are trying to run the sketch based on this code: Each code object should be loaded per the order they are in.


#### Example Request:

```js
var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://openprocessing.org/api/sketch/1029981/code',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

```



#### Example Response:

```json
[
  {
    "codeID": "17177644",
    "orderID": "0",
    "code": "let rows = 10;\nlet cols = rows;\nlet cellW = 40;\nlet cellH = cellW;\nlet cells = [];\nlet mineToCellRatio = 0.15; //increase it to make it harder \n\n//emojis used\nconst CELL = '🌁'; \nconst EMPTY = '🟧';\nconst MINE = '💣';\nconst PIN = '📍';\nconst DIGITS = ['⬜️', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];\n\n\nfunction setup() {\n\tbackground(255);\n\tcreateCanvas(cellW * rows, cellH * cols);\n\ttextSize(cellH - 1);\n\n\tfor (let i = 0; i < rows; i++) {\n\t\tfor (let j = 0; j < cols; j++) {\n\t\t\tlet newCell = new Cell(i, j);\n\t\t\t//decide whether it is a mine or not\n\t\t\tnewCell.mine = Math.random(0, 1) < mineToCellRatio;\n\t\t\tcells.push(newCell);\n\t\t}\n\t}\n\t//set mines around each cell\n\tcells.forEach(c => {\n\t\t//find neighboring cells\n\t\tlet neighbors = getNeighbors(c);\n\t\tlet reducer = (accumulator, currentValue) => accumulator + currentValue;\n\t\tc.minesAround = neighbors.map(n => n.mine).reduce(reducer); //add all mine values to find total\t\n\t});\n}\n\nfunction draw() {\n\tbackground(255);\n\n\ttranslate(1, cellH - 3);\n\tcells.forEach(function(c) {\n\t\tc.draw();\n\t});\n}\n\nfunction getNeighbors(cell) {\n\treturn cells.filter(n => {\n\t\treturn (n.i >= cell.i - 1) && (n.i <= cell.i + 1) && (n.j >= cell.j - 1) && (n.j <= cell.j + 1);\n\t});\n}\n\nfunction revealCell(cell) {\n\tcell.revealed = true;\n\tif (cell.mine) { //end game\n\t\tcells.forEach(c => {\n\t\t\tc.revealed = true;\n\t\t});\n\t\tnoLoop();\n\t\treturn;\n\t}\n\tif (cell.minesAround == 0) { //recursively reveal neighbors\n\t\tlet neighbors = getNeighbors(cell);\n\t\tneighbors.forEach(n => {\n\t\t\tif (!n.revealed) {\n\t\t\t\trevealCell(n);\n\t\t\t}\n\t\t});\n\t}\n}\nfunction gameWon(){\n\tDIGITS[0] = '😃';\n\tcells.forEach(function(c) {\n\t\tc.revealed = true;\n\t});\n}\nfunction gameLost(){\n\tDIGITS[0] = '😱';\n\tcells.forEach(function(c) {\n\t\tc.revealed = true;\n\t});\n}\n\nfunction mousePressed() {\n\t//find the cell pressed on\n\tlet cell = cells.find(c => {\n\t\treturn (c.x < mouseX) && (c.x + cellW > mouseX) && (c.y < mouseY) && (c.y + cellH > mouseY);\n\t});\n\tif (cell) {\n\t\tif (cell.pinned) {\n\t\t\treturn; //do not allow revealing\n\t\t}\n\t\trevealCell(cell);\n\t\tif(cell.mine){\n\t\t\t\tgameLost();\t\n\t\t}else{\n\t\t\t//check if game is won\n\t\t\tlet cellsLeft = cells.filter(c => {\n\t\t\t\treturn !c.mine && !c.revealed;\n\t\t\t}).length;\n\t\t\tif(cellsLeft == 0){\n\t\t\t\tgameWon();\n\t\t\t}\n\t\t}\n\t}\n\t\n}\nfunction keyPressed() {\n\tif (key == 'f') {\n\n\t\t//find the cell pressed on\n\t\tlet cell = cells.find(c => {\n\t\t\treturn (c.x < mouseX) && (c.x + cellW > mouseX) && (c.y < mouseY) && (c.y + cellH > mouseY);\n\t\t});\n\t\tif (cell) {\n\t\t\tcell.pinned = !cell.pinned;\n\t\t}\n\t}\n}\n",
    "title": "mySketch",
    "updatedOn": "2023-09-04 16:41:37",
    "createdOn": "2023-09-04 13:41:37"
  },
  {
    "codeID": "17177645",
    "orderID": "1",
    "code": "class Cell {\n\tconstructor(i, j) {\n\t\tthis.i = i;\n\t\tthis.j = j;\n\t\tthis.x = i * cellW;\n\t\tthis.y = j * cellH;\n\t\tthis.mine = false;\n\t\tthis.minesAround = 0;\n\t\tthis.revealed = false;\n\t\tthis.won = false;\n\t}\n\n\tdraw() {\n\t\tif (this.revealed && this.mine) {\n\t\t\ttext(MINE, this.x, this.y);\n\t\t\treturn;\n\t\t}\n\t\tif (this.revealed) {\n\t\t\t//calculate the number of mines around and draw that\n\t\t\ttext(DIGITS[this.minesAround], this.x, this.y);\n\t\t\treturn;\n\t\t}\n\t\tif (this.pinned) {\n\t\t\ttext(PIN, this.x, this.y);\n\t\t\treturn;\n\t\t}\n\n\t\ttext(EMPTY, this.x, this.y);\n\t}\n\t\n}",
    "title": "Cell",
    "updatedOn": "2023-09-04 16:41:37",
    "createdOn": "2023-09-04 13:41:37"
  }
]
```

### Get Sketch Files

https://openprocessing.org/api/sketch/1029981/files

List of files uploaded to be used in this sketch. Note that this list only includes uploaded files, not the code/text files that are editable in the code editor. For those, use "/code" endpoint.


#### Example Request:

```js
var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://openprocessing.org/api/sketch/1029981/files?limit=10&offset=0',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

```



#### Example Response:

```json
[
  {
    "name": "example.png",
    "lastModified": "2023-09-13T12:25:24+00:00",
    "size": "412041",
    "url": "https://openprocessing-usercontent.s3.amazonaws.com/files/user2/visual1844030/hbad42faf86294b9b49cf23f85e21feea/example.png"
  }
]
```

### Get Sketch Libraries

https://openprocessing.org/api/sketch/1029981/libraries?limit=10&offset=0

Returns a list of libraries that are toggled on on the side panel. Also includes any custom libraries that are added on the sidepanel. Note that this list doesn't include any libraries which might be hard-coded in HTML mode.

PARAMS

limit: 10
offset: 0


#### Example Request:

```js
var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://openprocessing.org/api/sketch/1029981/libraries?limit=10&offset=0',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

```



#### Example Response:

```json
[
  {
    "libraryID": "67",
    "url": "https://cdn.jsdelivr.net/gh/FreddieRa/p5.3D@1.4/p5.3D.js"
  },
  {
    "libraryID": "2096",
    "url": "https://cdn.jsdelivr.net/npm/p5@v1.5.0/lib/addons/p5.sound.min.js"
  },
  {
    "libraryID": "2109",
    "url": "https://cdn.jsdelivr.net/gh/msawired/OPC@v0.2.4/opc.js"
  }
]
```

### Get Sketch Forks

https://openprocessing.org/api/sketch/1029981/forks?limit=10&offset=0&sort=desc

Get forks of a given sketch. This returns an array of sketch info.

PARAMS

limit: 10
offset: 0
sort: desc


#### Example Request:

```js
var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://openprocessing.org/api/sketch/1029981/forks',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

```



#### Example Response:

```json
[
  {
    "visualID": "1148615",
    "title": "Emojisweeper",
    "userID": "27124",
    "fullname": "jWilliam Dunn",
    "createdOn": "2021-03-25 22:58:15",
    "updatedOn": "2022-11-23 19:37:03"
  },
  {
    "visualID": "1184420",
    "title": "Emojisweeper",
    "userID": "172232",
    "fullname": "siriusosiris",
    "createdOn": "2021-05-04 04:34:44",
    "updatedOn": "2022-10-15 03:24:55"
  },
  {
    "visualID": "1215351",
    "title": "Emojisweeper Fork",
    "userID": "137180",
    "fullname": "A. Lovelace",
    "createdOn": "2021-06-09 23:10:32",
    "updatedOn": "2023-09-27 10:36:08"
  },
  {
    "visualID": "1323594",
    "title": "Emojisweeper",
    "userID": "277907",
    "fullname": "Hanshin",
    "createdOn": "2021-10-25 12:25:48",
    "updatedOn": "2021-11-29 14:12:48"
  },
  {
    "visualID": "1540765",
    "title": "Emojisweeper",
    "userID": "66875",
    "fullname": "Joshua Marris",
    "createdOn": "2022-04-11 00:54:33",
    "updatedOn": "2022-11-24 17:53:48"
  },
  {
    "visualID": "1585332",
    "title": "Textsweeper",
    "userID": "275463",
    "fullname": "Coiny the Olive",
    "createdOn": "2022-05-26 04:48:36",
    "updatedOn": "2022-11-24 00:35:45"
  }
]
```

### Get Sketch Hearts

https://openprocessing.org/api/sketch/1029981/hearts?limit=10&offset=0&sort=desc

Get hearts of a given sketch. This returns an array of user info.

PARAMS

limit: 10
offset: 0
sort: desc

#### Example Request:

```js
var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://openprocessing.org/api/sketch/1029981/hearts',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

```

#### Example Response:

```json
[
  {
    "userID": "94932",
    "fullname": "Michael Lowe",
    "createdOn": "2021-03-22 11:31:15"
  },
  {
    "userID": "27124",
    "fullname": "jWilliam Dunn",
    "createdOn": "2021-03-22 15:48:53"
  },
  {
    "userID": "245487",
    "fullname": "Turgenta",
    "createdOn": "2021-03-26 16:14:52"
  },
  {
    "userID": "245926",
    "fullname": "Alex Flowers",
    "createdOn": "2021-04-22 15:42:35"
  },
  {
    "userID": "269658",
    "fullname": "Chen Hsiao Hsin",
    "createdOn": "2021-05-08 18:26:01"
  },
  {
    "userID": "273362",
    "fullname": "Caleb Sylvest",
    "createdOn": "2021-05-16 18:41:38"
  },
  {
    "userID": "268308",
    "fullname": "Ryota　Fujitsuka",
    "createdOn": "2021-06-02 03:28:23"
  },
  {
    "userID": "274863",
    "fullname": "Omnis",
    "createdOn": "2021-06-27 08:40:36"
  },
  {
    "userID": "282286",
    "fullname": "gokhan",
    "createdOn": "2021-08-17 12:29:13"
  },
  {
    "userID": "202842",
    "fullname": "Injinct",
    "createdOn": "2021-09-26 12:28:33"
  }
]
```

### Get Curation

https://openprocessing.org/api/curation/78544

Returns curation information.

PARAMS

limit: 1
offset: 2


#### Example Request:

```js
var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://openprocessing.org/api/curation/78544',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

```

#### Example Response:

```json
{
  "title": "Squishy 🐙   #WCCChallenge",
  "description": "New topic every week! The Weekly Creative Code Challenge is a friendly jam for generative artists and creative coders. I review your submissions live on http://twitch.tv/sableraph every Sunday starting at 5pm Berlin time (CET/CEST). #WCCChallenge\n\nYou should feel welcome to participate, regardless of your background or skill level. Beginners in particular are encouraged to share their creations.\n\nEach week, the community of the [Birb's Nest Discord](https://discord.gg/nP2XJBGMeH) suggests topics and we vote for the topic of the week. See the [list of past topics](https://sableraph.notion.site/afe97ee95a1c4e2c9cc524b78aae6e45?v=66edd42672aa41e29d5a1aa8e0dc7cb2).\n\n*Note: the sketches added to this curation will be automatically posted to the [Birb's Nest Discord](https://discord.gg/nP2XJBGMeH).*\n\n**Guidelines**\n- Post your creation here or directly on the [Birb's Nest Discord](https://discord.gg/nP2XJBGMeH)\n- Please only submit your sketches once they are ready to be reviewed. It's ok to make small changes after you submit, but I will remove empty sketches and spam.\n- Submissions should be relevant to the topic of the week (see the title of this curation) but...\n- You are free to (mis)interpret the topic any way that you like as long as you make it funny 😁\n- Post before Sunday at 5pm Berlin time so I can review your submission live on [https://twitch.tv/sableraph](https://www.twitch.tv/sableraph)\n- You can submit more than one piece if you want but I might only review one of them\n- You may recycle old work if it fits the topic but I encourage you to submit work made this week\n- Consider using the #WCCChallenge hashtag if you share your creation on Twitter or Instagram\n- Though it is not required, I'm very grateful for mentions of the #WCCChallenge in the comments of your code too\n- Please don't use copyrighted music in your work so we don't get in trouble with Twitch",
  "createdOn": "2022-05-06 16:21:55",
  "collectionID": "78544",
  "userID": "22192"
}
```

### Get Curation Sketches

https://openprocessing.org/api/curation/68677/sketches?limit=10&offset=0&sort=desc

Returns a list of sketches submitted to this curation. Note that only the approved and public sketches are included in the list. Sketches pending approval are not included.

PARAMS

limit: 10
offset: 0
sort: desc


#### Example Request:

```js
var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://openprocessing.org/api/curation/68677/sketches?limit=10&offset=0',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

```

#### Example Response:

```json
[
  {
    "visualID": "1996316",
    "title": "Cubit Rotated",
    "description": "",
    "userID": "306412",
    "parentID": "0",
    "thumbnailUpdatedOn": "2023-09-06 20:45:47",
    "fullname": "kywsho",
    "membershipType": "1",
    "status": "1",
    "submittedOn": "2023-09-06 20:47:11"
  },
  {
    "visualID": "1996254",
    "title": "Pipes",
    "description": "",
    "userID": "306412",
    "parentID": "0",
    "thumbnailUpdatedOn": "2023-09-06 20:18:47",
    "fullname": "kywsho",
    "membershipType": "1",
    "status": "1",
    "submittedOn": "2023-09-06 20:19:43"
  },
  {
    "visualID": "1981361",
    "title": "Cubit",
    "description": "A grid of isometric cubes with fake lighting implemented entirely with 2d rhombuses.",
    "userID": "306412",
    "parentID": "1165174",
    "thumbnailUpdatedOn": "2023-09-06 19:58:07",
    "fullname": "kywsho",
    "membershipType": "1",
    "status": "1",
    "submittedOn": "2023-09-06 19:58:19"
  },
  {
    "visualID": "1994688",
    "title": "vaivorykštė",
    "description": "",
    "userID": "397994",
    "parentID": "0",
    "thumbnailUpdatedOn": "2023-09-05 00:13:05",
    "fullname": "nick",
    "membershipType": "0",
    "status": "1",
    "submittedOn": "2023-09-05 01:09:39"
  },
  {
    "visualID": "1922728",
    "title": "090523",
    "description": "Colourful block pattern",
    "userID": "90651",
    "parentID": null,
    "thumbnailUpdatedOn": "2023-06-21 22:00:59",
    "fullname": "Lee Doughty",
    "membershipType": "0",
    "status": "1",
    "submittedOn": "2023-05-09 19:07:15"
  },
  {
    "visualID": "1913444",
    "title": "Everyday Pleasantries",
    "description": "",
    "userID": "183691",
    "parentID": null,
    "thumbnailUpdatedOn": "2023-04-28 18:23:41",
    "fullname": "Aaron Reuland (a_ soluble_fish)",
    "membershipType": "1",
    "status": "1",
    "submittedOn": "2023-04-28 23:01:42"
  },
  {
    "visualID": "1886731",
    "title": "RNDP",
    "description": "I love patterns.",
    "userID": "324002",
    "parentID": null,
    "thumbnailUpdatedOn": "2023-04-02 23:46:11",
    "fullname": "Zaron Chen",
    "membershipType": "0",
    "status": "1",
    "submittedOn": "2023-04-02 23:48:43"
  },
  {
    "visualID": "1870023",
    "title": "Runes",
    "description": "Runes",
    "userID": "324002",
    "parentID": null,
    "thumbnailUpdatedOn": "2023-03-18 08:51:59",
    "fullname": "Zaron Chen",
    "membershipType": "0",
    "status": "1",
    "submittedOn": "2023-03-17 17:01:46"
  },
  {
    "visualID": "1613661",
    "title": "cuarta dosis",
    "description": "",
    "userID": "118807",
    "parentID": null,
    "thumbnailUpdatedOn": "2022-07-15 13:51:03",
    "fullname": "garabatospr",
    "membershipType": "1",
    "status": "1",
    "submittedOn": "2022-07-18 09:47:07"
  },
  {
    "visualID": "1587231",
    "title": "Stained Glass",
    "description": "Submission for @sableRaph's weekly creative coding challenge",
    "userID": "272186",
    "parentID": null,
    "thumbnailUpdatedOn": "2022-05-29 09:47:18",
    "fullname": "Ahmad Moussa || Gorilla Sun",
    "membershipType": "1",
    "status": "1",
    "submittedOn": "2022-07-17 19:32:51"
  },
  {
    "visualID": "1615215",
    "title": "Quilt",
    "description": "Submission for @sableRaph's Weekly Challenge, this week's topic being quilt",
    "userID": "272186",
    "parentID": null,
    "thumbnailUpdatedOn": "2022-07-16 15:16:38",
    "fullname": "Ahmad Moussa || Gorilla Sun",
    "membershipType": "1",
    "status": "1",
    "submittedOn": "2022-07-17 19:32:51"
  },
  {
    "visualID": "1608236",
    "title": "indecision (a Truchet)",
    "description": "",
    "userID": "183691",
    "parentID": null,
    "thumbnailUpdatedOn": "2022-07-01 20:51:54",
    "fullname": "Aaron Reuland (a_ soluble_fish)",
    "membershipType": "1",
    "status": "1",
    "submittedOn": "2022-07-01 18:24:19"
  },
  {
    "visualID": "1246869",
    "title": "wrapping paper",
    "description": "",
    "userID": "202203",
    "parentID": null,
    "thumbnailUpdatedOn": "2021-08-20 18:08:14",
    "fullname": "MeTH",
    "membershipType": "0",
    "status": "1",
    "submittedOn": "2022-05-28 22:04:22"
  },
  {
    "visualID": "1521029",
    "title": "Chicken Drumstick Background",
    "description": "",
    "userID": "202203",
    "parentID": null,
    "thumbnailUpdatedOn": "2022-03-19 19:40:31",
    "fullname": "MeTH",
    "membershipType": "0",
    "status": "1",
    "submittedOn": "2022-05-28 22:04:13"
  },
  {
    "visualID": "1491053",
    "title": "Arabesque",
    "description": "Submission for the Arabesque WCCChallenge",
    "userID": "272186",
    "parentID": null,
    "thumbnailUpdatedOn": "2022-02-19 14:55:56",
    "fullname": "Ahmad Moussa || Gorilla Sun",
    "membershipType": "1",
    "status": "1",
    "submittedOn": "2022-05-12 13:48:36"
  },
  {
    "visualID": "391590",
    "title": "circ, tria, quav2.b",
    "description": "",
    "userID": "66664",
    "parentID": "391585",
    "thumbnailUpdatedOn": "2016-11-29 01:30:43",
    "fullname": "Kamilla",
    "membershipType": "0",
    "status": "1",
    "submittedOn": "2021-04-17 18:33:50"
  },
  {
    "visualID": "498732",
    "title": "Wallpaper",
    "description": "Experimentation with curves and for loops - static image",
    "userID": "115164",
    "parentID": null,
    "thumbnailUpdatedOn": "2018-01-20 19:51:14",
    "fullname": "Christopher Reyes",
    "membershipType": "0",
    "status": "1",
    "submittedOn": "2021-04-17 18:33:28"
  },
  {
    "visualID": "881727",
    "title": "20200426_buzzing",
    "description": "",
    "userID": "12128",
    "parentID": null,
    "thumbnailUpdatedOn": "2020-04-26 03:07:28",
    "fullname": "Junichiro Horikawa",
    "membershipType": "0",
    "status": "1",
    "submittedOn": "2021-04-17 18:32:09"
  },
  {
    "visualID": "966011",
    "title": "200921",
    "description": "",
    "userID": "159668",
    "parentID": null,
    "thumbnailUpdatedOn": "2020-09-19 08:52:37",
    "fullname": "Sayama",
    "membershipType": "2",
    "status": "1",
    "submittedOn": "2021-04-17 18:31:51"
  },
  {
    "visualID": "1141989",
    "title": "Leaves",
    "description": "Leaves pattern inspired by leaves I saw in some floral tattoos.  I really liked the final result, I think it would look cool as a printed fabric",
    "userID": "45107",
    "parentID": null,
    "thumbnailUpdatedOn": "2021-03-20 18:29:43",
    "fullname": "Bárbara Almeida",
    "membershipType": "1",
    "status": "1",
    "submittedOn": "2021-04-14 19:37:33"
  },
  {
    "visualID": "1164426",
    "title": "Xor garden",
    "description": "",
    "userID": "154720",
    "parentID": "1159460",
    "thumbnailUpdatedOn": "2021-04-13 18:55:16",
    "fullname": "Naoki Tsutae",
    "membershipType": "0",
    "status": "1",
    "submittedOn": "2021-04-14 19:35:37"
  },
  {
    "visualID": "1163715",
    "title": "Rhombus Tiling Tutorial",
    "description": "",
    "userID": "254459",
    "parentID": null,
    "thumbnailUpdatedOn": "2021-04-13 23:43:38",
    "fullname": "Paul Wheeler",
    "membershipType": "1",
    "status": "1",
    "submittedOn": "2021-04-14 06:05:12"
  },
  {
    "visualID": "1153609",
    "title": "Tiling Tutorial",
    "description": "A brief tour of different types of mathematical tilings.",
    "userID": "254459",
    "parentID": null,
    "thumbnailUpdatedOn": "2021-04-14 06:06:10",
    "fullname": "Paul Wheeler",
    "membershipType": "1",
    "status": "1",
    "submittedOn": "2021-04-12 19:05:00"
  }
]
```

### Get Tags

https://openprocessing.org/api/tags?limit=100&offset=0&duration=anytime

PARAMS

limit: 100
offset: 0
duration: anytime
  can be "thisWeek", "thisMonth", "thisYear", "anytime"


#### Example Request:

```js
var axios = require('axios');

var config = {
  method: 'get',
maxBodyLength: Infinity,
  url: 'https://openprocessing.org/api/tags?limit=100&offset=0&duration=anytime',
  headers: { }
};

axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});

```

#### Example Response:

```json
[
  {
    "tag": "visualization",
    "quantity": "10283"
  },
  {
    "tag": "algicosathlon",
    "quantity": "9689"
  },
  {
    "tag": "game",
    "quantity": "8733"
  },
  {
    "tag": "noise",
    "quantity": "8498"
  },
  ...
  ... TRUNCATED FOR BREVITY
  ...
  {
    "tag": "つぶやきProcessing",
    "quantity": "868"
  },
  {
    "tag": "Creativecode",
    "quantity": "830"
  },
  {
    "tag": "shapes",
    "quantity": "821"
  },
  {
    "tag": "clock",
    "quantity": "806"
  },
  {
    "tag": "artworks",
    "quantity": "801"
  },
  {
    "tag": "2d",
    "quantity": "797"
  },
  {
    "tag": "arrays",
    "quantity": "797"
  },
  {
    "tag": "physics.",
    "quantity": "792"
  }
]
```