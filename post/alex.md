---
title: alex
description: reflections on alex
author: Titus Wormer
tags:
  - alex
published: 2020-05-26
modified: 2020-05-26
---

# alex

I wanted to write a bit about [alex](https://alexjs.com).
Why it exists.
Why I spend my free time making it better.
Where it’s at.

## Origin

About 7 years ago I got excited about natural language.
I got into programming.
I pushed some projects to GitHub, people raised issues, submitted pull
requests, and I became a maintainer.

As you join a community, you become aware of its problems.
At first you’re new and you listen—or, that’s what I did at least, around
experienced developers from other countries communicating in a different
language.
After a bit it becomes your responsibility to deal with the community’s
problems.

I got annoyed by `he` in code when referring to users, instead of `they`.
Especially when there was
[pushback](https://github.com/django/django/pull/2692).
Against “trivial” and “PC” suggestions to fix it.
A friend pointed to a tweet showing problems with `master`/`slave`.
Suggested there should be something for that, and wondered if I could make
something given my experience.
I felt it was my job as a maintainer to make sure our community, our readmes
and docs, are welcoming and inclusive; to do something within my capabilities
about it; and hoped that other people would be more inclusive too.

I looked for guidelines on these topics, made a list of potentially problematic
words and their alternatives, wrapped it up in
[`retext-equality`](https://github.com/retextjs/retext-equality/tree/c03133b),
and published [`alex`](https://github.com/get-alex/alex/tree/3621b0a).
People got angry, as they felt censored by alex for preventing them from saying
“you guys”.
Harassment ensued.
Threats were made.
Open source hasn’t been the same since.

Luckily other folks got excited by a tool that could help.
Hundreds have since emailed more articles, clarified suggestions, added
features, worked on translations, educated folks, helped fend of harassers, and
contributed in other ways.

People feel very strongly about the language they use.
They should.
Being able to voice your ideas, your opinions (within reason) is important.
But language can also be poison.
Changing it is hard.
Time, education, and conversation change language.

## State

It seems documentation is doing okay now: the singular they is common.
Other sectors too are [dropping insensitive
terms](https://www.theregister.co.uk/2020/05/02/uks_ncsc_whitelist_blacklist/).
I’m biased but it seems like there’s more positive change here now than 5
years ago.
In other parts, language’s outlook is bleak.
Think orange monkey.
It’s important to fight against the normalization and seeping spread of extreme
and racist language.
Especially if you’re part of the majority.

I’m pretty happy with what alex has become, but am aware of the inherent
limitations.
alex is a program that analyses language.
Human language is unbelievably complex and nuanced.
It changes constantly.
Crucial to using language is understanding context: who is talking to whom,
what they have in common, what they’re discussing.
alex can’t understand context, a limitation that shows itself readily when you
try to write documentation about the HTML attribute, `disabled`.
In some cases, “person with a disability” is better (it depends), but when
talking about HTML, naming the particular attribute is unavoidable.
That’s one specific example, but many more exist: words that are offensive in
one community but not another, or slurs that were used historically but are now
unknown.
Sometimes suggestions also discriminate.
When given `act like a man`, alex suggests `resolutely` and `bravely`.
Instead of saying: `that’s sexist, prick`.
I think it’s good to assume that someone didn’t know and hope that they’re
interested in a better alternative, but it can hurt too.
It’s extremely unfair.

alex is meant to bring up potentially offensive or inconsiderate writing.
It’ll never know language like a person, so it’ll be wrong: you can
ignore those messages, or
[configure](https://github.com/get-alex/alex#configuration) to skip those words
or change the profanity sureness setting.
alex doesn’t automatically replace words, and it shouldn’t be [followed
carelessly](https://github.com/retextjs/retext-equality/pull/74#issuecomment-451213456).
Where any of the documentation implies that it could solve problems I’d like to
make sure that it doesn’t.

One particular feature that was requested was profanities: a list of terms that
in certain scenarios are inappropriate.
People thought it was weird that, when given `She’s a slut`, alex would
complain about the former but not the latter.
I initially felt that it didn’t belong in alex, but after a
[long discussion](https://github.com/get-alex/alex/issues/46), the conversation
convinced me that it did.
They were added.
It was [annoying (and bad)](https://github.com/get-alex/alex/issues/92).
I tried to make it better.

I recognize that I have no right to decide what is and isn’t inconsiderate.
But I can maintain a project and do the work for others based on sources and
consensus.

## Technology

Technology is not a solution.
Maybe it formats your code, but it doesn’t solve everything.
It definitely does not fix societal issues such as structural discrimination.

It’s been suggested to use a machine learning approach for alex, in the hope of
removing bias and expanding what it catches.
I have no experience in that field, so I may be wrong, but ML needs to train on
data, leading to preexisting problems in said data becoming part of the data
model.
An example of how that is problematic, is that time when [Amazon tried to get
rid of human bias in the interview
process](https://www.reuters.com/article/us-amazon-com-jobs-automation-insight-idUSKCN1MK08G).
Smarter computers aren’t going to save us.
A rule based system such as alex will also inherit the biases of contributors
and sources, but at least they’re visible.

alex is a techno-optimism.
It makes inclusion a checklist.
I wonder if all checklists are bad.
Whether there’s a threshold.
Our community definitely has an unhealthy fondness for adding more tools to
solve for anything.

Maybe alex as a tool isn’t right, but the
[data](https://github.com/retextjs/retext-equality/tree/master/data/en)
that various groups contributed is?

Sometimes alex is harmful.
It’s a start, not enough.
It has helped get projects, teams, and companies to stop using
he/master/slave/simple/easy and other words, to double check their language, to
start the conversation.
For example,
[`facebook/react-native-website#1337`](https://github.com/facebook/react-native-website/pull/1337).

## Hindsight

I’m glad that people feel empowered to create PRs to make docs better when
backed by a project like alex, instead of only their personal opinions under
their belt.

I’m grateful for everyone who believes that the language we use in our
community and society matters and must be better.
Including the newcomers making their first contribution, the technical writers,
experienced maintainers, and everyone else who made alex.
But also generally, for anyone who speaks up and does something about it.
Most importantly though, it’s not on the people that are hurt by our language
to speak up and fix it.
It’s on the people in privileged positions.

alex isn’t perfect.
I want to make it better.
One actionable todo is to make alex’ shortcomings, laid out here, more clear in
the project: that it’s a tool to help, not a solution.
That it’s for language that shouldn’t have context, such as technical docs,
instead of an email to a friend.
To focus more on education.

A project that does focus on education is
[Self-Defined](https://www.selfdefined.app)
([`tatianamac/selfdefined`](https://github.com/tatianamac/selfdefined)).
Described in their own words as “A modern dictionary about us;
We define our words, but they don’t define us.”
While work in progress, it’s a valuable resource.
The continued effort is worthy of support.
I’m a sponsor, and dear reader, would suggest you do the same
([OpenCollective](https://opencollective.com/selfdefined) or personally
to [Tatiana Mac](https://github.com/sponsors/tatianamac)).
It’s a tremendous amount of work.
I’m happy that people, specifically Tatiana, are doing it.
And that it’s supported by the community.
I hope there’s a future where projects can work together.

There’s room.
There’s a vacuum where open (source) projects that instill social change should
exist.
We need more of that instead of the next new framework.

I am always open to feedback on how to make alex better.
On its [repository](https://github.com/get-alex/alex#integrations) or feel free
to slide into my DMs.

*Thanks to Nat Alison for
pointing out
that alex isn’t good enough.
I’m grateful that she devoted time critiquing alex.*
