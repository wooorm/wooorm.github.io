---
title: Hello, EPUB!
description: brief intro to the format
author: Titus Wormer
tags:
  - epub
  - ebook
published: 2020-05-27
modified: 2020-05-27
---

# Hello, EPUB!

EPUB (*Electronic Publication*) is a format for ebooks.
It’s the most widely used open format for digital books.
EPUB files can be read on most all devices.
Sometimes not automatically, but then there are [converters][calibre] that
transform them to create different formats that are usable for your device.

A different format exists, which is unfortunately more popular: the Kindle
format, used by Amazon.
In fact, there are many Kindle formats: AZW (KF7); AZW1; AZW3 (KF8), AZW4, AZK
([summed up][azk-sum-up] as “AZK is another binary format created by Amazon for
reasons that are currently not clear”), AZW8, and many more.
Kindle is a proprietary mess, and I’m not interested in ranting or writing
about it.

There are many ways to create EPUB files, such as Word, Pages, or InDesign, but
this article shows that it’s code, which can be read and written by hand too!

## What’s in an EPUB?

EPUB can be thought of the web platform (HTML, CSS, images, sometimes JS), glued
together with XML, archived together with an `.epub` extension instead of
`.zip`.
Very much like a static site with a service worker to bring it offline, but
then instead of JavaScript, it’s bundled with XML into a single archive.

A good way to learn more about the web is View Source.
You can do that to with EPUBs: rename the file from `book.epub` to `book.zip`
and unzip that with your favorite tool (or do `unzip path/to/book.epub -d
path/to/directory` on unix/macos), then open the result in your text editor of
choice to see it’s made.

To create an EPUB, a couple things are needed.
What we’re going to create here is a directory with the following files:

```text
book/
  META-INF/
    container.xml
  content.opf
  index.xhtml
  mimetype
```

## `mimetype`

First, a file called `mimetype`, without extension, must exist in the root of
the folder, with following value exactly copied over:

```text
application/epub+zip
```

*Note: there must not be a newline at the end of that file*.

The existence and contents of the file signals that a ZIP archive, which could
be huge and slow to unzip, represents an epub ebook.

There isn’t much else to the file.
But if you’re interested, it’s specified in [EPUB OCF 3.2 § 4.3][ocf-4.3].

## `META-INF/container.xml`

The second requirement is that a `container.xml` file exists, in a `META-INF/`
directory.

The contents of `container.xml` looks like this:

```xml
<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
```

There is a tiny bit more to this file if you’re going to do weird things, but in
99.9% of cases this is exactly what you need.
If you’re interested, it’s specified in [EPUB OCF 3.2 § 3.5.2.1][ocf-3.5].
The role of this file is to point to the next XML file, through the path defined
with the `full-path` attribute on the `rootfile` element.

It could point to a different place (often: `OEBPS/content.opf`).
You’re free to structure your books as you please, but for this example I’m
keeping the file structure as flat as possible.

## `content.opf`

The last XML file that is needed is `content.opf`.
It can be placed anywhere in the book, but must be referenced correctly by the
`container.xml` file.

The bare minimum, with some extra metadata, looks like so:

```xml
<?xml version="1.0"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Book Title</dc:title>
    <dc:creator>Author Name</dc:creator>
    <dc:date>2020-02-27T00:00:00Z</dc:date>
    <dc:rights>Copyright © 2020 Author Name</dc:rights>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">2020-02-27T00:00:00Z</meta>
    <dc:identifier id="bookid">tag:example.com,2020:book-title:1</dc:identifier>
  </metadata>
  <manifest>
    <item id="index" href="index.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  </manifest>
  <spine>
    <itemref idref="index"/>
  </spine>
</package>
```

The file consists of a single `<package>` element, which includes three
sections each in separate container elements:

* `<metadata>`, which is sort of like the `<head>` in HTML (or
  [`.webmanifest`][webmanifest])
* `<manifest>`, which lists all the files that make up the book with their
  media types
* `<spine>`, which defines the items in `<manifest>` that make up the content
  of the book, and in what order they are to be placed

The last part, `<spine>`, is important to clarify: as books are typically long
form, and rendering hundreds of pages at once takes a while, ebooks are split
up in separate files, and concatenated together by EPUB readers.

For this small example, a single content file is fine, but typically books are
split up per chapter, or maybe even per section.

