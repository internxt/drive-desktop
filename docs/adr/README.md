# Architecture Decision Records

Each file here records one decision: what we were facing, what we chose, and what that costs us. They exist so that a year from now the reasoning is still available to whoever has to revisit the choice — including the arguments against what we picked.

## Reading them

They are plain markdown, numbered in the order they were taken. Nothing is needed to read them.

**They are never edited once accepted.** If a decision is replaced, the new record supersedes the old one and both are updated to link to each other; the old one stays where it is, marked as superseded. The history is the point.

## Writing one

Copy the most recent record, give it the next number, and keep the four headings: Status, Context, Decision, Consequences. Write the context so it makes sense to someone who was not in the room.

Optionally, [adr-tools](https://github.com/npryce/adr-tools) automates the numbering and the superseding links:

    adr new Title of the decision      # creates the next record
    adr new -s 2 Title                 # creates it, superseding record 2
    adr list

It is a set of bash scripts, so it is not installed through `package.json`. On Windows it runs under git bash — see the project's [INSTALL.md](https://github.com/npryce/adr-tools/blob/master/INSTALL.md#windows-10), and set `PAGER=less` or `adr help` will fail looking for `more`.

The tool is a convenience. What matters is what ends up in this directory, and that is the same either way.

The `.adr-dir` file at the repository root is what points the tool at this directory.
