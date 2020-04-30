<!-- lint disable lint-first-heading-level -->

# [`wooorm.com`][site]

[![][screenshot]][site]

## Build

To build the site, create a `.env` file with the following tokens, from GitHub,
OpenCollective, Last.fm, Trakt.tv, and The Movie DB.

```ini
GH_TOKEN=123123123
OC_TOKEN=123123123
LFM_TOKEN=123123123
LFM_USER=username
TTV_TOKEN=123123123
TTV_USER=username
TMDB_TOKEN=123123123
```

Do `npm i` and then `npm t`, which checks and builds the site.

[site]: https://wooorm.com

[screenshot]: screenshot.png
