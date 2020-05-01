# MathLive Speech Example

This example shows how to configure the MathLive text-to-speech features.

There are two aspects that can be configured independently:

1. Speech Rules: the set of rules use to produce readable text from a math expression. MathLive has a built-in set of speech rules, but it can also be configured to use Volker Sorge's Speech Rule Engine.

2. Text-to-Speech engine: the software used to transform the readable text produced by the speech rules into sound. By default, the TTS engine provide by the operating system will be used, but MathLive can be configured to use the Amazon Cloud TTS engine as well.

## Speech Rules

The format of the output can be configured using the `textToSpeechMarkup` configuration option. Set it to:

-   `'ssml'` to request an output using the SSML markup language. Both SRE and the MathLive rules can produce this format.
-   `'mac'` to request an output using Mac OS speech markup, e.g. '[[slc 150]]'. This format can only be used on Mac OS (and may not work will all browsers). On platforms other than Mac OS, this option does nothing.
-   `''` (empty string) to request no markup.

The Amazon TTS engine supports SSML, and it is recommended to use this option for the highest quality.

To use Volker Sorge's SRE:

1. Include the browser version of the SRE JavaScript file in your project. You can download it on [GitHub](https://github.com/zorkow/speech-rule-engine)
2. Set the `textToSpeechRules` configuration key to `'sre'`.

You can configure SRE by setting the `textToSpeechRulesOptions` configuration key. For example:

```javascript
textToSpeechRulesOptions: {
    domain: 'mathspeak', // 'mathspeak' or 'chromevox'
    ruleset: 'mathspeak-brief',   // 'mathspeak-default', 'mathspeak-brief', 'mathspeak-sbrief', 'chromevox-short', 'chromevox-default' or 'chromevox-alternative'
},
```

## Text-to-Speech Engine

### Using the Local TTS Engine

To use the local (built-in, OS specific) TTS engine, set the `speechEngine` configuration key to `'local'`.

There is great variation between platforms (and browsers) on the quality of the TTS engine. However, it can be used even when offline, while the Amazon TTS engine offers higher quality and better consistency, but it does require a network connection.

### Using Amazon Polly TTS Engine

1. Include the AWS SDK for JavaScript in your app. See [here for details](https://aws.amazon.com/sdk-for-browser/).
   This may be as simple as adding this:

```html
<head>
    <script src="https://sdk.amazonaws.com/js/aws-sdk-2.657.0.min.js"></script>
    <script>
        AWS.config.region = 'eu-west-1';
        AWS.config.accessKeyId = 'YOUR-KEY';
        AWS.config.secretAccessKey = 'YOUR-SECRET';
    </script>
</head>
```

See [npm](https://www.npmjs.com/package/aws-sdk) for the latest version.

2. To get the necessary keys, follow [these instructions](https://docs.aws.amazon.com/polly/latest/dg/setting-up.html)

    2.1 Create a custom policy in your [AWS console](https://console.aws.amazon.com/iam/home) with action: Read SynthesizeSpeech and a request condition of a referer with a StringEquals to your domain, e.g. 'https://example.com/*'

    2.2 Create a group, and associated it with the policy above

    2.3. Create a new user, for example the name of your app. Give it 'programmatic access' and associate it with the group above

    2.4 At the end of the creation, you will be provided by the access key and the secret access key.

Carefully consider what you do with the access and secret access keys. Although with the setup above you have somewhat restricted them to a domain, they could be abused if accessed by an unauthorized user. To prevent this, you could require users to authenticate and use AWS Cognito.

### Using the Google Cloud TTS Engine

NOTE: THE GOOGLE CLOUD TTS ENGINE IS NOT YET SUPPORTED

To use the Google Cloud TTS engine you will need to create a Google Cloud Platform project, enable billing for the project, enable it to use the TTS API, and obtain a **service account key**. See [detailed instructions from Google.](https://cloud.google.com/text-to-speech/docs/quickstart-protocol).

After creating the **service account key** and downloading the JSON file containing it to your local machine, install the Google Cloud SDK, then run

```sh
$ gcloud auth activate-service-account --key-file=/PATH/TO/KEYFILE.json
```

Set the `GOOGLE_APPLICATION_CREDENTIALS` variable to point to your keyfile

```sh
$ GOOGLE_APPLICATION_CREDENTIALS=/PATH/TO/KEYFILE.json
```

Login into the auth console

```sh
$ gcloud auth application-default login
```

Run

```sh
$ gcloud auth application-default print-access-token
```

This should spit out an access key.

Set the `speechEngine` configuration key to `'google'`

Set the `speechEngineToken` configuration key to the access key obtained earlier.
