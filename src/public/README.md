# `src/public/`

This directory contains the source for TypeScript declaration files that are
intended for users of the Mathlive library.

Thes files are bundled and package as a single `dist/mathlive.d.ts`.

They are also referenced by the (private) implementation of MathLive. In some
cases, the private implementation contains more information and information
details that are not exposed throught this public API. This makes it easier to
evolve the implementation while isolating the clients of the library for those
changes.
