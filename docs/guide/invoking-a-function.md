# Invoking a function

We've just created and deployed our very first service to our cloud provider.

The service skeleton which Serverless created for us included a function with a corresponding function handler (the
`handler.js` file).

Let's invoke this function to see if the service was deployed successfully.

## Invoking the `hello` function

Run `serverless invoke --function hello` in the service directory to tell Serverless
that you want to run the function on the providers infrastructure.

The function will be invoked and returns the result back to Serverless which will print it out on the terminal.

As a result of this you should see the functions message printed out on the console.

Great! We've just invoked our function from the Serverless CLI.

## Invoke options

The invoke command provides different options you can use. Please take a look at the
[invoke plugins documentation](/lib/plugins/invoke) to see what else you can do.

## Conclusion

We've just invoked a function through the Serverless CLI on the providers infrastructure and got a message back which
was printed on the console. Now lets take a look at how to view the logs of a function after our first invoke.

[Next step > Viewing Function Logs](viewing-function-logs.md)
