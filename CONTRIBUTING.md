# Contributing to MathLive

There are many ways you can get involved with MathLive. Contributing to an open source project is fun and rewarding.

## Funding

If you're using MathLive consider donating to project development via [Patreon](https://patreon.com/arnog) (recurring donation) or [PayPal](https://www.paypal.me/arnogourdol) (one time donation). 

If you are using MathLive in your project, encourage the business partners in your organization to provide financial support of open source projects.

Funds go to general development, support, and infrastructure costs. 

We welcome both individual and corporate sponsors. In addition to Patreon and PayPal, we can also accept short-term development contracts for specific features or maintenance of the project.


## Contributing Issues

If you're running into some problems using MathLive or something doesn't 
behave the way you think it should, please file an issue in GitHub.

Before filing something, [have a look](https://github.com/arnog/mathlive/issues) 
at the existing issues. It's better to avoid filing duplicates. You can 
add a comment to an existing issue if you'd like.

### What happens after I file an issue?

1. After a bug is filed, it will be _awaiting review_
2. After the bug has been triaged, it will be have one or more labels assigned to it.
3. Once a developer has started working on the bug, the bug will be assigned to someone.
4. Once a bug has been resolve, it is closed. You can still comment on closed bugs, or re-open them if necessary.

In addition, issues can be tagged with the following:
* _high priority_: Catastrophic issue that impacts many users
* _medium priority_: Regression or issues that impact a significant number of users
* _low priority_: Low severity (minor cosmetic issue) or very few users impacted
* _no priority_: No plan to fix the issue, but we will consider a fix if someone offers a pull request
* _good first issue_: This is an issue that would be a good candidate for someone 
who has little experience with the code base
* _external_: This is an issue that has a dependency on an external component
(typically, a browser)
* _architecture_: This is an issue that requires a significant architectural
change
* _performance_: This issue affects perceived or measurable performance
* _cleanup_: Resolving this issue would improve the code base maintainability
without adding new functionality
* _unable to reproduce_ the bug, as reported, could not be replicated
by the developer. Additional information is necessary to continue investigating.
* _not a bug_: The behavior described in the issue report is actually
the intended behavior. This may be a usability issue, a documentation issue, 
or a disagreement regarding what the behavior should be.
* _fact of life_: The issue cannot be resolved due to constraints of
the browser, the OS, or the laws of physics.

### Can I help fix a bug?

Sure! Have a look at the issue report, and make sure no one is already 
working on it. If the issue is assigned to someone, they're on it! 
Otherwise, add a comment in the issue indicating you'd like to work on
resolving the issue and go for it! See the [Contributor Guide](CONTRIBUTOR_GUIDE.md) for coding guidelines.


## Contributing Test Cases

The `test/` folder contains test cases that are used to make sure that 
bugs are not introduced as new features are added (regression). 

Adding or updating test cases can be very helpful
to improve MathLive's quality. Submit an issue indicating what you'd like
to work on, and a pull request when you have it ready. Test cases should 
follow the TAP (Test Anything Protocol) format.


## Contributing Ideas and Feature Requests

Use the [issue tracker](https://github.com/arnog/mathlive/issues) to submit
requests for new features. First, have a look at what might already be there,
and if you don't see anything that matches, write up a new issue.

If you do see something similar to your idea, comment on it or add a 👍.

## Contributing Code

Whether you have a fix for an issue, some improved test cases, or a brand
new feature, we welcome contributions in the form of pull requests. 
Once submitted, your pull request will be reviewed and you will receive
some feedback to make sure that your pull request fits in with
* the roadmap for MathLive
* the architecture of the project
* the coding guidelines of the project

Before we can consider merging your pull request, you must sign the 
Contributor License Agreement here: 

<a href="https://cla-assistant.io/arnog/mathlive"><img src="https://cla-assistant.io/readme/badge/arnog/mathlive" alt="CLA assistant" /></a>

Once your pull request has been accepted, it will be merged 
into the master branch.

Congratulations, you've become a Mathlive contributor! Thanks for your help!
