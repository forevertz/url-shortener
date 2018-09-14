# URL Shortener

A simple open source URL shortener.

<a href="https://github.com/forevertz/url-shortener/blob/master/LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT_License-blue.svg?style=flat" /></a>

## Features

- **Simple** — Exposes a microservice with two endpoints: `POST /shortlink` (to add a shortlink) and `GET /:shortlinkCode` (to redirect to the defined URL, and call a hook if defined).

- **Fast** — Uses [zeit/micro](https://github.com/zeit/micro) as server and [Redis](https://redis.io) as database.

- **Hook** — You can define a hook URL when you add a shorlink. When GET is called, a POST request is sent to the hook with the following data: `{ shortlinkCode, url, ip, ua, langs }`.

- **TTL** — Shortlinks are deleted are 90 days.

- **MIT license** — Use it like you want.

## Getting Started

```shell
$ docker run -d --name myredis redis:alpine redis-server --appendonly yes
$ docker run -d -p 3000:3000 -e REDIS=//myredis:6379 --link myredis forevertz/url-shortener
```

or

```shell
$ git clone https://github.com/forevertz/url-shortener && cd url-shortener
$ docker-compose up -d
```

### Examples

#### POST /shortlink

```bash
$ curl --request POST \
       --header "Content-Type: application/json" \
       --data '{ "url": "https://github.com/forevertz/url-shortener" }' \
       http://localhost:3000/shortlink

{
  code: "_oEj5e",
  link: "http://localhost:3000/_oEj5e"
}
```

```bash
$ curl --request POST \
       --header "Content-Type: application/json" \
       --data '{ "url": "https://github.com/forevertz/url-shortener", "hook": "https://my.hook" }' \
       http://localhost:3000/shortlink

{
  code: "VA40C-",
  link: "http://localhost:3000/VA40C-"
}
```

#### GET /:shortlinkCode

```bash
$ curl http://localhost:3000/VA40C-

Status Code: 302
Location: https://github.com/forevertz/url-shortener

# a POST request is sent to https://my.hook with the following data:
{
  shortlinkCode: 'VA40C-',
  url: 'https://github.com/forevertz/url-shortener',
  ip: req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
  ua: req.headers['user-agent'],
  langs: req.headers['accept-language']
}
```
