# Contributing to MathLive

There are many ways you can get involved with MathLive. Contributing to an open
source project is fun and rewarding.

## Funding

If you are using MathLive in your project, encourage the business partners in
your organization to provide financial support of open source projects,
including MathLive. Contact [me](arno@arno.org) to discuss possible arrangments
which can run from short-term contracts for specific features or integration
support (I can invoice the work), to one-time or recurring donation to support
the work in general.

Funds go to general development, support, and infrastructure costs.

## Contributing Issues

If you're running into some problems using MathLive or something doesn't behave
the way you think it should, please file an issue in GitHub.

Before filing something, [have a look](https://github.com/arnog/mathlive/issues)
at the existing issues. It's better to avoid filing duplicates. You can add a
comment to an existing issue if you'd like.

To speed up the resolution of an issue, including a pointer to an executable
test case that demonstrates the issue, if applicable.

### Can I help fix a bug?

Sure! Have a look at the issue report, and make sure no one is already working
on it. If the issue is assigned to someone, they're on it! Otherwise, add a
comment in the issue indicating you'd like to work on resolving the issue and go
for it! See the [Contributor Guide](documentation/CONTRIBUTOR_GUIDE.md) for
coding guidelines.

## Contributing Test Cases

The `test/` folder contains test cases that are used to make sure that bugs are
not introduced as new features are added (regression).

Adding or updating test cases can be very helpful to improve MathLive's quality.
Submit an issue indicating what you'd like to work on, and a pull request when
you have it ready. Test cases should follow the TAP (Test Anything Protocol)
format.

## Contributing Ideas and Feature Requests

Use the [issue tracker](https://github.com/arnog/mathlive/issues) to submit
requests for new features. First, have a look at what might already be there,
and if you don't see anything that matches, write up a new issue.

If you do see something similar to your idea, comment on it or add a 👍.

## Contributing Code

Whether you have a fix for an issue, some improved test cases, or a brand new
feature, we welcome contributions in the form of pull requests. Once submitted,
your pull request will be reviewed and you will receive some feedback to make
sure that your pull request fits in with

- the roadmap for MathLive
- the architecture of the project
- the coding guidelines of the project

Once your pull request has been accepted, it will be merged into the master
branch.

Congratulations, you've become a MathLive contributor! Thanks for your help!

## Build Instructions

Before you can do a local build of MathLive, you need to have the following
dependencies installed:
- [npm](https://www.npmjs.com/), which will also install [Node.js](https://nodejs.org)
- [Playwright](https://playwright.dev/), to run the test suite
- If you're using Windows, you will need to install the `bash` shell. The `bash` shell is
  required and pre-installed on macOS and Linux. For instructions
  on how to install `bash` on Windows, see the [this article](https://www.howtogeek.com/249966/how-to-install-and-use-the-linux-bash-shell-on-windows-10/)

Now that you have the dependencies installed, you can [fork and clone](https://docs.github.com/en/get-started/quickstart/fork-a-repo) this repository. 

Then, in the cloned project folder, use the following commands to start a local dev server:
``` bash
# Install dependencies
npm install

# Run local dev server with live reload
# After running this command, point your browser to http://127.0.0.1:9029/dist/smoke/
npm run start
```

To run the test suite locally, run the following commands (if the dev server is running, close it using Ctrl-C before running these commands):
``` bash
# Install playwright browsers
# This only needs to be done once for each version of playwright
# Additional installation of browser dependencies may be required, follow instructions
npx playwright install

# Build the production version of MathLive
npm run build

# Run test suite
npm test
```

Note that, because of how the dev server manages files, `npm run build` needs to be run before
each `npm test` run. When debugging the Playwright browser tests, the `npx playwright test` command can be used to run only the Playwright tests. When running the Playwright tests directly, `npm run build` is not required. Also, the Playwright tests, when run with `npx playwright test`, can be run while the dev server is running.