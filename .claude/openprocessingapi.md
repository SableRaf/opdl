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

All endpoints that return an array (such as `/user/1/sketches`) also accept limit, offset and sort as a query parameters. If avaiablr, the server response headers will also include `hasMore` boolean value. Based on this value, you can use a separate call to retrieve further data. Sorting ['asc' or 'desc'] is done on the most logical column per result set (such as createdOn date for sketches, submittedOn date for curation sketches, heart date for user/1/hearts, etc.).

[Example Endpoint](https://openprocessing-api.postman.co/workspace/OpenProcessing~48fc0333-1f24-40f1-a2c0-48b40b459b9c/request/16936458-9b6ab14a-e4d5-468e-9154-c7f0b2a9c6f7?ctx=documentation): `https://openprocessing.org/user/1/sketches?limit=10&offset=0&sort=desc`

Rate Limit
----------

To prevent web-scaping and server overload, there is a rate limit for 40 API calls per minute.

### GET: Get User

https://openprocessing.org/api/user/1

You can access the public user information with this call.

Example Request

Get User

View More

nodejs

```
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

Example Response

-   Body
-   Headers (1)

json

```
{
  "userID": "1",
  "fullname": "Sinan Ascioglu",
  "bio": "OpenProcessing master magician. Trying to stop obsessing with icon alignment.",
  "memberSince": "2008-02-06 22:58:37",
  "website": "https://wiredpieces.com",
  "location": "Brooklyn, NY"
}
```

### GET: Get User Sketches

https://openprocessing.org/api/user/1/sketches

Example Request

Get User Sketches

View More

nodejs

```
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

Example Response

-   Body
-   Headers (1)

View More

json

```
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
  {
    "visualID": "53115",
    "title": "matrix extended",
    "description": "I was wondering to use this as a background on underConstruction page on the website. Slightly modified version of http://www.openprocessing.org/visuals/?visualID=39375 by Mike Y."
  },
  {
    "visualID": "59927",
    "title": "nov13a_2011_iridescence.",
    "description": "This is a tweak of Raven Kwoks's sketch. Made the layout landscape and increased the particle amount and damper width to make it slightly more colorful and playful. Performance suffered though..."
  },
  {
    "visualID": "60329",
    "title": "harmony_web_remake pjs",
    "description": "I created a tweak of mitchell whitelaw's sketch. Increased the threshold to make the networking effect more visible and made the line colors dependent on distance to the connection."
  },
  {
    "visualID": "71625",
    "title": "leafExperience",
    "description": "A sketch that takes experiments with changing interaction behaviors. Takes users through an experience of creating a tree, the leaves, and being a wind that blows the leaves away, all accompanied by a story."
  },
  {
    "visualID": "71673",
    "title": "leafExperience in processingjs",
    "description": ""
  },
  {
    "visualID": "74032",
    "title": "leafExperience",
    "description": ""
  },
  {
    "visualID": "74053",
    "title": "leafExperience",
    "description": ""
  },
  {
    "visualID": "86239",
    "title": "test sketch",
    "description": ""
  },
  {
    "visualID": "88819",
    "title": "The Work of an Obsessive Compulsive Pessimist Painter",
    "description": "I did this while randomly trying some other thing. This extremely simple sketch looked like some guy trying to sketch some lines over and over. As if he doesn't like what he likes.\n\nInteresting thing is, changing the two variables (frameRate and lines) have drastic changes on the mood the sketch creates."
  },
  {
    "visualID": "88822",
    "title": "The Work of an Obsessive Compulsive Pessimist Painter",
    "description": "Tweaked it with some randomness. This made it feel more live performance than a timelapse I think."
  },
  {
    "visualID": "88826",
    "title": "GridNoise3D in Canvas!",
    "description": "This is a tweak of Joshua Davis's sketch. I changed it to OPENGL (since P3D doesn't work on browsers) to make it work in HTML5 canvas element using processing.js. I had to decrease the number of dots because the performance was very poor."
  },
  {
    "visualID": "96792",
    "title": "Twk: Colorymini",
    "description": "this is a tweak test of colorymini"
  },
  {
    "visualID": "102561",
    "title": "Ass1JavaScript",
    "description": ""
  },
  {
    "visualID": "103398",
    "title": "SonicPainterJavaScript",
    "description": ""
  },
  {
    "visualID": "118094",
    "title": "Twk: pjsComplexSketch",
    "description": ""
  },
  {
    "visualID": "119315",
    "title": "Twk: sketch test",
    "description": ""
  },
  {
    "visualID": "119361",
    "title": "Twk: pjsComplexSketch",
    "description": ""
  },
  {
    "visualID": "119362",
    "title": "My New Sketch",
    "description": ""
  },
  {
    "visualID": "119508",
    "title": "Twk: Aufgabe4 moderne Uhr",
    "description": "This sketch is supposed to display additional elements but processingjs seems to crash while compiling. I will submit a report to processingjs team to see if they have a solution/fix."
  },
  {
    "visualID": "119595",
    "title": "swirlies",
    "description": ""
  },
  {
    "visualID": "119598",
    "title": "My New Sketch",
    "description": ""
  },
  {
    "visualID": "119667",
    "title": "pjsComplexSketch",
    "description": ""
  },
  {
    "visualID": "119668",
    "title": "Twk: pjsComplexSketch",
    "description": ""
  },
  ... TRUNCATED ...
]
```

### GET: Get User Followers

https://openprocessing.org/api/user/1/followers?limit=10&offset=0&sort=desc

PARAMS

limit

10

offset

0

sort

desc

Example Request

Get User Followers

View More

nodejs

```
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

Example Response

-   Body
-   Headers (1)

View More

json

```
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
  ... TRUNCATED ...
]
```

### GET: Get Users Following

https://openprocessing.org/api/user/1/following?limit=10&offset=0&sort=desc

PARAMS

limit

10

offset

0

sort

desc

Example Request

Get Users Following

View More

nodejs

```
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