The `properties` attribute on `<item>` elements adds some extra data to that
entry.
In this case, it defines that the file it’s on contains the table of contents.
Something like `properties="scripted mathml"` would define that the file
includes JavaScript and MathML.

Another interesting part is that the `<package>` element has a
`unique-identifier` attribute, which points to another element by its `id`
attribute (which should be a `<dc:identifier>`).
Any URI can be placed in that element.
It could be an ISBN (such as `isbn:978-1-234567-89-1`), but there is no reason
to get one for ebooks (and it often costs money).
You can also use a UUID (such as `urn:uuid:B9B412F2-CAAD-4A44-B91F-A375068478A0`).
I like using the [tag URI scheme][scheme-tag].

The value of `<dc:identifier>` is a bit like the semver major: it shouldn’t
change for minor changes.

More info on the `content.opf` file is available in [EPUB Packages 3.2 §
3.4][p-3.4].

## Content

Last, we need content!
We’ve set up the needed ancillary files to make that happen.
We can now add a file, let’s call it `index.xhtml`, and add the following to it:

```html
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head>
    <meta charset="utf-8"/>
    <title></title>
  </head>
  <body>
    <h1 id="hello-world">Hello, World!</h1>
    <nav epub:type="toc">
      <h2>Contents</h2>
      <ol>
        <li><a href="#hello-world">Hello, World!</a></li>
      </ol>
    </nav>
  </body>
</html>
```

Important to note here that the syntax is in XHTML.
Not HTML.
They are slightly different syntaxes.
With HTML, the browser does more work to assume you had the best intentions.
With XHTML, you will be yelled at if you don’t put a slash on `<img/>`, amongst
other reasons.

Otherwise, this looks very similar to the HTML needed for a website: a
`<head>`, a `<body>`, the same semantic elements.

What may stand out though, is that it’s pretty big for a Hello World!
That’s mostly because of the table of content.
Almost all apps or ereaders support a quick way to get to that landmark, and
it’s something readers expect.
So it’s a required feature in EPUB files.

The `<head>` doesn’t matter as much in EPUB as when building a website, you
still use it to link to CSS, but the metadata that typically is in `<head>` is
now pulled out into `content.opf`.

A namespace is defined on the HTML element with `xmlns:epub`, linking the
prefix `epub` to the namespace `http://www.idpf.org/2007/ops`, and later
defining `epub:type="toc"` on the `<nav>` element.
There are other extra things you can do with the `epub:type` attribute, such as
footnotes, but that’s for another time.

## Final steps

Finally, what needs to be done is to combine those files into a ZIP archive.
Unfortunately, using your favorite ZIP archive tool won’t work, as there are
some peculiar things needed for EPUBs.
From the directory where you have your book files, do the following in a
terminal:

```sh
zip -0X book.epub mimetype; zip -0DXr book.epub . -x **/.* *.epub
```

> Note: this works on macOS, and I unfortunately don’t have experience with how
> to do it on other operating systems.
> Do let me know if you do!

What this does is create a file called `book.epub` in your book directory,
where `mimetype` is the first entry, and adding everything else (except for
hidden files or EPUBs), and *not* compressing the archive.

If you prefer GUIs over bash one liners, which is very understandable, [some of
them are listed here][gui].

This gives us an EPUB file, `book.epub`:

```diff
 book/
   META-INF/
     container.xml
+  book.epub
   content.opf
   index.xhtml
   mimetype
```

Which you can load up in for example Books.app.
Or Adobe Digital Editions.
Or some other ereader app that you prefer!

## Closing thoughts

I hope this walk through how to create a Hello, World! for EPUB shows that,
while a bit much and weird, it is doable to create EPUB files yourself, by
hand!

There’s a lot more to them though.
I think I’ll write more about EPUBs in the future.
When I do, I’ll link that up here!

<!-- Definitions. -->

[azk-sum-up]: https://wiki.mobileread.com/wiki/AZK

[calibre]: https://calibre-ebook.com

[gui]: https://ebookflightdeck.com/handbook/zipping

[ocf-3.5]: https://www.w3.org/publishing/epub3/epub-ocf.html#sec-container-metainf-container.xml

[ocf-4.3]: https://www.w3.org/publishing/epub3/epub-ocf.html#sec-zip-container-mime

[p-3.4]: https://www.w3.org/publishing/epub3/epub-packages.html#sec-package-def

[scheme-tag]: https://en.wikipedia.org/wiki/Tag_URI_scheme

[webmanifest]: https://developer.mozilla.org/docs/Web/Manifest
