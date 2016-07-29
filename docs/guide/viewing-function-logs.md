# Viewing Function Logs

After you deploy your service, and invoke it to generate some default logs provided by AWS, you can view those logs right from your terminal using the `serverless logs` command.

## Viewing the `hello` function logs

Run `serverless logs --function hello` to fetch the logs of the `hello` function from CloudWatch. If your function has never been invoked, you may not see any output/logs. For testing we recommend you invoke your function first before logging.

By default, Serverless will fetch all the logs that happened in the past 30 minutes. You can overwrite this behavior by providing extra options. (keep reading!).

The logs will then be displayed on your terminal. By default, AWS logs a `START`, `END` & `REPORT` logs for each invocation, plus of course any logging functionality you have in your code. You should see all these logs on the screen.

## Logs options

The logs command provides different options you can use. Please take a look at the
[logs plugins documentation](/lib/plugins/logs) to see what else you can do.

## Conclusion

We've just invoked a function through the Serverless CLI on the providers infrastructure and got a message back which
was printed on the console.

A service with functions alone is just the beginning. Event sources provide a really easy and great way to empower your
service and perform automatic function calls based upon incoming events (e.g. an incoming HTTP request).

Let's take a closer look at how we can use different event sources and attach them to our function.

[Next step > Event sources](event-sources.md)