Example Response

-   Body
-   Headers (1)

View More

json

```
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
  {
    "userID": "315300",
    "fullname": "antlii",
    "membershipType": "1",
    "followedOn": "2023-02-20 12:59:03"
  },
  {
    "userID": "313345",
    "fullname": "andreoliveira.cebola",
    "membershipType": "0",
    "followedOn": "2023-02-20 12:58:15"
  },
  {
    "userID": "244319",
    "fullname": "Charmonder",
    "membershipType": "0",
    "followedOn": "2023-02-15 15:01:08"
  },
  {
    "userID": "356657",
    "fullname": "altunenes",
    "membershipType": "0",
    "followedOn": "2023-02-06 15:20:46"
  },
  {
    "userID": "292650",
    "fullname": "Faze",
    "membershipType": "0",
    "followedOn": "2023-01-01 19:56:01"
  },
  {
    "userID": "260656",
    "fullname": "Jycer",
    "membershipType": "0",
    "followedOn": "2022-12-21 10:55:07"
  },
  {
    "userID": "66773",
    "fullname": "Prasanta Kr Dutta",
    "membershipType": "0",
    "followedOn": "2022-12-20 10:50:59"
  },
  {
    "userID": "278169",
    "fullname": "mattywillo_",
    "membershipType": "0",
    "followedOn": "2022-12-14 16:01:57"
  }
]
```

### Get Sketch Forks

https://openprocessing.org/api/sketch/1029981/forks?limit=10&offset=0&sort=desc

Get forks of a given sketch. This returns an array of sketch info.

PARAMS

limit

10

offset

0

sort

desc

Example Request

Get Sketch Forks

View More

nodejs

```
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

Example Response

-   Body
-   Headers (1)

View More

json

```
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

Get forks of a given sketch. This returns an array of sketch info.

PARAMS

limit

10

offset

0

sort

desc

Example Request

Get Sketch Hearts

View More

nodejs

```
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

Example Response

-   Body
-   Headers (1)

View More

json

```
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
```

### Get Curation

https://openprocessing.org/api/curation/78544

Returns curation information.

PARAMS

limit

1

offset

2

Example Request

Get Curation

View More

nodejs

```
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

Example Response

-   Body
-   Headers (1)

View More

json

```
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

limit

10

offset

0

sort

desc

Example Request

Get Curation Sketches

View More

nodejs

```
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

Example Response

-   Body
-   Headers (1)

View More

json

```
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
  ... TRUNCATED ...
]
```

### Get Tags

https://openprocessing.org/api/tags?limit=100&offset=0&duration=anytime

PARAMS

limit

100

offset

0

duration

anytime

can be "thisWeek", "thisMonth", "thisYear", "anytime"

Example Request

Get Tags

View More

nodejs

```
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

Example Response

-   Body
-   Headers (0)

View More

```
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
```